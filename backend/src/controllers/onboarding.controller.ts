import type { Request, Response, NextFunction } from "express";
import { Repository } from "../models/repo.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { generateAnswer } from "../services/llm.service.js";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";

// ── Icon mapping for each section type ──
const SECTION_CONFIG: Record<string, { title: string; icon: string }> = {
  entryPoints: { title: "Entry Points", icon: "entry" },
  dataModels: { title: "Data Models & Schemas", icon: "data" },
  uiComponents: { title: "Core UI Components", icon: "ui" },
  apiLayer: { title: "API Controllers & Routes", icon: "api" },
  services: { title: "Services & Business Logic", icon: "services" },
  abstractions: { title: "Key Interfaces & Abstractions", icon: "abstractions" },
  testSuite: { title: "Test Suite", icon: "test" },
};

export const generateOnboardingGuide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const repoId = req.params.id;

    if (!repoId) throw new AppError("Repository ID is required", 400);

    const repo = await Repository.findById(repoId);
    if (!repo) throw new AppError("Repository not found", 404);

    // Return the cached guide if it already exists AND is in the new format
    if (repo.onboardingGuide && repo.onboardingGuide.sections) {
      return res.status(200).json({
        success: true,
        guide: repo.onboardingGuide,
      });
    }

    // ── Step 1: Detect what's in this repo ──
    const files = await FileMetadata.find({ repoId }).limit(200).lean();
    const entities = await CodeEntity.find({ repoId }).limit(300).lean();

    // Detect languages
    const languages = [...new Set(entities.map((e) => e.language).filter(Boolean))];
    const entityTypes = [...new Set(entities.map((e) => e.type))];
    const filePaths = files.map((f) => f.filePath.toLowerCase());
    const entityNames = entities.map((e) => e.name.toLowerCase());

    // ── Step 2: Decide which sections to include ──
    const sectionsToRequest: string[] = ["entryPoints"]; // Always include

    // Data Models: if we see model/schema files or class entities
    const hasModels =
      filePaths.some(
        (p) =>
          p.includes("model") ||
          p.includes("schema") ||
          p.includes("entity") ||
          p.includes("migration") ||
          p.includes("prisma") ||
          p.includes("proto")
      ) || entityTypes.includes("class");
    if (hasModels) sectionsToRequest.push("dataModels");

    // UI Components: if React/Vue/Angular/Svelte detected
    const hasUI =
      files.some((f) => f.hasReactComponent) ||
      filePaths.some(
        (p) =>
          p.includes("component") ||
          p.includes(".tsx") ||
          p.includes(".jsx") ||
          p.includes(".vue") ||
          p.includes(".svelte") ||
          p.includes("pages/") ||
          p.includes("views/") ||
          p.includes("templates/")
      );
    if (hasUI) sectionsToRequest.push("uiComponents");

    // API Layer: controllers, routes, handlers, views (Django/Flask)
    const hasAPI = filePaths.some(
      (p) =>
        p.includes("controller") ||
        p.includes("route") ||
        p.includes("handler") ||
        p.includes("endpoint") ||
        p.includes("resolver") ||
        p.includes("views.py") ||
        p.includes("urls.py") ||
        p.includes("api/")
    );
    if (hasAPI) sectionsToRequest.push("apiLayer");

    // Services: business logic layer
    const hasServices = filePaths.some(
      (p) =>
        p.includes("service") ||
        p.includes("usecase") ||
        p.includes("interactor") ||
        p.includes("repository") ||
        p.includes("manager") ||
        p.includes("helper") ||
        p.includes("util")
    );
    if (hasServices) sectionsToRequest.push("services");

    // Abstractions: interfaces, traits, protocols, abstract classes
    const hasAbstractions =
      entityTypes.includes("interface") ||
      entityNames.some(
        (n) => n.includes("trait") || n.includes("protocol") || n.includes("abstract")
      );
    if (hasAbstractions) sectionsToRequest.push("abstractions");

    // Tests
    const hasTests =
      files.some((f) => f.isTestFile) ||
      filePaths.some((p) => p.includes("test") || p.includes("spec") || p.includes("__tests__"));
    if (hasTests) sectionsToRequest.push("testSuite");

    // ── Step 3: Build the dynamic prompt ──
    const langStr = languages.length > 0 ? languages.join(", ") : "unknown";

    let prompt = `Analyze the repository '${repo.name}' (languages: ${langStr}) and create an onboarding guide for a new developer.\n\n`;

    prompt += `### Files Context:\n`;
    files.forEach((f) => {
      const lang = f.language || "";
      prompt += `- ${f.filePath} (language: ${lang}, React: ${f.hasReactComponent}, Backend: ${f.isBackendFile}, Test: ${f.isTestFile})\n`;
    });

    prompt += `\n### Entities Context:\n`;
    entities.forEach((e) => {
      const parent = e.parentName ? ` (parent: ${e.parentName})` : "";
      prompt += `- ${e.name} (${e.type}, lang: ${e.language || ""})${parent} in ${e.filePath}\n`;
    });

    // Build section instructions dynamically
    const sectionSchemas = sectionsToRequest.map((key) => {
      const config = SECTION_CONFIG[key];
      return `    {
      "key": "${key}",
      "title": "${config.title}",
      "icon": "${config.icon}",
      "items": [
        { "name": "string", "file": "string (relative path)", "description": "string (1-2 sentences)" }
      ]
    }`;
    });

    prompt += `
Based on this structural data, generate a comprehensive onboarding guide in strictly valid JSON format. Do not use Markdown backticks. Do not include any explanations outside the JSON block.

IMPORTANT: Only include sections that are actually relevant to this codebase. If a section would have zero items, DO NOT include it.

The JSON MUST follow this exact schema:
{
  "sections": [
${sectionSchemas.join(",\n")}
  ],
  "readingList": [
    { "order": number, "file": "string (relative path)", "reason": "string" }
  ]
}

Section guidelines:
- entryPoints: Main entry files (e.g., main.rs, server.ts, app.py, main.go, index.js). Include both frontend and backend entry points if they exist.
- dataModels: Database models, schemas, core types, structs that represent domain data.
- uiComponents: Critical frontend components (layouts, major pages, shared components). ONLY include if the repo has a frontend.
- apiLayer: REST/GraphQL controllers, route definitions, request handlers, Django views, Flask routes.
- services: Business logic classes/modules that sit between the API layer and the data layer.
- abstractions: Key interfaces, traits, protocols, or abstract classes that define the system's contracts.
- testSuite: Main test files or test directories that a new developer should be aware of.
- readingList: A step-by-step reading list of 5-10 files a new developer should read IN ORDER to understand the repository. This should always be included.

Use RELATIVE file paths only (e.g., "src/main.rs" not "/tmp/repolens-repos/.../src/main.rs").
Each section should have 2-6 items maximum. Quality over quantity.`;

    let resultText = await generateAnswer(prompt);

    // Try to parse the JSON response
    try {
      // Strip markdown formatting if present
      if (resultText.startsWith("```json")) {
        resultText = resultText.replace(/```json\n/g, "").replace(/\n```/g, "");
      } else if (resultText.startsWith("```")) {
        resultText = resultText.replace(/```\n/g, "").replace(/\n```/g, "");
      }
      // Also strip trailing ``` if present
      resultText = resultText.replace(/```$/g, "").trim();

      const parsedGuide = JSON.parse(resultText);

      // Validate: ensure sections is an array and filter out empty sections
      if (parsedGuide.sections && Array.isArray(parsedGuide.sections)) {
        parsedGuide.sections = parsedGuide.sections.filter(
          (s: any) => s.items && Array.isArray(s.items) && s.items.length > 0
        );
      }

      // Save the guide to the database
      repo.onboardingGuide = parsedGuide;
      await repo.save();

      return res.status(200).json({
        success: true,
        guide: parsedGuide,
      });
    } catch (parseError) {
      throw new AppError("AI response was not valid JSON", 500, "PARSING_ERROR");
    }
  } catch (error) {
    next(error);
  }
};
