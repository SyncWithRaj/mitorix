import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embeddingModel, embedDirect } from "./embedding.service.js";
import { Repository } from "../models/repo.model.js";

const COLLECTION = "repo_entities";

// Direct Qdrant client for fast searches (bypasses LangChain overhead)
const qdrantDirect = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

// LangChain vector store — kept for backward compatibility
let vectorStore: QdrantVectorStore | null = null;

const getVectorStore = async () => {
  if (vectorStore) return vectorStore;

  vectorStore = await QdrantVectorStore.fromExistingCollection(embeddingModel, {
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
    collectionName: COLLECTION,
    contentPayloadKey: "pageContent",
    metadataPayloadKey: "metadata",
  });

  return vectorStore;
};

/**
 * Fast vector search using direct Ollama embed + direct Qdrant search.
 * Bypasses LangChain's slower embedQuery() and search wrappers.
 * Used by the RAG chat pipeline (query.service.ts).
 */
export const searchVectors = async (repoId: string, query: string) => {
  // Embed query directly via Ollama /api/embed (faster than LangChain wrapper)
  const queryVector = await embedDirect(query);

  // Search Qdrant directly with HNSW params
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
      hnsw_ef: 96,     // Tuned for speed (default 128)
      exact: false,     // Approximate search (HNSW)
    },
  });

  // Transform to match the LangChain format that query.service.ts expects:
  // Array of [Document, score] tuples
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
