import { Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";

// Configure Redis connection
export const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export interface JobData {
  repoUrl: string;
  userId: string;
  repoId: string;
}

export interface JobResult {
  success: boolean;
  repoId: string;
  message?: string;
}

const upstashOptimizedSettings = {
  stalledInterval: 300000, // 5 minutes
  maxStalledCount: 1,
  guardInterval: 300000, // 5 minutes
  drainDelay: 300000, // 5 minutes
};

export const repoQueue = new Queue<JobData, JobResult, string>("repo-processing-queue", {
  connection: redisConnection,
  settings: upstashOptimizedSettings,
});

export const cleanupQueue = new Queue("cleanup-queue", {
  connection: redisConnection,
  settings: upstashOptimizedSettings,
});

export const globalQueueEvents = new QueueEvents("repo-processing-queue", {
  connection: redisConnection,
});
