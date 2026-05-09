import type { Request, Response, NextFunction } from "express";
import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import { processRepositoryParsing } from "../services/parser.service.js";
import { Repository, touchRepository } from "../models/repo.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { FileContent } from "../models/fileContent.model.js";
import ChatHistory from "../models/chatHistory.model.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getTempRepoPath } from "../utils/cleanup.util.js";
import { repoQueue } from "../queue/jobQueue.js";
import { QueueEvents } from "bullmq";
import { purgeRepository } from "../utils/purge.util.js";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";

// Prevent Git from trying to prompt for credentials in server environments (Render, Docker, etc.)
// GIT_TERMINAL_PROMPT=0 disables interactive prompts without injecting fake credentials
process.env.GIT_TERMINAL_PROMPT = "0";
// Remove GIT_ASKPASS if set — setting it to 'echo' sends garbage as credentials
delete process.env.GIT_ASKPASS;

const git = simpleGit();

export const addRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { githubUrl } = req.body;
    const user = req.user;

    if (!user) {
      throw new AppError("Not authorized", 401);
    }

    if (!githubUrl) {
      throw new AppError("GitHub URL is required", 400);
    }

    if (!githubUrl.startsWith("https://github.com/")) {
      return res.status(400).json({
        message: "Invalid GitHub repository URL",
      });
    }

    const repoName = githubUrl.split("/").pop()?.replace(".git", "");

    if (!repoName) {
      return res.status(400).json({ message: "Invalid GitHub URL" });
    }

    const repo = new Repository({
      user: user._id,
      name: repoName,
      githubUrl,
      status: "cloning",
    });

    const repoPath = getTempRepoPath(user._id.toString(), repo._id.toString());

    fs.mkdirSync(repoPath, { recursive: true });

    repo.localPath = repoPath;
    await repo.save();

    try {
      logger.info({ repoId: repo._id, githubUrl }, "Initiating repository clone");

      // Disable any stored credential helpers that might provide stale/bad creds
      await git.clone(githubUrl, repoPath, ["--depth", "1", "-c", "credential.helper="]);

      logger.info({ repoId: repo._id }, "Clone operation completed successfully");

      const files = fs.readdirSync(repoPath);

      if (files.length === 0) {
        throw new Error("Clone failed: empty directory");
      }

      const gitRepo = simpleGit(repoPath);
      const latestCommit = await gitRepo.revparse(["HEAD"]);

      logger.info({ repoId: repo._id, commitHash: latestCommit }, "Repository commit resolved");

      repo.commitHash = latestCommit;
      repo.fingerprint = `${repo.githubUrl}_${latestCommit}`;
      repo.status = "cloned";

      await repo.save();

      logger.info({ repoId: repo._id }, "Repository status saved: cloned");
    } catch (cloneError) {
      logger.error({ err: cloneError, repoId: repo._id }, "Repository clone failed");

      repo.status = "failed";
      await repo.save();

      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }

      return res.status(500).json({
        success: false,
        message: "Repository cloning failed",
      });
    }

    return res.status(201).json({
      success: true,
      repo,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRepositories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);

    const repos = await Repository.find({ user: user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      repos,
    });
  } catch (error) {
    next(error);
  }
};

export const getRepositoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = await Repository.findById(req.params.id);
    if (!repo) throw new AppError("Repository not found", 404);

    await touchRepository(repo._id.toString());

    res.json({
      success: true,
      repo,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = await Repository.findById(req.params.id);
    if (!repo) throw new AppError("Repository not found", 404);

    await purgeRepository(repo._id.toString());
    await Repository.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Repository deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const scanRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);

    const repo = await Repository.findOne({
      _id: req.params.id,
      user: user._id,
    });

    if (!repo) throw new AppError("Repository not found", 404);

    // Read from FileMetadata in DB instead of disk
    const files = await FileMetadata.find({ repoId: repo._id }).select("-__v").lean();

    return res.json({
      success: true,
      totalFiles: files.length,
      files,
    });
  } catch (error) {
    next(error);
  }
};

