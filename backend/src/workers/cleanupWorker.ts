import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { Repository } from "../models/repo.model.js";
import { purgeRepository } from "../utils/purge.util.js";
import logger from "../lib/logger.js";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// TTL in hours (default to 24 hours if not specified)
const TTL_HOURS = process.env.REPO_TTL_HOURS ? parseInt(process.env.REPO_TTL_HOURS, 10) : 24;
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

export const cleanupWorker = new Worker(
  "cleanup-queue",
  async (job: Job) => {
    logger.info({ jobId: job.id }, "Cleanup Worker: starting automated cleanup job");

    try {
      const cutoffDate = new Date(Date.now() - TTL_MS);

      // Find repositories whose lastAccessedAt is older than the cutoff date
      const inactiveRepos = await Repository.find({
        lastAccessedAt: { $lt: cutoffDate },
      });

      logger.info(
        { inactiveCount: inactiveRepos.length },
        "Cleanup Worker: found inactive repositories to purge"
      );

      let successCount = 0;
      let failureCount = 0;

      for (const repo of inactiveRepos) {
        logger.info(
          { repoId: repo._id, repoName: repo.name, lastAccessedAt: repo.lastAccessedAt },
          "Cleanup Worker: purging inactive repository"
        );
        const success = await purgeRepository(repo._id.toString());
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      logger.info(
        { successCount, failureCount },
        "Cleanup Worker: cleanup completed"
      );

      return {
        purged: successCount,
        failed: failureCount,
      };
    } catch (error) {
      logger.error({ err: error, jobId: job.id }, "Cleanup Worker: error during cleanup execution");
      throw error;
    }
  },
  {
    connection: redisConnection,
    
    // Upstash Free Tier Optimization
    settings: {
      stalledInterval: 300000, // Check for stalled jobs every 5 minutes (default is 30s)
      maxStalledCount: 1,
    },
    concurrency: 1, // Only run one cleanup job at a time
  }
);

cleanupWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Cleanup Worker: job completed");
});

cleanupWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Cleanup Worker: job failed");
});
