import type { Document } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IRepository extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  githubUrl: string;
  defaultBranch: string;
  localPath: string;
  status: "cloning" | "cloned" | "indexing" | "indexed" | "failed";
  jobId?: string;
  commitHash?: string;
  fingerprint?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  onboardingGuide?: any;
  systemDesignDoc?: string;
  description?: string;
  isSession?: boolean;
  isEmbedded?: boolean;
}

const repoSchema = new Schema<IRepository>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    githubUrl: {
      type: String,
      required: true,
    },
    defaultBranch: {
      type: String,
      default: "main",
    },
    localPath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["cloning", "cloned", "indexing", "indexed", "failed"],
      default: "cloning",
    },
    jobId: {
      type: String,
    },
    commitHash: {
      type: String,
    },
    fingerprint: {
      type: String,
      index: true,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
      index: true, // Useful for the cleanup query
    },
    onboardingGuide: {
      type: Schema.Types.Mixed,
    },
    systemDesignDoc: {
      type: String,
    },
    description: {
      type: String,
    },
    isSession: {
      type: Boolean,
      default: false,
    },
    isEmbedded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

repoSchema.statics.touch = async function (repoId: string) {
  return this.findByIdAndUpdate(repoId, { lastAccessedAt: new Date() });
};

export const Repository = mongoose.model<IRepository>("Repository", repoSchema);

/**
 * Updates the lastAccessedAt timestamp for a repository and logs the action.
 * @param repoId The ID of the repository to touch
 */
// Throttling: Map of repoId -> last update timestamp (in memory)
const touchCache = new Map<string, number>();
const TOUCH_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Updates the lastAccessedAt timestamp for a repository with a 5-minute throttle.
 * This prevents unnecessary database load during active browsing sessions.
 * @param repoId The ID of the repository to touch
 */
export const touchRepository = async (repoId: string) => {
  try {
    const now = Date.now();
    const lastUpdate = touchCache.get(repoId);

    // Skip update if we already touched this repo in the last 5 minutes
    if (lastUpdate && now - lastUpdate < TOUCH_THROTTLE_MS) {
      return;
    }

    const { Repository: RepoModel } = await import("./repo.model.js");
    await RepoModel.findByIdAndUpdate(repoId, { lastAccessedAt: new Date() });

    // Update the cache
    touchCache.set(repoId, now);

    // Cleanup cache periodically if it gets too large (basic memory management)
    if (touchCache.size > 1000) {
      const oldestCutoff = now - TOUCH_THROTTLE_MS;
      for (const [id, time] of touchCache.entries()) {
        if (time < oldestCutoff) touchCache.delete(id);
      }
    }
  } catch (error) {
    const logger = (await import("../lib/logger.js")).default;
    logger.error({ err: error, repoId }, "Failed to update repository access timer");
  }
};