export const processRepoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { githubUrl } = req.body;
    const user = req.user;

    if (!user) throw new AppError("Unauthorized", 401);

    if (!githubUrl || !githubUrl.startsWith("https://github.com/")) {
      throw new AppError("Invalid GitHub URL", 400);
    }

    const repoName = githubUrl.split("/").pop()?.replace(".git", "");
    if (!repoName) throw new AppError("Invalid GitHub URL", 400);

    const repo = new Repository({
      user: user._id,
      name: repoName,
      githubUrl,
      status: "cloning",
    });

    const repoPath = getTempRepoPath(user._id.toString(), repo._id.toString());
    repo.localPath = repoPath;

    await repo.save();

    const job = await repoQueue.add("process-repo", {
      repoUrl: githubUrl,
      userId: user._id.toString(),
      repoId: repo._id.toString(),
    });

    repo.jobId = job.id;
    await repo.save();

    return res.status(202).json({
      success: true,
      message: "Job accepted",
      jobId: job.id,
      repoId: repo._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

export const jobStatusController = async (req: Request, res: Response, next: NextFunction) => {
  const { id: jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send an initial heartbeat
  res.write(`data: ${JSON.stringify({ status: "connected", progress: 0 })}\n\n`);

  const queueEvents = new QueueEvents("repo-processing-queue", {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      // Or just pass the URL or IORedis instance
    },
  });

  const onProgress = (args: { jobId: string; data: string | number }) => {
    if (args.jobId === jobId) {
      res.write(`data: ${JSON.stringify({ status: "processing", progress: args.data })}\n\n`);
    }
  };

  const onCompleted = (args: { jobId: string; returnvalue: string }) => {
    if (args.jobId === jobId) {
      res.write(`data: ${JSON.stringify({ status: "completed", progress: 100 })}\n\n`);
      cleanup();
      res.end();
    }
  };

  const onFailed = (args: { jobId: string; failedReason: string }) => {
    if (args.jobId === jobId) {
      res.write(`data: ${JSON.stringify({ status: "failed", error: args.failedReason })}\n\n`);
      cleanup();
      res.end();
    }
  };

  queueEvents.on("progress", onProgress);
  queueEvents.on("completed", onCompleted);
  queueEvents.on("failed", onFailed);

  req.on("close", () => {
    cleanup();
  });

  function cleanup() {
    queueEvents.off("progress", onProgress);
    queueEvents.off("completed", onCompleted);
    queueEvents.off("failed", onFailed);
    queueEvents.close();
  }
};

// --- Local Zip / Folder Upload Support ---
import multer from "multer";
import AdmZip from "adm-zip";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

export const upload = multer({ storage });

export const uploadLocalRepository = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Zip file is required" });
    }

    const zipPath = req.file.path;
    const repoName = req.body.name || req.file.originalname.replace(".zip", "");

    const repo = new Repository({
      user: user._id,
      name: repoName,
      githubUrl: `local://${repoName}`,
      status: "cloning",
      isSession: false,
    });

    const repoPath = getTempRepoPath(user._id.toString(), repo._id.toString());
    fs.mkdirSync(repoPath, { recursive: true });
    repo.localPath = repoPath;
    await repo.save();

    let queuedSuccessfully = false;

    try {
      logger.info({ repoId: repo._id }, "Extracting uploaded zip file");
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(repoPath, true);

      const scannedFiles = scanCodeFiles(repoPath);
      if (scannedFiles.length === 0) {
        throw new Error("No valid code files found to parse inside the zip archive.");
      }

      logger.info({ repoId: repo._id, repoName }, "Queueing background processing job");
      const job = await repoQueue.add("process-repo", {
        repoUrl: `local://${repoName}`,
        userId: user._id.toString(),
        repoId: repo._id.toString(),
      });

      repo.jobId = job.id;
      await repo.save();

      queuedSuccessfully = true;

      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      logger.info({ jobId: job.id, repoId: repo._id }, "Background job queued successfully");

      return res.status(202).json({
        success: true,
        repoId: repo._id.toString(),
        jobId: job.id,
        repo,
        message: "Repository uploaded and queued for processing successfully.",
      });
    } catch (innerError: any) {
      logger.error({ err: innerError, repoId: repo._id }, "Local upload extraction or queuing failed");
      repo.status = "failed";
      await repo.save();

      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      return res.status(500).json({
        success: false,
        message: innerError.message || "Failed to process zip file.",
      });
    } finally {
      // Clean up the temp path only if we failed to queue the job
      if (!queuedSuccessfully && fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
    }
  } catch (error: any) {
    logger.error({ err: error }, "Local upload handler failed");
    return res.status(500).json({
      success: false,
      message: error.message || "Local upload failed.",
    });
  }
};

export const getRepoSecurityIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const repoId = req.params.id;

    const repo = await Repository.findOne({ _id: repoId, user: user._id });
    if (!repo) throw new AppError("Repository not found or unauthorized", 404);

    const { SecurityIssue } = await import("../models/securityIssue.model.js");
    const issues = await SecurityIssue.find({ repoId }).sort({ severity: 1, path: 1 }).lean();

    return res.json({
      success: true,
      totalIssues: issues.length,
      issues,
    });
  } catch (error) {
    next(error);
  }
};

export const getRepoArchitectureViolations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const repoId = req.params.id;

    const repo = await Repository.findOne({ _id: repoId, user: user._id });
    if (!repo) throw new AppError("Repository not found or unauthorized", 404);

    const { ArchitectureViolation } = await import("../models/architectureViolation.model.js");
    const violations = await ArchitectureViolation.find({ repoId })
      .sort({ severity: 1, path: 1 })
      .lean();

    return res.json({
      success: true,
      totalViolations: violations.length,
      violations,
    });
  } catch (error) {
    next(error);
  }
};
