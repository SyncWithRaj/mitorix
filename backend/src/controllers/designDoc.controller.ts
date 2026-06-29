import type { Request, Response, NextFunction } from "express";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
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

    // Fetch limited data to avoid exceeding context limits
    const files = await FileMetadata.find({ repoId }).limit(100).lean();
    const entities = await CodeEntity.find({ repoId }).limit(200).lean();
    const relationships = await CodeRelationship.find({ repoId }).limit(200).lean();

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

    prompt += `\nBased on this structural data, create a high-level system architecture Mermaid.js flowchart. Output ONLY the raw Mermaid code block (starting with \`\`\`mermaid and ending with \`\`\`). Do not include any explanations. Make it beautiful and logically grouped.

IMPORTANT MERMAID FLOWCHART RULES:
1. Node IDs and Subgraph IDs MUST NOT contain spaces or special characters (e.g., use \`subgraph FrontendApp\` instead of \`subgraph Frontend (React Application)\`).
2. Use labels for nodes with spaces like this: \`NodeID["My Node Label"]\`.
3. Use labels for subgraphs like this: \`subgraph SubgraphID ["My Subgraph Label"]\`.
4. FOR LINK LABELS: Use the syntax: \`A -- "Label" --> B\`.
5. CRITICAL: DO NOT use the colon syntax for flowchart labels (e.g., NEVER do \`A --> B: Label\`).
6. Ensure all parentheses, brackets, and quotes are properly balanced.`;

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
