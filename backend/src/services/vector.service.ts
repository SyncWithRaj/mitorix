import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddingModel } from "./embedding.service.js";
import { Repository } from "../models/repo.model.js";

let vectorStore: QdrantVectorStore | null = null;

const getVectorStore = async () => {
  if (vectorStore) return vectorStore;

  vectorStore = await QdrantVectorStore.fromExistingCollection(embeddingModel, {
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
    collectionName: "repo_entities",
    contentPayloadKey: "pageContent",
    metadataPayloadKey: "metadata",
  });

  return vectorStore;
};

export const searchVectors = async (repoId: string, query: string) => {
  const repo = await Repository.findById(repoId);

  const store = await getVectorStore();

  const results = await store.similaritySearchWithScore(query, 10, {
    must: [
      {
        key: "metadata.repoId",
        match: {
          value: repoId,
        },
      },
    ],
  });

  return results;
};
