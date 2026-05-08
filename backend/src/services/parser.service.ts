import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { FileContent } from "../models/fileContent.model.js";
import fs from "fs";
import path from "path";

// Directories/files to skip when saving to DB
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage"]);

// Extensions we save content for (source code + config + docs)
const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt",
  ".css", ".scss", ".less", ".html", ".xml", ".yaml", ".yml",
  ".env", ".toml", ".ini", ".cfg", ".conf",
  ".sh", ".bash", ".py", ".rb", ".go", ".rs", ".java",
  ".c", ".cpp", ".h", ".hpp", ".cs", ".swift", ".kt",
  ".sql", ".graphql", ".prisma", ".proto",
  ".gitignore", ".eslintrc", ".prettierrc", ".editorconfig",
  ".dockerignore", "Dockerfile", "Makefile",
]);

export async function saveRepoFilesToDB(
  repoId: string,
  basePath: string
): Promise<number> {
  const fileContentDocs: any[] = [];
  
  // Explicitly cast to ObjectId so MongoDB queries don't fail later
  const { Types } = await import("mongoose");
  const repoObjectId = new Types.ObjectId(repoId);

  function walk(currentPath: string) {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        fileContentDocs.push({
          repoId: repoObjectId,
          relativePath,
          fileName: entry.name,
          isDirectory: true,
          content: null,
          fileSize: 0,
        });

        walk(fullPath); // recurse
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const baseName = entry.name;

        const shouldSaveContent =
          TEXT_EXTENSIONS.has(ext) ||
          TEXT_EXTENSIONS.has(baseName);

        let content: string | null = null;
        let fileSize = 0;

        try {
          const stats = fs.statSync(fullPath);
          fileSize = stats.size;

          if (shouldSaveContent && fileSize < 1_000_000) {
            content = fs.readFileSync(fullPath, "utf-8");
          }
        } catch {
          // Skip unreadable files
        }

        fileContentDocs.push({
          repoId: repoObjectId,
          relativePath,
          fileName: entry.name,
          isDirectory: false,
          content,
          fileSize,
        });
      }
    }
  }

  walk(basePath);

  if (fileContentDocs.length > 0) {
    await FileContent.deleteMany({ repoId });

    const BATCH_SIZE = 500;
    for (let i = 0; i < fileContentDocs.length; i += BATCH_SIZE) {
      const batch = fileContentDocs.slice(i, i + BATCH_SIZE);
      await FileContent.insertMany(batch, { ordered: false });
    }
  }

  return fileContentDocs.length;
}

import { parseRepository } from "../modules/parser/astParser.js";

export async function processRepositoryParsing(
  repoId: string,
  filePaths: string[]
) {
  // Find repository local path to use as the base path for resolving path aliases
  let basePath = "";
  try {
    const { Repository } = await import("../models/repo.model.js");
    const repo = await Repository.findById(repoId);
    if (repo && repo.localPath) {
      basePath = repo.localPath;
    }
  } catch (err) {
    // Fallback if DB query fails
  }

  const { entities, relationships, fileMetadata } =
    await parseRepository(repoId, filePaths, basePath);


  // nothing parsed
  if (!entities.length && !fileMetadata.length) {
    return {
      message: "Nothing parsed",
      totalEntities: 0,
      totalRelationships: 0,
      totalFiles: 0
    };
  }


  // Insert entities
  if (entities.length) {
    await CodeEntity.insertMany(entities, { ordered: false });
  }


  // Insert relationships
  if (relationships.length) {
    await CodeRelationship.insertMany(relationships, { ordered: false });
  }


  // Insert file metadata
  if (fileMetadata.length) {
    await FileMetadata.insertMany(fileMetadata, { ordered: false });
  }


  // ---------- Route → Handler mapping ----------

  const routes = entities.filter(e => e.type === "route");

  const functions = entities.filter(
    e =>
      e.type === "function" ||
      e.type === "method" ||
      e.type === "arrow"
  );

  const routeRelationships = [];

  for (const route of routes) {

    const handler = route.name;

    const target = functions.find(f => f.name === handler);

    if (!target) continue;

    routeRelationships.push({
      repoId,
      fromName: route.name,
      fromFilePath: route.filePath,
      toName: target.name,
      toFilePath: target.filePath,
      relationType: "handles",
      line: route.startLine
    });
  }


  if (routeRelationships.length) {
    await CodeRelationship.insertMany(routeRelationships, { ordered: false });
  }


  return {
    message: "Parsing completed",
    totalEntities: entities.length,
    totalRelationships: relationships.length + routeRelationships.length,
    totalFiles: fileMetadata.length
  };
}