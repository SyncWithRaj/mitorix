import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { simpleGit } from "simple-git";
import fs from "fs";
import { Repository } from "../models/repo.model.js";
import type { JobData, JobResult } from "../queue/jobQueue.js";
import { getTempRepoPath } from "../utils/cleanup.util.js";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import { processRepositoryParsing } from "../services/parser.service.js";
import { embedRepository } from "../services/embedRepository.service.js";
import { generateAnswer } from "../services/llm.service.js";
import logger from "../lib/logger.js";

// @ts-ignore - ioredis constructor typing interop in this tsconfig (NodeNext) is noisy here
const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Prevent Git from trying to prompt for credentials
process.env.GIT_TERMINAL_PROMPT = "0";
delete process.env.GIT_ASKPASS;

export const repoWorker = new Worker<JobData, JobResult, string>(
  "repo-processing-queue",
  async (job: Job<JobData>) => {
    const { repoUrl, userId, repoId } = job.data;
    const repoPath = getTempRepoPath(userId, repoId);

    try {
      logger.info({ jobId: job.id, repoUrl, repoId }, "Started processing repository job");

      // === STEP 1: Git Clone ===
      await job.updateProgress(10);

      // Clean up potentially malformed SSH URLs to enforce https format
      let safeUrl = repoUrl;
      if (safeUrl.startsWith("git@github.com:")) {
        safeUrl = safeUrl.replace("git@github.com:", "https://github.com/");
      }
      if (safeUrl.endsWith(".git")) {
        safeUrl = safeUrl.replace(".git", "");
      }

      // === GitHub App Private Repo Support ===
      let cloneUrl = safeUrl;
      const appId = process.env.GITHUB_APP_ID;
      let privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

      if (appId && privateKey) {
        logger.info({ repoId }, "GitHub App config detected — negotiating installation token");

        // Handle newlines in env variables depending on how they were pasted
        privateKey = privateKey.replace(/\\n/g, "\n");

        try {
          const { App } = await import("@octokit/app");
          const app = new App({ appId, privateKey });

          const parts = safeUrl.split("/");
          const owner = parts[parts.length - 2];
          const repoName = parts[parts.length - 1];
          if (!owner || !repoName) {
            throw new Error("Invalid GitHub repository URL for app token negotiation");
          }
          const ownerName: string = owner;
          const repositoryName: string = repoName;

          // Find if the user installed the app on this specific repo
          const { data: installation } = await app.octokit.request(
            "GET /repos/{owner}/{repo}/installation",
            {
              owner: ownerName,
              repo: repositoryName,
            }
          );

          // Generate a short-lived token for git clone
          const {
            data: { token },
          } = await app.octokit.request("POST /app/installations/{installation_id}/access_tokens", {
            installation_id: installation.id,
          });

          cloneUrl = `https://x-access-token:${token}@github.com/${ownerName}/${repositoryName}.git`;
          logger.info(
            { owner: ownerName, repoName: repositoryName, repoId },
            "Installation token generated — cloning private repository"
          );
        } catch (e: any) {
          logger.warn(
            { err: e, repoId },
            "Could not negotiate GitHub App token — falling back to public anonymous clone"
          );
        }
      }

      if (repoUrl.startsWith("local://")) {
        logger.info({ repoId }, "Detected local uploaded repository — skipping git clone");
        if (!fs.existsSync(repoPath)) {
          throw new Error("Temporary local upload path does not exist or has expired.");
        }
        await Repository.findByIdAndUpdate(repoId, {
          commitHash: "local",
          fingerprint: `${repoUrl}_local`,
          status: "indexing",
        });
      } else {
        // Create temp directory explicitly
        if (!fs.existsSync(repoPath)) {
          fs.mkdirSync(repoPath, { recursive: true });
        }

        logger.info({ safeUrl, repoPath, repoId }, "Cloning repository");
        const git = simpleGit();
        await git.clone(cloneUrl, repoPath, ["--depth", "1"]);

        const clonedRepo = simpleGit(repoPath);
        const latestCommit = await clonedRepo.revparse(["HEAD"]);

        await Repository.findByIdAndUpdate(repoId, {
          commitHash: latestCommit,
          fingerprint: `${safeUrl}_${latestCommit}`,
          status: "indexing",
        });
      }

      await job.updateProgress(30);

      // === STEP 2: AST Parsing ===
      logger.info({ repoId }, "Generating AST");

      // Clean up old data to prevent duplicates on re-analysis
      const { RepoParsedData } = await import("../models/repoParsedData.model.js");
      const { FileContent } = await import("../models/fileContent.model.js");

      await RepoParsedData.deleteMany({ repoId });
      await FileContent.deleteMany({ repoId });

      // scanCodeFiles automatically ignores node_modules, .git, etc.
      const scannedFiles = scanCodeFiles(repoPath);
      if (scannedFiles.length === 0) {
        throw new Error("No valid code files found to parse.");
      }

      const filePaths = scannedFiles.map((f) => f.absolutePath);
      await processRepositoryParsing(repoId, filePaths);

      // Save file tree and contents to MongoDB so FileExplorer works
      logger.info({ repoId }, "Saving file tree and contents to MongoDB");
      const { saveRepoFilesToDB } = await import("../services/parser.service.js");
      const savedFilesCount = await saveRepoFilesToDB(repoId, repoPath);
      logger.info({ repoId, savedFilesCount }, "File tree saved to MongoDB");

      // Generate AI Description asynchronously so it doesn't block job completion
      logger.info({ repoId }, "Queueing async AI repository summary generation");
      (async () => {
        try {
          const repoDoc = await Repository.findById(repoId);
          if (repoDoc) {
            const filesSnippet = scannedFiles.slice(0, 50).map(f => f.relativePath).join(", ");
            const prompt = `Based on the following file paths from the repository '${repoDoc.name}', generate a concise 2-3 sentence summary of what this repository likely is and what technologies it uses. Do not use Markdown formatting. File paths: ${filesSnippet}`;
            const summary = await generateAnswer(prompt);
            await Repository.findByIdAndUpdate(repoId, { description: summary.trim() });
            logger.info({ repoId }, "AI repository summary generated successfully in background");
          }
        } catch (err) {
          logger.warn({ err, repoId }, "Failed to generate AI repository summary in background");
        }
      })();

      await job.updateProgress(70);

      // === STEP 2.5: Static Security Scan ===
      logger.info({ repoId }, "Running static security scan");
      const { runSecurityScan } = await import("../services/securityScanner.service.js");
      const issueCount = await runSecurityScan(repoId, repoPath);
      logger.info({ repoId, issueCount }, "Security scan complete");

      await job.updateProgress(85);

      // === STEP 2.7: Clean Architecture Boundary Scan ===
      logger.info({ repoId }, "Running clean architecture boundary scan");
      const { runArchitectureCheck } = await import("../services/architectureEngine.service.js");
      const violationCount = await runArchitectureCheck(repoId);
      logger.info({ repoId, violationCount }, "Architecture scan complete");

      // await job.updateProgress(75);

      // === STEP 3: Vector Embedding (DEFERRED — Now happens on-demand when chat is used) ===
      // logger.info({ repoId }, "Uploading semantics to Qdrant");
      // await job.updateProgress(80);
      // await embedRepository(repoId);

      // === SUCCESS ===
      await Repository.findByIdAndUpdate(repoId, { status: "indexed" });
      await job.updateProgress(100);

      logger.info({ jobId: job.id, repoId }, "Repository processing job completed successfully");
      return { success: true, repoId, message: "Repository processed successfully." };
    } catch (error: any) {
      logger.error({ err: error, jobId: job.id, repoId }, "Repository processing job failed");

      await Repository.findByIdAndUpdate(repoId, { status: "failed" });

      throw new Error(error.message || "Repository processing failed.");
    } finally {
      // === STEP 4: Bulletproof Cleanup ===
      try {
        if (fs.existsSync(repoPath)) {
          await fs.promises.rm(repoPath, { recursive: true, force: true });
          logger.info({ repoPath, repoId }, "Temporary directory cleaned up");
        }
      } catch (cleanupError) {
        logger.error(
          { err: cleanupError, repoPath },
          "FATAL: Failed to clean up temporary directory"
        );
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Allow processing up to 5 repos concurrently
    
    // Upstash Free Tier Optimization:
    // BullMQ polls Redis aggressively by default for stalled jobs.
    // Increasing these intervals dramatically reduces Redis command consumption when idle.
    settings: {
      stalledInterval: 300000, // Check for stalled jobs every 5 minutes (default is 30s)
      maxStalledCount: 1,
      guardInterval: 300000,
      drainDelay: 300000,
    }
  }
);

repoWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Worker: job completed");
});

repoWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Worker: job failed");
});
