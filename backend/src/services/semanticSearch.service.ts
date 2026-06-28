/**
 * Semantic Code Search Service
 *
 * Uses Qdrant as a standalone search engine (NOT RAG — no LLM involved).
 * Embeds the user's natural language query using Gemini embedding API
 * then performs vector similarity search with payload
 * filters + keyword re-ranking.
 *
 * Accuracy improvements over naive vector search:
 *  1. Gemini embedding trained for both query and document embedding
 *  2. Query augmentation to match document embedding format
 *  3. Hybrid scoring: vector similarity + keyword relevance boost
 *  4. Fetch more candidates from Qdrant, then re-rank and trim
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { embedDirect } from "./embedding.service.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { Repository } from "../models/repo.model.js";
import path from "path";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";
import { getRepositoryForUserOrThrow } from "../utils/repositoryAccess.util.js";

const COLLECTION = "repo_entities";

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

// Query embedding uses direct Gemini API call
// Gemini is trained for both document and query embedding

export interface SearchFilters {
  entityType?: string; // e.g., "function", "class", "route"
  language?: string; // e.g., "typescript", "javascript"
  folder?: string; // e.g., "src/services"
}

export interface SearchResult {
  entityId: string;
  name: string;
  type: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  content: string;
  score: number; // Final hybrid score (0–1)
  vectorScore: number; // Raw Qdrant cosine similarity
  keywordScore: number; // Keyword relevance boost
  parameters?: string[];
  returnType?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalFound: number;
  query: string;
  filters: SearchFilters;
  facets: {
    types: Record<string, number>;
    languages: Record<string, number>;
    folders: Record<string, number>;
  };
}

// ─── Keyword Relevance Scoring ───────────────────────────────────────────────

/**
 * Compute a keyword relevance score (0–1) between a query and an entity.
 * This catches cases where the entity name or content directly contains
 * the search terms, which vector search alone might underweight.
 */
function computeKeywordScore(
  query: string,
  entityName: string,
  entityType: string,
  entityContent: string,
  entityFilePath: string
): number {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower
    .split(/[\s,_\-./]+/)
    .filter((t) => t.length >= 2);

  if (queryTerms.length === 0) return 0;

  let score = 0;
  const nameLower = entityName.toLowerCase();
  const typeLower = entityType.toLowerCase();
  const contentLower = entityContent.toLowerCase().substring(0, 2000);
  const pathLower = entityFilePath.toLowerCase();

  for (const term of queryTerms) {
    // Exact name match (highest signal)
    if (nameLower === term) {
      score += 0.35;
    }
    // Name contains term
    else if (nameLower.includes(term)) {
      score += 0.2;
    }

    // File path contains term (e.g., searching "auth" finds auth.middleware.ts)
    if (pathLower.includes(term)) {
      score += 0.1;
    }

    // Entity type matches term (e.g., searching "class" boosts class entities)
    if (typeLower.includes(term)) {
      score += 0.05;
    }

    // Content contains term
    if (contentLower.includes(term)) {
      score += 0.05;
    }
  }

  // Normalise: divide by number of terms so multi-word queries don't inflate
  score = score / queryTerms.length;

  // Also check for camelCase / PascalCase parts of the name
  // e.g., "authentication" should match "authenticateUser"
  const nameParts = nameLower
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[\s_]+/);

  for (const term of queryTerms) {
    for (const part of nameParts) {
      if (part.startsWith(term) || term.startsWith(part)) {
        score += 0.1 / queryTerms.length;
        break;
      }
    }
  }

  return Math.min(score, 1.0);
}

// ─── Query Augmentation ─────────────────────────────────────────────────────

/**
 * Augment a natural language query to better align with the structured
 * document embedding format used during indexing.
 *
 * Documents were embedded as:
 *   "Entity Type: function\nName: authenticate\nFile: src/auth.ts\n\nCode:\n..."
 *
 * So wrapping the query in a similar structure helps the model align
 * the query vector with the document vector space.
 */
function augmentQuery(query: string, filters: SearchFilters): string {
  let augmented = query;

  // If the user specified a type filter, hint it in the query
  if (filters.entityType) {
    augmented = `Entity Type: ${filters.entityType}\n${augmented}`;
  }

  // Add a semantic framing to help the embedding model understand intent
  augmented = `Find code related to: ${augmented}`;

  return augmented;
}

/**
 * Perform semantic code search against Qdrant — no LLM, pure vector similarity
 * with keyword re-ranking for maximum accuracy.
 */
