import { QdrantClient } from "@qdrant/js-client-rest";
import { embedDirect } from "./embedding.service.js";

const COLLECTION = "repo_entities";

const qdrantDirect = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

/**
 * Fast vector search using direct Ollama embed + direct Qdrant search.
 * Used by the RAG chat pipeline (query.service.ts).
 */
export const searchVectors = async (repoId: string, query: string) => {
  // Embed query directly via Ollama /api/embed
  const queryVector = await embedDirect(query);

  // Search Qdrant with HNSW params tuned for speed
  const searchResults = await qdrantDirect.search(COLLECTION, {
    vector: queryVector,
    limit: 10,
    filter: {
      must: [
        {
          key: "metadata.repoId",
          match: { value: repoId },
        },
      ],
    },
    with_payload: true,
    params: {
      hnsw_ef: 96,
      exact: false,
    },
  });

  // Transform to [Document, score] format expected by query.service.ts
  return searchResults.map((hit) => {
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
