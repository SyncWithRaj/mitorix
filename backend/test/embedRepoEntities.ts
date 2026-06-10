import dotenv from "dotenv";
dotenv.config({ path: "../.env", quiet: true } as any);

import mongoose from "mongoose";
import { QdrantClient } from "@qdrant/js-client-rest";
import { OllamaEmbeddings } from "@langchain/ollama";
import { CodeEntity } from "../src/models/codeEntity.model.js";

const MONGO_URI = process.env.MONGO_URI!;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const COLLECTION = "repo_entities";

/**
 * Nomic-embed-text has a 2048-token context window.
 * ~1 token ≈ 4 chars for code → safe limit is ~6000 chars.
 */
const MAX_EMBED_CHARS = 6000;

function truncateForEmbedding(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;
  const truncated = text.substring(0, MAX_EMBED_CHARS);
  const lastNewline = truncated.lastIndexOf("\n");
  return lastNewline > MAX_EMBED_CHARS * 0.5
    ? truncated.substring(0, lastNewline)
    : truncated;
}

async function run() {
  const repoId = process.argv[2];

  if (!repoId) {
    console.error("❌ Please provide repositoryId");
    process.exit(1);
  }

  console.log("Connecting MongoDB...");
  await mongoose.connect(MONGO_URI);

  const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY!,
  });

  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: OLLAMA_BASE_URL,
  });

  console.log("Fetching entities...");

  const entities = await CodeEntity.find({
    repoId: new mongoose.Types.ObjectId(repoId),
  });

  console.log(`Found ${entities.length} entities`);

  if (!entities.length) {
    console.log("No entities found");
    process.exit(0);
  }

  const points: any[] = [];

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];

    console.log(`Embedding ${i + 1}/${entities.length}: ${entity.name}`);

    const text = `
Entity Type: ${entity.type}
Name: ${entity.name}
File: ${entity.filePath}

Code:
${entity.content || ""}
`;

    const vector = await embeddings.embedQuery(truncateForEmbedding(text));

    points.push({
      id: i + 1,
      vector,
      payload: {
        pageContent: entity.content || entity.name,
        metadata: {
          mongoId: entity._id.toString(),
          filePath: entity.filePath,
          startLine: entity.startLine,
          endLine: entity.endLine,
        },
      },
    });
    console.log("POINT ID:", i + 1);
  }

  console.log("Uploading vectors...");

  await qdrant.upsert(COLLECTION, {
    wait: true,
    points,
  });

  console.log("Embedding pipeline completed");

  process.exit(0);
}

run();
