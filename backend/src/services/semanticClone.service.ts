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
import { RepoParsedData } from "../models/repoParsedData.model.js";
import { expandEntities } from "../utils/repoParsedData.helpers.js";
import { Repository } from "../models/repo.model.js";
import { getCachedFileContentBatch } from "../utils/fileContentCache.util.js";
import mongoose from "mongoose";
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
 * Extract code content for an entity from the file content cache.
 */
function extractEntityCode(
  filePath: string,
  startLine: number,
  endLine: number,
  fileContentCache: Map<string, string>
): string {
  const fullContent = fileContentCache.get(filePath) || "";
  if (!fullContent) return "";

  const lines = fullContent.split("\n");
  return lines.slice(Math.max(0, startLine - 1), endLine).join("\n").substring(0, 500);
}

/**
 * Resolve a Qdrant point payload into a CloneEntity using the provided map.
 * Uses file content cache to provide actual code content.
 */
function resolveEntity(
  payload: any,
  basePath: string,
  entityMap: Map<string, any>,
  fileContentCache: Map<string, string>
): CloneEntity | null {
  const meta = payload?.metadata || {};
  const mongoId = meta.mongoId;
  const entityIndex = meta.entityIndex;
  if (!mongoId && entityIndex === undefined) return null;

  const entityKey = mongoId || `idx_${entityIndex}`;
  const entity = entityMap.get(entityKey);
  if (!entity) return null;

  const relativePath = path
    .relative(basePath, entity.filePath)
    .replace(/\\/g, "/");

  const content = extractEntityCode(
    relativePath,
    entity.startLine,
    entity.endLine,
    fileContentCache
  );

  return {
    mongoId: entity._id ? entity._id.toString() : `idx_${entity.entityIndex}`,
    name: entity.name,
    type: entity.type,
    filePath: relativePath,
    language: entity.language || "unknown",
    startLine: entity.startLine,
    endLine: entity.endLine,
    content,
  };
}

// ─── Main Detection Logic ────────────────────────────────────────────────────

export async function detectSemanticClones(
  repoId: string,
  requesterUserId: string,
  similarityThreshold: number = 0.85,
  maxClusters: number = 30
): Promise<CloneDetectionResult> {
  const startTime = Date.now();

  const repo = await getRepositoryForUserOrThrow(repoId, requesterUserId);

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

  // ── Step 2: Batch-fetch all entities from MongoDB ──
  const parsedData = await RepoParsedData.findOne({ repoId }).lean();
  const allEntities = parsedData ? expandEntities(parsedData as any) : [];
  
  const entityMap = new Map<string, any>();
  for (const e of allEntities) {
    if (e._id) entityMap.set(e._id.toString(), e);
    if (e.entityIndex !== undefined) entityMap.set(`idx_${e.entityIndex}`, e);
  }

  // ── Step 3: Pre-fetch file contents for code display ──
  const uniqueFilePaths = new Set<string>();
  for (const point of allPoints) {
    const meta = point.payload?.metadata;
    if (meta?.filePath) {
      const relPath = path.relative(repo.localPath, meta.filePath).replace(/\\/g, "/");
      uniqueFilePaths.add(relPath);
    }
  }
  const fileContentCache = await getCachedFileContentBatch(repoId, [...uniqueFilePaths]);
  logger.info({ repoId, cachedFiles: fileContentCache.size }, "File contents pre-fetched for code display");

  // ── Step 4: For each point, find nearest neighbours (different file) ──
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
    const symbolName = point.payload?.metadata?.symbolName || point.payload?.metadata?.name || "";
    
    const lowerName = symbolName.toLowerCase();
    if (
      !anchorFilePath ||
      lowerName.includes("anonymous") ||
      lowerName === "default"
    ) {
      continue;
    }

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
      const anchorEntity = resolveEntity(point.payload, repo.localPath, entityMap, fileContentCache);
      if (!anchorEntity) continue;

      const cloneEntities: Array<CloneEntity & { similarity: number }> = [];

      for (const match of similar) {
        const matchId = String(match.id);
        if (processedIds.has(matchId)) continue;

        const cloneEntity = resolveEntity(match.payload, repo.localPath, entityMap, fileContentCache);
        if (!cloneEntity) continue;

        cloneEntities.push({
          ...cloneEntity,
          similarity: Math.round((match.score || 0) * 100),
        });

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

    if (clusters.length >= maxClusters) break;
  }

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
