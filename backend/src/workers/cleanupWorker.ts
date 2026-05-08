import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { Repository } from "../models/repo.model.js";
import { purgeRepository } from "../utils/purge.util.js";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// TTL in hours (default to 24 hours if not specified)
const TTL_HOURS = process.env.REPO_TTL_HOURS ? parseInt(process.env.REPO_TTL_HOURS, 10) : 24;
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

export const cleanupWorker = new Worker(
  "cleanup-queue",
  async (job: Job) => {
    console.log(`[Cleanup Worker] Starting automated cleanup job ${job.id}`);

    try {
      const cutoffDate = new Date(Date.now() - TTL_MS);

      // Find repositories whose lastAccessedAt is older than the cutoff date
      const inactiveRepos = await Repository.find({
        lastAccessedAt: { $lt: cutoffDate },
      });

      console.log(`[Cleanup Worker] Found ${inactiveRepos.length} inactive repositories to purge.`);

      let successCount = 0;
      let failureCount = 0;

      for (const repo of inactiveRepos) {
        console.log(
          `[Cleanup Worker] Purging inactive repo: ${repo.name} (${repo._id}) - Last accessed: ${repo.lastAccessedAt}`
        );
        const success = await purgeRepository(repo._id.toString());
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      console.log(
        `[Cleanup Worker] Cleanup completed. Successfully purged: ${successCount}. Failed: ${failureCount}.`
      );

      return {
        purged: successCount,
        failed: failureCount,
      };
    } catch (error) {
      console.error(`[Cleanup Worker] Error during cleanup execution:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Only run one cleanup job at a time
  }
);

cleanupWorker.on("completed", (job) => {
  console.log(`[Cleanup Worker-Event] Job ${job.id} has completed!`);
});

cleanupWorker.on("failed", (job, err) => {
  console.log(`[Cleanup Worker-Event] Job ${job?.id} has failed with ${err.message}`);
});
