import { FileContent } from "../models/fileContent.model.js";
import { RepoParsedData } from "../models/repoParsedData.model.js";
import { compressContent } from "../utils/contentCompression.util.js";
import { invalidateRepoCache } from "../utils/fileContentCache.util.js";
import {
  buildFilePathIndex,
  getOrAddFilePath,
} from "../utils/repoParsedData.helpers.js";
import fs from "fs";
import path from "path";

// Directories/files to skip when saving to DB
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage"]);

// Extensions we save content for (source code + config + docs)
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".xml",
  ".yaml",
  ".yml",
  ".env",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".sh",
  ".bash",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".swift",
  ".kt",
  ".sql",
  ".graphql",
  ".prisma",
  ".proto",
  ".gitignore",
  ".eslintrc",
  ".prettierrc",
  ".editorconfig",
  ".dockerignore",
  "Dockerfile",
  "Makefile",
]);

/**
 * Walk the repo directory and save file tree + compressed contents to MongoDB.
 * Content is gzip-compressed before storage for ~65-75% space savings.
 */
export async function saveRepoFilesToDB(repoId: string, basePath: string): Promise<number> {
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
          contentEncoding: "plain",
          fileSize: 0,
        });

        walk(fullPath); // recurse
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const baseName = entry.name;

        const shouldSaveContent = TEXT_EXTENSIONS.has(ext) || TEXT_EXTENSIONS.has(baseName);

        let content: string | null = null;
        let contentEncoding: "plain" | "gzip" = "plain";
        let fileSize = 0;

        try {
          const stats = fs.statSync(fullPath);
          fileSize = stats.size;

          if (shouldSaveContent && fileSize < 1_000_000) {
            const rawContent = fs.readFileSync(fullPath, "utf-8");
            // Compress content for storage savings
            const compressed = compressContent(rawContent);
            content = compressed.content;
            contentEncoding = compressed.contentEncoding;
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
          contentEncoding,
          fileSize,
        });
      }
    }
  }

  walk(basePath);

  if (fileContentDocs.length > 0) {
    // Invalidate LRU cache for this repo before replacing data
    invalidateRepoCache(repoId);

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

/**
 * Process repository parsing: run AST parser and store results in
 * a single consolidated RepoParsedData document (replacing the old
 * pattern of 3 separate collections).
 */
export async function processRepositoryParsing(repoId: string, filePaths: string[]) {
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

  const { entities, relationships, fileMetadata } = await parseRepository(
    repoId,
    filePaths,
    basePath
  );

  // nothing parsed
  if (!entities.length && !fileMetadata.length) {
    return {
      message: "Nothing parsed",
      totalEntities: 0,
      totalRelationships: 0,
      totalFiles: 0,
    };
  }

  // ── Build deduplicated file path index ──────────────────────────────────
  const filePathsList: string[] = [];
  const filePathIndex = buildFilePathIndex(filePathsList);

  // ── Convert entities to indexed format ──────────────────────────────────
  const indexedEntities = entities.map((e: any) => ({
    name: e.name,
    type: e.type,
    fileIdx: getOrAddFilePath(filePathsList, filePathIndex, e.filePath),
    language: e.language || "unknown",
    parameters: e.parameters || [],
    returnType: e.returnType || "",
    startLine: e.startLine,
    endLine: e.endLine,
    scopeDepth: e.scopeDepth ?? 0,
    parentName: e.parentName ?? null,
  }));

  // ── Deduplicate and convert relationships ───────────────────────────────
  const internalRelativePaths = new Set(
    filePaths.map((p) => path.relative(basePath, p).replace(/\\/g, "/"))
  );

  const deduplicatedRelationships = new Map<string, any>();

  const PRUNED_PREFIXES = ["console.", "Math.", "Object.", "Array.", "String.", "Promise.", "JSON.", "React.use", "Number."];
  const PRUNED_EXACT = ["console", "Math", "Object", "Array", "String", "Promise", "JSON", "React", "window", "document"];

  for (const rel of relationships) {
    if (PRUNED_EXACT.includes(rel.toName) || PRUNED_PREFIXES.some(prefix => rel.toName.startsWith(prefix))) {
      continue; // Skip trivial relationships
    }
    let isExternal = false;
    let targetPath = rel.toFilePath ? rel.toFilePath.replace(/\\/g, "/") : null;

    if (targetPath) {
      if (
        !internalRelativePaths.has(targetPath) &&
        !filePaths.includes(targetPath) &&
        !targetPath.startsWith("./") &&
        !targetPath.startsWith("../") &&
        !targetPath.startsWith("/")
      ) {
        isExternal = true;
      }
    }

    const key = `${rel.fromFilePath}|${rel.toName}|${targetPath || ""}|${rel.relationType}`;

    if (deduplicatedRelationships.has(key)) {
      const existing = deduplicatedRelationships.get(key);
      existing.count = (existing.count || 1) + 1;
    } else {
      deduplicatedRelationships.set(key, {
        ...rel,
        toFilePath: targetPath,
        isExternal,
        count: 1,
      });
    }
  }

  const dedupedRels = Array.from(deduplicatedRelationships.values());

  // ── Route → Handler mapping ─────────────────────────────────────────────
  const routes = entities.filter((e: any) => e.type === "route");
  const functions = entities.filter(
    (e: any) => e.type === "function" || e.type === "method" || e.type === "arrow"
  );

  const routeRelationships: any[] = [];
  for (const route of routes) {
    const handler = route.name;
    const target = functions.find((f: any) => f.name === handler);
    if (!target) continue;

    routeRelationships.push({
      fromName: route.name,
      fromFilePath: route.filePath,
      toName: target.name,
      toFilePath: target.filePath,
      relationType: "handles",
      line: route.startLine,
      count: 1,
      isExternal: false,
    });
  }

  // Merge route relationships into deduplicated list
  const allRels = [...dedupedRels, ...routeRelationships];

  // Convert relationships to indexed format
  const indexedRelationships = allRels.map((r: any) => ({
    fromName: r.fromName,
    fromFileIdx: getOrAddFilePath(filePathsList, filePathIndex, r.fromFilePath),
    toName: r.toName,
    toFileIdx: r.toFilePath
      ? getOrAddFilePath(filePathsList, filePathIndex, r.toFilePath)
      : -1,
    relationType: r.relationType,
    line: r.line || 0,
    count: r.count || 1,
    isExternal: r.isExternal || false,
  }));

  // ── Convert file metadata to indexed format ─────────────────────────────
  const indexedFileMetadata = fileMetadata.map((fm: any) => ({
    fileIdx: getOrAddFilePath(filePathsList, filePathIndex, fm.filePath),
    language: fm.language || "unknown",
    fileSize: fm.fileSize || 0,
    totalLines: fm.totalLines || 0,
    hasDefaultExport: fm.hasDefaultExport || false,
    hasReactComponent: fm.hasReactComponent || false,
    isBackendFile: fm.isBackendFile || false,
    isTestFile: fm.isTestFile || false,
  }));

  // ── Single atomic write — replaces 3 separate insertMany calls ──────────
  await RepoParsedData.findOneAndUpdate(
    { repoId },
    {
      repoId,
      filePaths: filePathsList,
      entities: indexedEntities,
      relationships: indexedRelationships,
      fileMetadata: indexedFileMetadata,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    message: "Parsing completed",
    totalEntities: entities.length,
    totalRelationships: allRels.length,
    totalFiles: fileMetadata.length,
  };
}
