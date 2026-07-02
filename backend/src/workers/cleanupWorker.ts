import { Repository } from "../models/repo.model.js";
import { User } from "../models/auth.model.js";
import { purgeRepository } from "../utils/purge.util.js";
import { TIER_REPO_TTL_DAYS, type SubscriptionTier } from "../config/subscription.config.js";
import logger from "../lib/logger.js";

// Run every hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

export async function runCleanupTask() {
  try {
    logger.info("Running repository TTL cleanup task...");
    
    // Find all repositories
    const repos = await Repository.find({}).lean();
    
    for (const repo of repos) {
      if (!repo.lastAccessedAt) continue;
      
      const user = await User.findById(repo.user).lean();
      if (!user) {
        // Orphaned repo, probably should be deleted, but let's be safe
        continue;
      }
      
      const tier = (user.subscriptionTier || "FREE") as SubscriptionTier;
      const ttlDays = TIER_REPO_TTL_DAYS[tier];
      
      if (ttlDays === -1) {
        // No TTL for this tier
        continue;
      }
      
      const lastAccessed = new Date(repo.lastAccessedAt).getTime();
      const now = Date.now();
      const diffDays = (now - lastAccessed) / (1000 * 60 * 60 * 24);
      
      if (diffDays > ttlDays) {
        logger.info(
          { repoId: repo._id, repoName: repo.name, tier, diffDays, ttlDays },
          "Repository exceeded TTL, starting purge"
        );
        
        await purgeRepository(repo._id.toString());
      }
    }
    
    logger.info("Repository TTL cleanup task completed");
  } catch (error) {
    logger.error({ err: error }, "Failed to run repository TTL cleanup task");
  }
}

// Start the periodic task if running in the main server process
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupWorker() {
  if (cleanupInterval) return;
  
  // Run immediately on start, then every interval
  setTimeout(() => runCleanupTask(), 5000); // 5 second delay to let server start up
  cleanupInterval = setInterval(runCleanupTask, CLEANUP_INTERVAL_MS);
  
  logger.info("Repository TTL cleanup worker started");
}
