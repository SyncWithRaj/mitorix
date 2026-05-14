import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { simpleGit } from "simple-git";

import { Repository } from "../models/repo.model.js";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import { processRepositoryParsing } from "../services/parser.service.js";

import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { FileContent } from "../models/fileContent.model.js";
import { cleanupTempRepo, getTempRepoPath } from "../utils/cleanup.util.js";
import logger from "../lib/logger.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";

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
 * Walk the repo directory and save file tree + contents to MongoDB.
 * This allows file reading from DB after the temp clone is deleted.
 */
export async function saveRepoFilesToDB(repoId: string, basePath: string): Promise<number> {
  const fileContentDocs: any[] = [];

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
        // Save directory entry
        fileContentDocs.push({
          repoId,
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

        // Check if we should save content
        const shouldSaveContent = TEXT_EXTENSIONS.has(ext) || TEXT_EXTENSIONS.has(baseName); // For files like "Dockerfile"

        let content: string | null = null;
        let fileSize = 0;

        try {
          const stats = fs.statSync(fullPath);
          fileSize = stats.size;

          // Only save content for text files under 1MB
          if (shouldSaveContent && fileSize < 1_000_000) {
            content = fs.readFileSync(fullPath, "utf-8");
          }
        } catch {
          // Skip unreadable files
        }

        fileContentDocs.push({
          repoId,
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
    // Clear old file content data for this repo
    await FileContent.deleteMany({ repoId });

    // Insert in batches to avoid memory issues with large repos
    const BATCH_SIZE = 500;
    for (let i = 0; i < fileContentDocs.length; i += BATCH_SIZE) {
      const batch = fileContentDocs.slice(i, i + BATCH_SIZE);
      await FileContent.insertMany(batch, { ordered: false });
    }
  }

  return fileContentDocs.length;
}

export async function parseRepoController(req: Request, res: Response, next: NextFunction) {
  const id = ensureValidRepoId(req.params.id);
  try {
    logger.info({ repoId: id }, "Parse request received for repo");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn({ repoId: id }, "Invalid repo ID");
      return res.status(400).json({
        success: false,
        message: "Invalid repository id",
      });
    }

    const repo = await getOwnedRepositoryOrThrow(id, req.user);

    logger.info(
      {
        repoId: id,
        repoName: repo.name,
        localPath: repo.localPath,
        status: repo.status,
      },
      "Repo found for parsing"
    );

    if (!repo.localPath) {
      logger.error({ repoId: id }, "No localPath set for repo");
      return res.status(400).json({
        success: false,
        message: "Repository localPath not found",
      });
    }

    // Check if the cloned files actually exist on disk
    // On Render/serverless, /tmp can be wiped between requests
    let repoPath = repo.localPath;

    if (!fs.existsSync(repoPath) || fs.readdirSync(repoPath).length === 0) {
      logger.warn({ repoId: id, repoPath }, "Temp clone missing or empty, re-cloning repository");

      // Re-clone into a fresh /tmp path
      const userId = repo.user.toString();
      const repoIdStr = repo._id.toString();
      repoPath = getTempRepoPath(userId, repoIdStr);

      // Clean up any leftover empty directory
      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
      fs.mkdirSync(repoPath, { recursive: true });

      try {
        const git = simpleGit();
        await git.clone(repo.githubUrl, repoPath, ["--depth", "1", "-c", "credential.helper="]);
        logger.info({ repoId: id, repoPath }, "Re-clone successful");

        // Update localPath in DB
        repo.localPath = repoPath;
        await repo.save();
      } catch (cloneErr: any) {
        logger.error({ err: cloneErr, repoId: id }, "Re-clone failed");
        cleanupTempRepo(repoPath);

        repo.status = "failed";
        await repo.save();

        return res.status(500).json({
          success: false,
          message:
            "Failed to re-clone repository for parsing: " + (cloneErr?.message || "Unknown error"),
        });
      }
    }

    // Verify directory has files
    const dirContents = fs.readdirSync(repoPath);
    logger.debug({ repoId: id, itemCount: dirContents.length }, "Directory contents verified");

    if (dirContents.length === 0) {
      logger.error({ repoId: id, repoPath }, "Directory is empty after clone");

      repo.status = "failed";
      await repo.save();

      return res.status(400).json({
        success: false,
        message: "Repository directory is empty. Clone may have failed.",
      });
    }

    repo.status = "indexing";
    await repo.save();
    logger.info({ repoId: id }, "Status set to indexing");

    await CodeEntity.deleteMany({ repoId: repo._id });
    await CodeRelationship.deleteMany({ repoId: repo._id });
    await FileMetadata.deleteMany({ repoId: repo._id });
    logger.debug({ repoId: id }, "Old data cleared from MongoDB");

    const scannedFiles = scanCodeFiles(repoPath);
    logger.info({ repoId: id, fileCount: scannedFiles.length }, "Files scanned for parsing");

    if (!scannedFiles.length) {
      repo.status = "failed";
      await repo.save();

      // Cleanup temp clone even if no files found
      cleanupTempRepo(repoPath);

      return res.status(200).json({
        success: true,
        message: "No scannable files found",
      });
    }

    const filePaths = scannedFiles.map((file) => file.absolutePath);
    logger.info({ repoId: id, fileCount: filePaths.length }, "Starting AST parsing");

    const result = await processRepositoryParsing(repo._id.toString(), filePaths);
    logger.info({ repoId: id, result }, "AST parsing complete");

    // 📁 Save all file tree + contents to MongoDB before cleanup
    logger.info({ repoId: id }, "Saving file tree and contents to MongoDB");
    const savedFilesCount = await saveRepoFilesToDB(repo._id.toString(), repoPath);
    logger.info({ repoId: id, savedFilesCount }, "File tree saved to MongoDB");

    // 🧹 Cleanup temp clone from /tmp — MongoDB data is safe
    logger.info({ repoId: id }, "Cleaning up temp clone");
    cleanupTempRepo(repoPath);

    repo.status = "indexed";
    await repo.save();
    logger.info({ repoId: id }, "Repository status updated to indexed");

    return res.status(200).json({
      success: true,
      ...result,
      savedFiles: savedFilesCount,
    });
  } catch (error: any) {
    logger.error({ err: error, repoId: id, stack: error?.stack }, "Parse Controller Error");

    // Try to cleanup temp clone on error too
    try {
      const repo = await Repository.findById(id);
      if (repo?.localPath) {
        cleanupTempRepo(repo.localPath);
      }
      await Repository.findByIdAndUpdate(id, { status: "failed" });
    } catch (cleanupError) {
      logger.error({ err: cleanupError, repoId: id }, "Error during cleanup in catch block");
    }

    return res.status(500).json({
      success: false,
      message: error?.message || "Parsing failed",
    });
  }
}
