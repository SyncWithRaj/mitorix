import type { Request, Response, NextFunction } from "express";
import { RepoParsedData } from "../models/repoParsedData.model.js";
import {
  expandEntities,
  expandRelationships,
  expandFileMetadata,
} from "../utils/repoParsedData.helpers.js";
import { Repository, touchRepository } from "../models/repo.model.js";
import { generateAnswer } from "../services/llm.service.js";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";

export const generateSystemDesignDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const repoId = ensureValidRepoId(req.params.id);
    const repo = await getOwnedRepositoryOrThrow(repoId, req.user);

    await touchRepository(repoId);

    // Return cached doc only if it looks like valid mermaid (not a cached error)
    if (
      repo.systemDesignDoc &&
      repo.systemDesignDoc.includes("graph") &&
      !repo.systemDesignDoc.includes("experiencing high load") &&
      req.query.force !== "true"
    ) {
      return res.status(200).json({
        success: true,
        mermaid: repo.systemDesignDoc,
      });
    }

    // ── Single query replaces 3 separate find().limit() calls ──
    const parsedData = await RepoParsedData.findOne({ repoId }).lean();

    const allFiles = parsedData ? expandFileMetadata(parsedData as any) : [];
    const allEntities = parsedData ? expandEntities(parsedData as any) : [];
    const allRelationships = parsedData ? expandRelationships(parsedData as any) : [];

    // Apply limits in JS (same as old .limit(100/200))
    const files = allFiles.slice(0, 100);
    const entities = allEntities.slice(0, 200);
    const relationships = allRelationships.slice(0, 200);

    let prompt = `Generate a Mermaid.js flowchart (graph TD) that represents the system architecture of the repository '${repo.name}'.\n\n`;
    prompt += `### Files:\n`;
    files.forEach((f) => {
      prompt += `- ${f.filePath} (React Component: ${f.hasReactComponent}, Backend: ${f.isBackendFile})\n`;
    });

    prompt += `\n### Entities:\n`;
    entities.forEach((e) => {
      prompt += `- ${e.name} (${e.type}) in ${e.filePath}\n`;
    });

    prompt += `\n### Relationships:\n`;
    relationships.forEach((r) => {
      prompt += `- ${r.fromName} (${r.fromFilePath}) -> ${r.toName} (${r.toFilePath}) [${r.relationType}]\n`;
    });

    prompt += `\nBased on this structural data, create a high-level system architecture Mermaid.js flowchart. Output ONLY the raw Mermaid code block (starting with \`\`\`mermaid and ending with \`\`\`). Do not include any explanations. Logically group the components using subgraphs.

IMPORTANT MERMAID FLOWCHART RULES:
1. Node IDs and Subgraph IDs MUST NOT contain spaces or special characters (e.g., use \`subgraph FrontendApp\` instead of \`subgraph Frontend (React Application)\`).
2. Use labels for nodes with spaces like this: \`NodeID["My Node Label"]\`.
3. Use labels for subgraphs like this: \`subgraph SubgraphID ["My Subgraph Label"]\`.
4. FOR LINK LABELS: Use the syntax: \`A -- "Label" --> B\`.
5. CRITICAL: DO NOT use the colon syntax for flowchart labels (e.g., NEVER do \`A --> B: Label\`).
6. CRITICAL: DO NOT add any inline styles, colors, or classes to the nodes (e.g., NO \`style A fill:#fff\`). Keep the diagram purely structural so it uses the default theme.
7. Ensure all parentheses, brackets, and quotes are properly balanced.`;

    const mermaidMarkdown = await generateAnswer(prompt);

    logger.debug({ repoId, mermaidLength: mermaidMarkdown.length }, "Mermaid diagram generated");

    repo.systemDesignDoc = mermaidMarkdown;
    await repo.save();

    return res.status(200).json({
      success: true,
      mermaid: mermaidMarkdown,
    });
  } catch (error) {
    next(error);
  }
};
