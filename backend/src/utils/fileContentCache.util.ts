/**
 * File Content LRU Cache
 *
 * Shared in-memory LRU cache for file content reads. Prevents redundant
 * MongoDB queries when multiple services (query, embedding, search) access
 * the same file content within a short window.
 *
 * Features:
 * - Max 500 files cached
 * - 50MB total memory cap
 * - 30-minute TTL per entry
 * - Per-repo cache invalidation on re-parse/delete
 */

import { LRUCache } from "lru-cache";
import { FileContent } from "../models/fileContent.model.js";
import { decompressContent } from "./contentCompression.util.js";

const cache = new LRUCache<string, string>({
  max: 500,
  maxSize: 50_000_000, // 50MB total cap
  sizeCalculation: (value: string) => Math.max(1, value.length),
  ttl: 1000 * 60 * 30, // 30 minutes
});

/**
 * Get a single file's content from cache or MongoDB.
 * Transparently handles decompression.
 */
export async function getCachedFileContent(
  repoId: string,
  relativePath: string
): Promise<string> {
  const key = `${repoId}:${relativePath}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const doc = await FileContent.findOne(
    { repoId, relativePath },
    { content: 1, contentEncoding: 1 }
  ).lean();

  const content = doc
    ? decompressContent((doc as any).content, (doc as any).contentEncoding)
    : "";

  cache.set(key, content);
  return content;
}

/**
 * Batch-fetch multiple files' content from cache/MongoDB.
 * Fetches only the cache-missed paths from DB in a single query.
 */
export async function getCachedFileContentBatch(
  repoId: string,
  relativePaths: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const cacheMisses: string[] = [];

  // Check cache first
  for (const p of relativePaths) {
    const key = `${repoId}:${p}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
      result.set(p, cached);
    } else {
      cacheMisses.push(p);
    }
  }

  // Batch-fetch cache misses from MongoDB
  if (cacheMisses.length > 0) {
    const docs = await FileContent.find(
      { repoId, relativePath: { $in: cacheMisses } },
      { relativePath: 1, content: 1, contentEncoding: 1 }
    ).lean();

    for (const doc of docs) {
      const d = doc as any;
      const content = decompressContent(d.content, d.contentEncoding);
      const key = `${repoId}:${d.relativePath}`;
      cache.set(key, content);
      result.set(d.relativePath, content);
    }

    // Set empty string for paths not found in DB
    for (const p of cacheMisses) {
      if (!result.has(p)) {
        const key = `${repoId}:${p}`;
        cache.set(key, "");
        result.set(p, "");
      }
    }
  }

  return result;
}

/**
 * Invalidate all cached entries for a given repo.
 * Call this when a repo is re-parsed or deleted.
 */
export function invalidateRepoCache(repoId: string): void {
  const prefix = `${repoId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache stats for debugging/monitoring.
 */
export function getCacheStats() {
  return {
    size: cache.size,
    calculatedSize: cache.calculatedSize,
    max: cache.max,
    maxSize: 50_000_000,
  };
}
