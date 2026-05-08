import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import simpleGit from "simple-git";

import { Repository } from "../models/repo.model.js";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import { processRepositoryParsing } from "../services/parser.service.js";

import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { FileContent } from "../models/fileContent.model.js";
import { cleanupTempRepo, getTempRepoPath } from "../utils/cleanup.util.js";

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
async function saveRepoFilesToDB(repoId: string, basePath: string): Promise<number> {
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
  try {
    const { id } = req.params;
    console.log("📝 Parse request received for repo:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid repo ID:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid repository id",
      });
    }

    const repo = await Repository.findById(id);

    if (!repo) {
      console.log("❌ Repo not found in DB:", id);
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    console.log(
      "📂 Repo found:",
      repo.name,
      "| localPath:",
      repo.localPath,
      "| status:",
      repo.status
    );

    if (!repo.localPath) {
      console.log("❌ No localPath set for repo:", id);
      return res.status(400).json({
        success: false,
        message: "Repository localPath not found",
      });
    }

    // Check if the cloned files actually exist on disk
    // On Render/serverless, /tmp can be wiped between requests
    let repoPath = repo.localPath;

    if (!fs.existsSync(repoPath) || fs.readdirSync(repoPath).length === 0) {
      console.log("Warning: Temp clone missing, re-cloning repository.");

      // Re-clone into a fresh /tmp path
      const userId = repo.user.toString();
      const repoId = repo._id.toString();
      repoPath = getTempRepoPath(userId, repoId);

      // Clean up any leftover empty directory
      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
      fs.mkdirSync(repoPath, { recursive: true });

      try {
        const git = simpleGit();
        await git.clone(repo.githubUrl, repoPath, ["--depth", "1", "-c", "credential.helper="]);
        console.log("Re-clone successful");

        // Update localPath in DB
        repo.localPath = repoPath;
        await repo.save();
      } catch (cloneErr: any) {
        console.error("❌ Re-clone failed:", cloneErr?.message);
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
    console.log("📁 Directory contents:", dirContents.length, "items");

    if (dirContents.length === 0) {
      console.error("❌ Directory is empty after clone:", repoPath);

      repo.status = "failed";
      await repo.save();

      return res.status(400).json({
        success: false,
        message: "Repository directory is empty. Clone may have failed.",
      });
    }

    repo.status = "indexing";
    await repo.save();
    console.log("📊 Status set to indexing");

    await CodeEntity.deleteMany({ repoId: id });
    await CodeRelationship.deleteMany({ repoId: id });
    await FileMetadata.deleteMany({ repoId: id });
    console.log("🗑️ Old data cleared");

    const scannedFiles = scanCodeFiles(repoPath);
    console.log("🔍 Scanned files:", scannedFiles.length);

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
    console.log("🔧 Starting AST parsing for", filePaths.length, "files...");

    const result = await processRepositoryParsing(id, filePaths);
    console.log("AST parsing complete:", result);

    // 📁 Save all file tree + contents to MongoDB before cleanup
    console.log("📁 Saving file tree and contents to MongoDB...");
    const savedFilesCount = await saveRepoFilesToDB(id, repoPath);
    console.log(`Saved ${savedFilesCount} files and directories to MongoDB`);

    // 🧹 Cleanup temp clone from /tmp — MongoDB data is safe
    console.log("🧹 Cleaning up temp clone...");
    cleanupTempRepo(repoPath);

    repo.status = "indexed";
    await repo.save();
    console.log("Repository status updated to indexed");

    return res.status(200).json({
      success: true,
      ...result,
      savedFiles: savedFilesCount,
    });
  } catch (error: any) {
    console.error("❌ Parse Controller Error:", error?.message || error);
    console.error("❌ Stack:", error?.stack);

    // Try to cleanup temp clone on error too
    try {
      const { id } = req.params;
      const repo = await Repository.findById(id);
      if (repo?.localPath) {
        cleanupTempRepo(repo.localPath);
      }
      await Repository.findByIdAndUpdate(id, { status: "failed" });
    } catch (cleanupError) {
      console.error("❌ Error during cleanup:", cleanupError);
    }

    return res.status(500).json({
      success: false,
      message: error?.message || "Parsing failed",
    });
  }
}
