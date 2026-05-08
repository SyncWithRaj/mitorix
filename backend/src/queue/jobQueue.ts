import { Queue } from "bullmq";
import Redis from "ioredis";

// Configure Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
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

export const repoQueue = new Queue<JobData, JobResult, string>("repo-processing-queue", {
  connection: redisConnection,
});

export const cleanupQueue = new Queue("cleanup-queue", {
  connection: redisConnection,
});
