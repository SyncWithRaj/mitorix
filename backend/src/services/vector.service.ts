import { QdrantClient } from "@qdrant/js-client-rest";
import { embedDirect } from "./embedding.service.js";

import { generateSparseVector } from "../utils/sparseVector.util.js";

const COLLECTION = "repo_entities";

const qdrantDirect = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

/**
 * Fast vector search using direct Cohere embed + BM25 Hybrid Search.
 * Used by the RAG chat pipeline (query.service.ts).
 */
export const searchVectors = async (repoId: string, query: string) => {
  // Embed query directly via Cohere
  const queryVector = await embedDirect(query);
  const sparseVector = generateSparseVector(query);

  // Search Qdrant using Hybrid Search (Dense + Sparse via RRF)
  const searchResults = await qdrantDirect.query(COLLECTION, {
    prefetch: [
      {
        query: queryVector,
        using: "", // default unnamed dense vector
        limit: 20,
        filter: {
          must: [{ key: "metadata.repoId", match: { value: repoId } }],
        },
      },
      {
        query: sparseVector,
        using: "bm25", // named sparse vector
        limit: 20,
        filter: {
          must: [{ key: "metadata.repoId", match: { value: repoId } }],
        },
      }
    ],
    query: {
      fusion: "rrf" // Reciprocal Rank Fusion
    },
    limit: 10,
    with_payload: true,
  });

  // Transform to [Document, score] format expected by query.service.ts
  const points = (searchResults as any).points || searchResults;
  return points.map((hit: any) => {
    const payload = hit.payload as any;
    return [
      {
        pageContent: payload?.pageContent || "",
        metadata: payload?.metadata || {},
      },
      hit.score || 0,
    ];
  });
};
