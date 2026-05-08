import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { CodeEntity } from "../src/models/codeEntity.model.js";

const MONGO_URI = process.env.MONGO_URI!;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const COLLECTION = "repo_entities";

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

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GOOGLE_API_KEY,
    model: "models/gemini-embedding-001",
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

    const vector = await embeddings.embedQuery(text);

    points.push({
      id: i + 1,
      vector,
      payload: {
        pageContent: entity.content || entity.name,
        metadata: {
          mongoId: entity._id.toString(),
          fingerprint: repo.fingerprint,
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
