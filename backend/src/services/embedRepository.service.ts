import { embedBatch } from "./embedding.service.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import mongoose from "mongoose";
import { CodeEntity } from "../models/codeEntity.model.js";
import { v4 as uuidv4 } from "uuid";
import { Repository } from "../models/repo.model.js";
import { FileContent } from "../models/fileContent.model.js";
import { VectorInitService } from "./vectorInit.service.js";
import logger from "../lib/logger.js";

const COLLECTION = "repo_entities";

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

import { EventEmitter } from "events";

export const embeddingProgressTracker = new Map<string, { current: number, total: number }>();
export const embeddingEvents = new EventEmitter();

// ── Performance-tuned constants ─────────────────────────────────────────────
// EMBED_BATCH_SIZE:  Number of entities per embedding batch.
//                    Increased from 20 → 50 since we now use concurrent workers.
// EMBED_CONCURRENCY: Number of parallel Ollama requests within each batch.
//                    Matches OLLAMA_NUM_PARALLEL=4 in docker-compose.
// QDRANT_UPLOAD_BATCH: Points per Qdrant upsert call.
// ─────────────────────────────────────────────────────────────────────────────
const EMBED_BATCH_SIZE = 50;
const EMBED_CONCURRENCY = 1;
const QDRANT_UPLOAD_BATCH = 200;

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

  logger.info({ repoId }, "Starting vector embedding (optimized pipeline)");

  const entities = await CodeEntity.find({
    repoId: new mongoose.Types.ObjectId(repoId),
  });

  const total = entities.length;

  logger.info({ repoId, entityCount: total, batchSize: EMBED_BATCH_SIZE, concurrency: EMBED_CONCURRENCY }, "Code entities loaded for embedding");

  if (!total) {
    throw new Error("No entities found for this repository");
  }

  embeddingProgressTracker.set(repoId, { current: 0, total });
  embeddingEvents.emit(`progress-${repoId}`, 0, total);

  // ── Pipelined: Embed batch → Upload to Qdrant immediately ──
  // Instead of embed-all-then-upload-all, we upload each batch as soon as
  // it's embedded. This keeps Qdrant busy during embedding and reduces
  // peak memory usage (no need to hold all vectors in RAM).
  let processedCount = 0;
  let pendingUpload: Promise<void> | null = null;
  const startTime = Date.now();

  // Cache to prevent duplicate MongoDB lookups
  const fileContentCache = new Map<string, string>();
  const repoObjectId = new mongoose.Types.ObjectId(repoId);

  for (let batchStart = 0; batchStart < total; batchStart += EMBED_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + EMBED_BATCH_SIZE, total);
    const batch = entities.slice(batchStart, batchEnd);
    const isLastBatch = batchEnd >= total;

    logger.debug({ repoId, progress: `${batchStart}/${total}`, batchSize: batch.length }, "Embedding batch");

    // Pre-fetch all necessary file contents for this batch
    const filePaths = [...new Set(batch.map(e => e.filePath))];
    const missingPaths = filePaths.filter(fp => !fileContentCache.has(fp));
    
    if (missingPaths.length > 0) {
      const files = await FileContent.find({
        repoId: repoObjectId,
        relativePath: { $in: missingPaths }
      });
      for (const file of files) {
        fileContentCache.set(file.relativePath, file.content || "");
      }
    }

    // Prepare all texts for this batch
    const texts = batch.map((entity) => {
      const fullFileContent = fileContentCache.get(entity.filePath) || "";
      const lines = fullFileContent.split("\n");
      const entityContent = lines.slice(entity.startLine - 1, entity.endLine).join("\n");

      const text = `
Entity Type: ${entity?.type}
Name: ${entity?.name}
File: ${entity?.filePath}

Code:
${entityContent}
`;
      return text; // truncation happens inside embedBatch → embedDirect
    });

    // Embed entire batch with concurrent workers (3-4x faster than sequential)
    const vectors = await embedBatch(texts, EMBED_CONCURRENCY);

    // Build Qdrant points from the batch
    const batchPoints: any[] = [];
    for (let j = 0; j < batch.length; j++) {
      const entity = batch[j]!;
      const language = entity.language || "unknown";

      batchPoints.push({
        id: uuidv4(),
        vector: vectors[j],
        payload: {
          metadata: {
            mongoId: entity._id.toString(),
            repoId: repoId.toString(),
            fingerprint: repo.fingerprint,
            filePath: entity.filePath,
            language: language,
            startLine: entity.startLine,
            endLine: entity.endLine,
            entityType: entity.type,
            symbolName: entity.name,
          },
        },
      });
    }

    // Wait for any previous upload to finish before starting a new one
    if (pendingUpload) {
      await pendingUpload;
    }

    // Upload this batch to Qdrant immediately (pipelined with next embed batch)
    // wait: true only on last batch to ensure all data is indexed before returning
    const uploadBatch = async () => {
      for (let i = 0; i < batchPoints.length; i += QDRANT_UPLOAD_BATCH) {
        const chunk = batchPoints.slice(i, i + QDRANT_UPLOAD_BATCH);
        await qdrant.upsert(COLLECTION, {
          wait: isLastBatch && (i + QDRANT_UPLOAD_BATCH >= batchPoints.length),
          points: chunk,
        });
      }
    };

    if (isLastBatch) {
      // Last batch — wait for upload to complete
      await uploadBatch();
    } else {
      // Pipeline: start upload in background while next batch embeds
      pendingUpload = uploadBatch();
    }

    processedCount += batch.length;
    embeddingProgressTracker.set(repoId, { current: processedCount, total });
    embeddingEvents.emit(`progress-${repoId}`, processedCount, total);
    if (onProgress) {
      onProgress(processedCount, total);
    }
  }

  // Ensure any final pending upload completes
  if (pendingUpload) {
    await pendingUpload;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  embeddingProgressTracker.delete(repoId);
  embeddingEvents.emit(`completed-${repoId}`);
  logger.info({ repoId, embedded: total, elapsedSeconds: elapsed }, "Vector embedding completed");

  return {
    success: true,
    embedded: total,
  };
}
