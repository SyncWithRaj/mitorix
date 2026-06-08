/**
 * Codebase Drift Detector Service
 *
 * Uses Qdrant as a temporal database for code semantics.
 * Compares vector embeddings across different versions of a repository.
 *
 * Supports TWO modes:
 *  1. Same-repo mode: compare different fingerprints within a single repo
 *  2. Cross-repo mode: compare vectors between two different repos
 *     (for when user indexed the same codebase twice as separate repos)
 *
 * Qdrant features used:
 *   - scroll() with payload filtering by repoId + fingerprint
 *   - search() with old vector against new version's points
 */

import { QdrantClient } from "@qdrant/js-client-rest";
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

export interface DriftEntity {
  name: string;
  filePath: string;
  type: string;
  startLine: number;
  endLine: number;
}

export interface DriftItem {
  entity: DriftEntity;
  driftScore: number;
  status: "modified" | "deleted" | "new";
  matchScore?: number;
}

export interface FileDriftSummary {
  filePath: string;
  avgDrift: number;
  entityCount: number;
  maxDrift: number;
}

export interface DriftReport {
  items: DriftItem[];
  fileSummaries: FileDriftSummary[];
  overallDrift: number;
  stats: {
    totalOldEntities: number;
    totalNewEntities: number;
    modified: number;
    deleted: number;
    added: number;
    unchanged: number;
    elapsedMs: number;
  };
  versions: {
    old: string;
    new: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Scroll all points for a repo (optionally filtered by fingerprint). */
async function scrollRepoPoints(
  repoId: string,
  fingerprint: string | null,
  withVector: boolean
): Promise<any[]> {
  const allPoints: any[] = [];
  let nextOffset: string | number | null | undefined = undefined;

  const mustFilters: any[] = [
    { key: "metadata.repoId", match: { value: repoId } },
  ];
  if (fingerprint) {
    mustFilters.push({
      key: "metadata.fingerprint",
      match: { value: fingerprint },
    });
  }

  do {
    const scrollResult: any = await qdrant.scroll(COLLECTION, {
      filter: { must: mustFilters },
      with_payload: true,
      with_vector: withVector,
      limit: 100,
      ...(nextOffset !== undefined ? { offset: nextOffset } : {}),
    });
    allPoints.push(...scrollResult.points);
    nextOffset = scrollResult.next_page_offset;
  } while (nextOffset !== null && nextOffset !== undefined);

  return allPoints;
}

// ─── Get Versions ────────────────────────────────────────────────────────────

/**
 * Get all available versions for a repo.
 * Also returns all OTHER repos from the same user that share the same
 * GitHub URL — these can be used for cross-repo drift comparison.
 */
export async function getVersionFingerprints(
  repoId: string,
  requesterUserId: string
): Promise<{
  fingerprints: string[];
  currentFingerprint: string;
  crossRepoTargets: Array<{ repoId: string; repoName: string; fingerprint: string }>;
}> {
  const repo = await getRepositoryForUserOrThrow(repoId, requesterUserId);
  const currentFingerprint = repo.fingerprint || "";

  // Scroll all points for this repo to discover fingerprints
  const allPoints = await scrollRepoPoints(repoId, null, false);
  const fingerprints = [
    ...new Set(
      allPoints.map((p: any) => p.payload?.metadata?.fingerprint).filter(Boolean)
    ),
  ] as string[];

  // Find OTHER repos to allow comparing against ANY other repository the user owns
  const allUserRepos = await Repository.find({
    user: repo.user, // Important: Schema uses 'user', not 'userId'
  }).lean();

  const crossRepoTargets = allUserRepos
    .filter((r: any) => r._id.toString() !== repoId)
    .map((r: any) => ({
      repoId: r._id.toString(),
      repoName: r.name || r.githubUrl || "Unknown",
      fingerprint: r.fingerprint || "",
    }))
    .filter((t) => t.fingerprint !== ""); // Only include repos that have been embedded

  return { fingerprints, currentFingerprint, crossRepoTargets };
}

// ─── Main Drift Detection ────────────────────────────────────────────────────

/**
 * Compare two sets of vectors for semantic drift.
 *
 * Modes:
 *  - Same repo, different fingerprint: oldRepoId === newRepoId
 *  - Cross repo: oldRepoId !== newRepoId (user indexed same code twice)
 */
export async function computeDrift(
  repoId: string,
  requesterUserId: string,
  oldFingerprint: string,
  newFingerprint: string,
  compareRepoId?: string // Optional: if provided, compare against a different repo
): Promise<DriftReport> {
  const startTime = Date.now();

  const repo = await getRepositoryForUserOrThrow(repoId, requesterUserId);
  const newRepoId = compareRepoId || repoId;

  // If cross-repo, validate access
  let newRepo = repo;
  if (compareRepoId && compareRepoId !== repoId) {
    newRepo = await getRepositoryForUserOrThrow(compareRepoId, requesterUserId);
  }

  logger.info(
    { oldRepo: repoId, newRepo: newRepoId, oldFingerprint, newFingerprint },
    "Drift detection: starting comparison"
  );

  // Step 1: Get old version points WITH vectors
  const oldPoints = await scrollRepoPoints(repoId, oldFingerprint || null, true);
  logger.info({ count: oldPoints.length }, "Old version points loaded");

  // Step 2: Get new version points (for counting)
  const newPoints = await scrollRepoPoints(newRepoId, newFingerprint || null, false);
  logger.info({ count: newPoints.length }, "New version points loaded");

  // Step 3: For each old point, find closest match in new version
  const driftItems: DriftItem[] = [];
  let totalDrift = 0;
  let modifiedCount = 0;
  let deletedCount = 0;
  let unchangedCount = 0;
  const matchedNewIds = new Set<string>();

  // Build search filter for new version
  const newSearchFilter: any = {
    must: [
      { key: "metadata.repoId", match: { value: newRepoId } },
    ],
  };
  if (newFingerprint) {
    newSearchFilter.must.push({
      key: "metadata.fingerprint",
      match: { value: newFingerprint },
    });
  }

  for (const oldPoint of oldPoints) {
    const vector = oldPoint.vector;
    if (!vector || !Array.isArray(vector)) continue;

    const oldMeta = oldPoint.payload?.metadata;
    if (!oldMeta) continue;

    const matches = await qdrant.search(COLLECTION, {
      vector,
      limit: 1,
      filter: newSearchFilter,
      with_payload: true,
      score_threshold: 0.1,
    });

    const relativePath = oldMeta.filePath
      ? path.relative(repo.localPath, oldMeta.filePath).replace(/\\/g, "/")
      : "unknown";

    const entityInfo: DriftEntity = {
      name: oldPoint.payload?.pageContent?.substring(0, 100) || "Unknown",
      filePath: relativePath,
      type: oldMeta.language || "unknown",
      startLine: oldMeta.startLine || 0,
      endLine: oldMeta.endLine || 0,
    };

    if (matches.length > 0) {
      const best = matches[0];
      const similarity = best.score || 0;
      const drift = Math.round((1 - similarity) * 100);
      matchedNewIds.add(String(best.id));

      if (drift > 5) {
        driftItems.push({ entity: entityInfo, driftScore: drift, status: "modified", matchScore: Math.round(similarity * 100) });
        modifiedCount++;
        totalDrift += drift;
      } else {
        unchangedCount++;
      }
    } else {
      driftItems.push({ entity: entityInfo, driftScore: 100, status: "deleted" });
      deletedCount++;
      totalDrift += 100;
    }
  }

  // Step 4: New entities
  const addedCount = newPoints.length - matchedNewIds.size;
  let addedSampled = 0;
  for (const np of newPoints) {
    if (matchedNewIds.has(String(np.id))) continue;
    if (addedSampled >= 20) break;
    const nm = np.payload?.metadata;
    if (!nm) continue;
    const rp = nm.filePath ? path.relative(newRepo.localPath, nm.filePath).replace(/\\/g, "/") : "unknown";
    driftItems.push({
      entity: { name: np.payload?.pageContent?.substring(0, 100) || "New Entity", filePath: rp, type: nm.language || "unknown", startLine: nm.startLine || 0, endLine: nm.endLine || 0 },
      driftScore: 100, status: "new",
    });
    addedSampled++;
  }

  // Step 5: File summaries
  const fileMap = new Map<string, { total: number; count: number; max: number }>();
  for (const item of driftItems) {
    if (item.status === "new") continue;
    const e = fileMap.get(item.entity.filePath) || { total: 0, count: 0, max: 0 };
    e.total += item.driftScore; e.count++; e.max = Math.max(e.max, item.driftScore);
    fileMap.set(item.entity.filePath, e);
  }

  const fileSummaries: FileDriftSummary[] = Array.from(fileMap.entries())
    .map(([fp, d]) => ({ filePath: fp, avgDrift: Math.round(d.total / d.count), entityCount: d.count, maxDrift: d.max }))
    .sort((a, b) => b.avgDrift - a.avgDrift);

  driftItems.sort((a, b) => b.driftScore - a.driftScore);

  const totalAnalysed = modifiedCount + deletedCount + unchangedCount;
  const overallDrift = totalAnalysed > 0 ? Math.round(totalDrift / totalAnalysed) : 0;
  const elapsed = Date.now() - startTime;

  logger.info({ modified: modifiedCount, deleted: deletedCount, added: addedCount, unchanged: unchangedCount, overallDrift, elapsed }, "Drift detection complete");

  return {
    items: driftItems.slice(0, 50),
    fileSummaries: fileSummaries.slice(0, 20),
    overallDrift,
    stats: { totalOldEntities: oldPoints.length, totalNewEntities: newPoints.length, modified: modifiedCount, deleted: deletedCount, added: addedCount, unchanged: unchangedCount, elapsedMs: elapsed },
    versions: { old: oldFingerprint || repoId, new: newFingerprint || newRepoId },
  };
}
