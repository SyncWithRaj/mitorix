import fs from "fs";
import logger from "../../lib/logger.js";
import { ParsedEntity, ParsedFileMetadata, ParsedRelationship } from "./astParser.js";

// Basic line-based text chunker for HTML/CSS
export async function parseTextFiles(
  repoId: string,
  filePaths: string[]
): Promise<{
  entities: ParsedEntity[];
  relationships: ParsedRelationship[];
  fileMetadata: ParsedFileMetadata[];
}> {
  const entities: ParsedEntity[] = [];
  const relationships: ParsedRelationship[] = [];
  const fileMetadata: ParsedFileMetadata[] = [];

  // Chunk size: number of lines per entity
  const CHUNK_SIZE = 150;

  for (const filePath of filePaths) {
    try {
      const fileName = filePath.split("/").pop() || "";
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");

      const lines = content.split("\n");
      const totalLines = lines.length;

      const isCss = filePath.endsWith(".css");
      const isHtml = filePath.endsWith(".html");

      if (!isCss && !isHtml) continue;

      const entityType = isCss ? "css" : "html";

      fileMetadata.push({
        repoId,
        filePath,
        fileName,
        fileSize: stats.size,
        totalLines,
        hasDefaultExport: false,
        hasReactComponent: false,
        isBackendFile: false,
        isTestFile: false,
      });

      // Chunk generation
      for (let i = 0; i < totalLines; i += CHUNK_SIZE) {
        const chunkLines = lines.slice(i, i + CHUNK_SIZE);
        const chunkContent = chunkLines.join("\n");
        const chunkStartLine = i + 1;
        const chunkEndLine = i + chunkLines.length;

        // Use the filename + chunk index as the entity name
        const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
        const entityName = totalLines <= CHUNK_SIZE ? fileName : `${fileName}_chunk_${chunkIndex}`;

        entities.push({
          repoId,
          filePath,
          name: entityName,
          type: entityType,
          parameters: [],
          returnType: "",
          startLine: chunkStartLine,
          endLine: chunkEndLine,
          content: chunkContent,
          scopeDepth: 0,
          parentName: null,
        });
      }
    } catch (error) {
      logger.error({ err: error, filePath }, "Failed to parse text file");
    }
  }

  return {
    entities,
    relationships,
    fileMetadata,
  };
}
