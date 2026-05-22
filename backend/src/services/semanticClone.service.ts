/**
 * Semantic Duplicate / Clone Detection Service
 *
 * Uses Qdrant's vector similarity (Recommend API / search) to find
 * semantically similar code across the repository. Unlike LCS-based
 * string comparison, this catches semantic clones — code that does
 * the same thing but is written differently.
 *
 * Qdrant features used:
 *   - scroll() to paginate through all points in a repo
 *   - search() with a point's vector to find its nearest neighbours
 *   - payload filtering to exclude same-file matches
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { CodeEntity } from "../models/codeEntity.model.js";
import { Repository } from "../models/repo.model.js";
import path from "path";
import logger from "../lib/logger.js";
import { getRepositoryForUserOrThrow } from "../utils/repositoryAccess.util.js";

const COLLECTION = "repo_entities";

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CloneEntity {
  mongoId: string;
  name: string;
  type: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  content: string;
}

export interface CloneCluster {
  id: string;
  anchor: CloneEntity;
  clones: Array<CloneEntity & { similarity: number }>;
  avgSimilarity: number;
  cloneCount: number;
}

export interface CloneDetectionResult {
  clusters: CloneCluster[];
  totalClusters: number;
  totalClones: number;
  scanStats: {
    pointsScanned: number;
    comparisons: number;
    elapsedMs: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve a Qdrant point payload into a CloneEntity by fetching from MongoDB.
 */
async function resolveEntity(
  payload: any,
  basePath: string
): Promise<CloneEntity | null> {
  const mongoId = payload?.metadata?.mongoId;
  if (!mongoId) return null;

  const entity = await CodeEntity.findById(mongoId).lean();
  if (!entity) return null;

  return {
    mongoId: (entity as any)._id.toString(),
    name: (entity as any).name,
    type: (entity as any).type,
    filePath: path
      .relative(basePath, (entity as any).filePath)
      .replace(/\\/g, "/"),
    language: (entity as any).language || "unknown",
    startLine: (entity as any).startLine,
    endLine: (entity as any).endLine,
    content: ((entity as any).content || "").substring(0, 500),
  };
}

// ─── Main Detection Logic ────────────────────────────────────────────────────

/**
 * Detect semantic clones across a repository using Qdrant vector similarity.
 *
 * Algorithm:
 *  1. Scroll through all function/method/arrow entities for this repo in Qdrant
 *  2. For each entity, use its vector to search for nearest neighbours
 *  3. Filter: must be different file, similarity > threshold
 *  4. Group into clusters, deduplicate, and return
 */
export async function detectSemanticClones(
  repoId: string,
  requesterUserId: string,
  similarityThreshold: number = 0.85,
  maxClusters: number = 30
): Promise<CloneDetectionResult> {
  const startTime = Date.now();

  const repo = await getRepositoryForUserOrThrow(repoId, requesterUserId);

  // Ensure repo is embedded
  if (!repo.isEmbedded) {
    logger.info({ repoId }, "On-demand embedding triggered for clone detection");
    const { embedRepository } = await import("./embedRepository.service.js");
    await embedRepository(repoId);
    await Repository.findByIdAndUpdate(repoId, { isEmbedded: true });
  }

  logger.info(
    { repoId, threshold: similarityThreshold },
    "Semantic clone detection: starting Qdrant scan"
  );

  // ── Step 1: Scroll through all points for this repo ──
  // We fetch WITH vectors so we can re-search with each vector
  const allPoints: any[] = [];
  let nextOffset: string | number | null | undefined = undefined;

  do {
    const scrollResult: any = await qdrant.scroll(COLLECTION, {
      filter: {
        must: [
          { key: "metadata.repoId", match: { value: repoId } },
        ],
      },
      with_payload: true,
      with_vector: true,
      limit: 100,
      ...(nextOffset !== undefined ? { offset: nextOffset } : {}),
    });

    allPoints.push(...scrollResult.points);
    nextOffset = scrollResult.next_page_offset;
  } while (nextOffset !== null && nextOffset !== undefined);

  logger.info(
    { repoId, totalPoints: allPoints.length },
    "Qdrant scroll complete — starting pairwise similarity search"
  );

  // ── Step 2: For each point, find nearest neighbours (different file) ──
  const processedIds = new Set<string>();
  const clusters: CloneCluster[] = [];
  let totalComparisons = 0;
  let clusterIdCounter = 0;

  for (const point of allPoints) {
    const pointId = String(point.id);
    if (processedIds.has(pointId)) continue;

    const vector = point.vector;
    if (!vector || !Array.isArray(vector)) continue;

    const anchorFilePath = point.payload?.metadata?.filePath;
    if (!anchorFilePath) continue;

    // Search for similar points, excluding same-file matches
    const similar = await qdrant.search(COLLECTION, {
      vector,
      limit: 5,
      filter: {
        must: [
          { key: "metadata.repoId", match: { value: repoId } },
        ],
        must_not: [
          { key: "metadata.filePath", match: { value: anchorFilePath } },
        ],
      },
      with_payload: true,
      score_threshold: similarityThreshold,
    });

    totalComparisons++;

    if (similar.length > 0) {
      // Resolve anchor entity
      const anchorEntity = await resolveEntity(point.payload, repo.localPath);
      if (!anchorEntity) continue;

      // Resolve clone entities
      const cloneEntities: Array<CloneEntity & { similarity: number }> = [];

      for (const match of similar) {
        const matchId = String(match.id);
        if (processedIds.has(matchId)) continue;

        const cloneEntity = await resolveEntity(match.payload, repo.localPath);
        if (!cloneEntity) continue;

        cloneEntities.push({
          ...cloneEntity,
          similarity: Math.round((match.score || 0) * 100),
        });

        // Mark as processed to avoid duplicate clusters
        processedIds.add(matchId);
      }

      if (cloneEntities.length > 0) {
        const avgSim =
          cloneEntities.reduce((sum, c) => sum + c.similarity, 0) /
          cloneEntities.length;

        clusters.push({
          id: `cluster-${clusterIdCounter++}`,
          anchor: anchorEntity,
          clones: cloneEntities,
          avgSimilarity: Math.round(avgSim),
          cloneCount: cloneEntities.length,
        });
      }
    }

    processedIds.add(pointId);

    // Cap clusters to keep response manageable
    if (clusters.length >= maxClusters) break;
  }

  // Sort clusters by average similarity (highest first)
  clusters.sort((a, b) => b.avgSimilarity - a.avgSimilarity);

  const totalClones = clusters.reduce((sum, c) => sum + c.cloneCount, 0);
  const elapsed = Date.now() - startTime;

  logger.info(
    {
      repoId,
      clusters: clusters.length,
      totalClones,
      comparisons: totalComparisons,
      elapsed,
    },
    "Semantic clone detection complete"
  );

  return {
    clusters,
    totalClusters: clusters.length,
    totalClones,
    scanStats: {
      pointsScanned: allPoints.length,
      comparisons: totalComparisons,
      elapsedMs: elapsed,
    },
  };
}
