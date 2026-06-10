import { embeddingModel, truncateForEmbedding } from "./embedding.service.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import mongoose from "mongoose";
import { CodeEntity } from "../models/codeEntity.model.js";
import { v4 as uuidv4 } from "uuid";
import { Repository } from "../models/repo.model.js";
import { VectorInitService } from "./vectorInit.service.js";
import logger from "../lib/logger.js";

const COLLECTION = "repo_entities";

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

const embeddings = embeddingModel;

import { EventEmitter } from "events";

export const embeddingProgressTracker = new Map<string, { current: number, total: number }>();
export const embeddingEvents = new EventEmitter();

export async function embedRepository(repoId: string, onProgress?: (current: number, total: number) => void) {
  // Ensure the Qdrant collection and indexes exist before interacting
  const vectorInit = new VectorInitService();
  await vectorInit.initVectorCollection();

  const repo = await Repository.findById(repoId);

  if (!repo || !repo.fingerprint) {
    throw new Error("Repo or fingerprint missing");
  }

  logger.info({ repoId }, "Checking if embeddings already exist");

  const existing = await qdrant.scroll(COLLECTION, {
    limit: 1,
    filter: {
      must: [
        {
          key: "metadata.fingerprint",
          match: { value: repo.fingerprint },
        },
      ],
    },
  });

  if (existing.points.length > 0) {
    logger.info({ repoId }, "Embeddings already exist for this repository — skipping");
    return {
      success: true,
      message: "Embeddings already exist",
      embedded: 0,
    };
  }

  logger.info({ repoId }, "Starting vector embedding");

  const entities = await CodeEntity.find({
    repoId: new mongoose.Types.ObjectId(repoId),
  });

  const total = entities.length;

  logger.info({ repoId, entityCount: total }, "Code entities loaded for embedding");

  if (!total) {
    throw new Error("No entities found for this repository");
  }

  embeddingProgressTracker.set(repoId, { current: 0, total });
  embeddingEvents.emit(`progress-${repoId}`, 0, total);

  const points: any[] = [];

  // ── Batch embedding for speed ──
  // Instead of embedding one entity at a time, we batch them and use
  // embedDocuments() which sends all texts in a single Ollama call.
  const EMBED_BATCH_SIZE = 20;
  const QDRANT_UPLOAD_BATCH = 200;
  let processedCount = 0;

  for (let batchStart = 0; batchStart < total; batchStart += EMBED_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + EMBED_BATCH_SIZE, total);
    const batch = entities.slice(batchStart, batchEnd);

    if (batchStart % 40 === 0 || batchStart === 0) {
      logger.debug({ repoId, progress: `${batchStart}/${total}` }, "Embedding batch");
    }

    // Prepare all texts for this batch
    const texts = batch.map((entity) => {
      const text = `
Entity Type: ${entity?.type}
Name: ${entity?.name}
File: ${entity?.filePath}

Code:
${entity?.content || ""}
`;
      return truncateForEmbedding(text);
    });

    // Embed entire batch in ONE call to Ollama
    const vectors = await embeddings.embedDocuments(texts);

    // Build Qdrant points from the batch
    for (let j = 0; j < batch.length; j++) {
      const entity = batch[j];
      const language = entity.language || "unknown";

      points.push({
        id: uuidv4(),
        vector: vectors[j],
        payload: {
          pageContent: entity.content || entity.name,
          metadata: {
            mongoId: entity._id.toString(),
            repoId: repoId.toString(),
            fingerprint: repo.fingerprint,
            filePath: entity.filePath,
            language: language,
            startLine: entity.startLine,
            endLine: entity.endLine,
          },
        },
      });
    }

    processedCount += batch.length;
    embeddingProgressTracker.set(repoId, { current: processedCount, total });
    embeddingEvents.emit(`progress-${repoId}`, processedCount, total);
    if (onProgress) {
      onProgress(processedCount, total);
    }
  }

  // ── Upload vectors to Qdrant ──
  logger.info({ repoId, vectorCount: points.length }, "Uploading vectors to Qdrant");

  const totalChunks = Math.ceil(points.length / QDRANT_UPLOAD_BATCH);
  for (let i = 0; i < points.length; i += QDRANT_UPLOAD_BATCH) {
    const chunk = points.slice(i, i + QDRANT_UPLOAD_BATCH);
    const chunkNum = Math.floor(i / QDRANT_UPLOAD_BATCH) + 1;
    logger.debug({ repoId, chunk: `${chunkNum}/${totalChunks}` }, "Uploading vector chunk");

    await qdrant.upsert(COLLECTION, {
      wait: true,
      points: chunk,
    });
  }

  embeddingProgressTracker.delete(repoId);
  embeddingEvents.emit(`completed-${repoId}`);
  logger.info({ repoId, embedded: total }, "Vector embedding completed");

  return {
    success: true,
    embedded: total,
  };
}

