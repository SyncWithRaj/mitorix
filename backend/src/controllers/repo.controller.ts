import type { Request, Response, NextFunction } from "express";
import { simpleGit } from "simple-git";
import type { JobProgress } from "bullmq";
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
import {
  getOwnedRepositoryOrThrow,
  requireAuthUser,
  ensureValidRepoId,
} from "../utils/repositoryAccess.util.js";

// Prevent Git from trying to prompt for credentials in server environments (Render, Docker, etc.)
// GIT_TERMINAL_PROMPT=0 disables interactive prompts without injecting fake credentials
process.env.GIT_TERMINAL_PROMPT = "0";
// Remove GIT_ASKPASS if set — setting it to 'echo' sends garbage as credentials
delete process.env.GIT_ASKPASS;

const git = simpleGit();

export const addRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { githubUrl } = req.body;
    const user = requireAuthUser(req.user);

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
    const user = requireAuthUser(req.user);

    const repos = await Repository.find({ user: String(user._id) }).sort({ createdAt: -1 });
    
    const { embeddingProgressTracker } = await import("../services/embedRepository.service.js");
    
    const reposWithEmbeddingStatus = repos.map(r => {
      const repoObj = r.toJSON() as any;
      if (embeddingProgressTracker.has(r._id.toString())) {
        repoObj.isEmbedding = true;
      }
      return repoObj;
    });

    res.json({
      success: true,
      repos: reposWithEmbeddingStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getRepositoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = await getOwnedRepositoryOrThrow(req.params.id, req.user);

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
    const repo = await getOwnedRepositoryOrThrow(req.params.id, req.user);

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
    const user = requireAuthUser(req.user);
    const repoId = ensureValidRepoId(req.params.id);

    const repo = await Repository.findOne({
      _id: repoId,
      user: String(user._id),
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
    const user = requireAuthUser(req.user);

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

    repo.jobId = String(job.id);
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
  const jobId = req.params.id;
  if (!jobId) {
    return next(new AppError("Job ID is required", 400));
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const job = await repoQueue.getJob(jobId);
    if (job) {
      const isCompleted = await job.isCompleted();
      const isFailed = await job.isFailed();
      if (isCompleted) {
        res.write(`data: ${JSON.stringify({ status: "completed", progress: 100 })}\n\n`);
        res.end();
        return;
      }
      if (isFailed) {
        res.write(`data: ${JSON.stringify({ status: "failed", progress: 0 })}\n\n`);
        res.end();
        return;
      }
      
      const progress = job.progress;
      res.write(`data: ${JSON.stringify({ status: "processing", progress: typeof progress === 'number' ? progress : 0 })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ status: "connected", progress: 0 })}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ status: "connected", progress: 0 })}\n\n`);
  }

  const queueEvents = new QueueEvents("repo-processing-queue", {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      // Or just pass the URL or IORedis instance
    },
  });

  const onProgress = (args: { jobId: string; data: JobProgress }) => {
    if (args.jobId === jobId) {
      const progressValue = typeof args.data === "number" ? args.data : 0;
      res.write(`data: ${JSON.stringify({ status: "processing", progress: progressValue })}\n\n`);
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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - package has no bundled types in this project setup
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
    // Sanitize filename to prevent path traversal or malicious names
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}_${sanitizedName}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow .zip files
    if (file.mimetype === "application/zip" || file.originalname.endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed") as any, false);
    }
  },
});

export const uploadLocalRepository = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = requireAuthUser(req.user);

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

      repo.jobId = String(job.id);
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
      logger.error(
        { err: innerError, repoId: repo._id },
        "Local upload extraction or queuing failed"
      );
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
    const repoId = ensureValidRepoId(req.params.id);
    const repo = await getOwnedRepositoryOrThrow(repoId, req.user);

    const { SecurityIssue } = await import("../models/securityIssue.model.js");
    const issues = await SecurityIssue.find({ repoId: repo._id })
      .sort({ severity: 1, path: 1 })
      .lean();

    return res.json({
      success: true,
      totalIssues: issues.length,
      issues,
    });
  } catch (error) {
    next(error);
  }
};

export const getRepoArchitectureViolations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const repoId = ensureValidRepoId(req.params.id);
    const repo = await getOwnedRepositoryOrThrow(repoId, req.user);

    const { ArchitectureViolation } = await import("../models/architectureViolation.model.js");
    const violations = await ArchitectureViolation.find({ repoId: repo._id })
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

export const triggerEmbedding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoId = ensureValidRepoId(req.params.id);
    const repo = await getOwnedRepositoryOrThrow(repoId, req.user);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (repo.isEmbedded) {
      res.write(`data: ${JSON.stringify({ status: "completed", current: 1, total: 1 })}\n\n`);
      return res.end();
    }

    const { embedRepository, embeddingProgressTracker, embeddingEvents } = await import("../services/embedRepository.service.js");

    const onProgress = (current: number, total: number) => {
      res.write(`data: ${JSON.stringify({ status: "progress", current, total })}\n\n`);
    };

    const onCompleted = () => {
      res.write(`data: ${JSON.stringify({ status: "completed", current: 1, total: 1 })}\n\n`);
      cleanup();
      res.end();
    };

    const cleanup = () => {
      embeddingEvents.off(`progress-${repoId}`, onProgress);
      embeddingEvents.off(`completed-${repoId}`, onCompleted);
    };

    req.on("close", cleanup);

    if (embeddingProgressTracker.has(repoId)) {
      // Already running, just subscribe
      const { current, total } = embeddingProgressTracker.get(repoId)!;
      res.write(`data: ${JSON.stringify({ status: "progress", current, total })}\n\n`);
      
      embeddingEvents.on(`progress-${repoId}`, onProgress);
      embeddingEvents.on(`completed-${repoId}`, onCompleted);
      return;
    }

    logger.info({ repoId }, "Manual embedding trigger started");
    
    embeddingEvents.on(`progress-${repoId}`, onProgress);
    embeddingEvents.on(`completed-${repoId}`, onCompleted);

    // Call without awaiting to not block, but subscribe to events
    embedRepository(repoId).then(async () => {
      await Repository.findByIdAndUpdate(repoId, { isEmbedded: true });
    }).catch((error: any) => {
      embeddingProgressTracker.delete(repoId);
      embeddingEvents.emit(`completed-${repoId}`); // cleanup listeners
      logger.error({ err: error }, "Embedding failed");
      res.write(`data: ${JSON.stringify({ status: "error", message: error.message || "Embedding failed" })}\n\n`);
      res.end();
    });
  } catch (error: any) {
    logger.error({ err: error }, "Embedding trigger failed");
    res.write(`data: ${JSON.stringify({ status: "error", message: error.message || "Embedding failed" })}\n\n`);
    res.end();
  }
};