export async function semanticSearch(
  repoId: string,
  requesterUserId: string,
  query: string,
  filters: SearchFilters = {},
  limit: number = 20,
  scoreThreshold: number = 0.15 // Lower threshold — we re-rank afterwards
): Promise<SearchResponse> {
  const repo = await getRepositoryForUserOrThrow(repoId, requesterUserId);

  // Ensure repo is embedded
  if (!repo.isEmbedded) {
    logger.info({ repoId }, "On-demand embedding triggered for semantic search");
    const { embedRepository } = await import("./embedRepository.service.js");
    await embedRepository(repoId);
    await Repository.findByIdAndUpdate(repoId, { isEmbedded: true });
  }

  // ── Step 1: Augment query & embed using direct Gemini API call ──
  const augmentedQuery = augmentQuery(query, filters);
  const queryVector = await embedDirect(augmentedQuery);

  // ── Step 2: Build Qdrant filter conditions ──
  const mustConditions: any[] = [
    { key: "metadata.repoId", match: { value: repoId } },
  ];

  if (filters.language) {
    mustConditions.push({
      key: "metadata.language",
      match: { value: filters.language },
    });
  }

  if (filters.folder) {
    mustConditions.push({
      key: "metadata.filePath",
      match: { text: filters.folder },
    });
  }

  logger.info(
    { repoId, query, augmentedQuery, filters, limit },
    "Semantic search: executing Qdrant vector search"
  );

  // ── Step 3: Fetch MORE candidates from Qdrant (over-fetch for re-ranking) ──
  // HNSW search params: ef controls accuracy/speed tradeoff.
  // Higher ef = more accurate but slower. 64-128 is a good balance.
  const overFetchMultiplier = 3;
  const searchResults = await qdrant.search(COLLECTION, {
    vector: queryVector,
    limit: limit * overFetchMultiplier,
    filter: { must: mustConditions },
    with_payload: true,
    score_threshold: scoreThreshold,
    params: {
      hnsw_ef: 96,       // Search accuracy parameter (default 128, lower = faster)
      exact: false,       // Use approximate search (HNSW) not brute-force
    },
  });

  logger.debug(
    { repoId, rawCount: searchResults.length },
    "Qdrant search returned raw candidates"
  );

  // ── Step 4: Batch-fetch full entity data from MongoDB ──
  const mongoIds = searchResults
    .map((r: any) => r.payload?.metadata?.mongoId)
    .filter(Boolean);

  const entities = await CodeEntity.find(
    { _id: { $in: mongoIds } },
    { name: 1, type: 1, filePath: 1, language: 1, startLine: 1, endLine: 1, content: 1, parameters: 1, returnType: 1 }
  ).lean();
  const entityMap = new Map(entities.map((e: any) => [e._id.toString(), e]));

  // ── Step 5: Score, re-rank, and build results ──
  const VECTOR_WEIGHT = 0.65; // Weight for Qdrant's cosine similarity
  const KEYWORD_WEIGHT = 0.35; // Weight for keyword/name relevance

  interface ScoredCandidate {
    entity: any;
    vectorScore: number;
    keywordScore: number;
    hybridScore: number;
    relativePath: string;
    folder: string;
  }

  const candidates: ScoredCandidate[] = [];

  for (const hit of searchResults) {
    const mongoId = (hit.payload as any)?.metadata?.mongoId;
    if (!mongoId) continue;

    const entity = entityMap.get(mongoId);
    if (!entity) continue;

    // Apply entity type filter (post-filter)
    if (filters.entityType && entity.type !== filters.entityType) continue;

    const relativePath = path
      .relative(repo.localPath, entity.filePath)
      .replace(/\\/g, "/");
    const folder = path.dirname(relativePath);

    // Compute keyword relevance score
    const keywordScore = computeKeywordScore(
      query,
      entity.name,
      entity.type,
      entity.content || "",
      relativePath
    );

    // Compute hybrid score
    const vectorScore = hit.score || 0;
    const hybridScore =
      vectorScore * VECTOR_WEIGHT + keywordScore * KEYWORD_WEIGHT;

    candidates.push({
      entity,
      vectorScore,
      keywordScore,
      hybridScore,
      relativePath,
      folder,
    });
  }

  // Sort by hybrid score (descending) — this is the key re-ranking step
  candidates.sort((a, b) => b.hybridScore - a.hybridScore);

  // ── Step 6: Build final results with facets ──
  const results: SearchResult[] = [];
  const typeFacets: Record<string, number> = {};
  const languageFacets: Record<string, number> = {};
  const folderFacets: Record<string, number> = {};

  for (const candidate of candidates) {
    const { entity, vectorScore, keywordScore, hybridScore, relativePath, folder } =
      candidate;

    // Accumulate facets (from ALL candidates, not just top results)
    typeFacets[entity.type] = (typeFacets[entity.type] || 0) + 1;
    const lang = entity.language || "unknown";
    languageFacets[lang] = (languageFacets[lang] || 0) + 1;
    folderFacets[folder] = (folderFacets[folder] || 0) + 1;

    // Only include top `limit` in actual results
    if (results.length < limit) {
      results.push({
        entityId: entity._id.toString(),
        name: entity.name,
        type: entity.type,
        filePath: relativePath,
        language: lang,
        startLine: entity.startLine,
        endLine: entity.endLine,
        content: entity.content?.substring(0, 600) || "",
        score: Math.round(hybridScore * 100) / 100,
        vectorScore: Math.round(vectorScore * 100) / 100,
        keywordScore: Math.round(keywordScore * 100) / 100,
        parameters: entity.parameters,
        returnType: entity.returnType,
      });
    }
  }

  logger.info(
    { repoId, query, resultCount: results.length, totalCandidates: candidates.length },
    "Semantic search complete (hybrid re-ranked)"
  );

  return {
    results,
    totalFound: results.length,
    query,
    filters,
    facets: {
      types: typeFacets,
      languages: languageFacets,
      folders: folderFacets,
    },
  };
}
