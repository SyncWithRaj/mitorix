import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import mongoose from "mongoose";
import { CodeEntity } from "../models/codeEntity.model.js";
import { v4 as uuidv4 } from "uuid";
import { Repository } from "../models/repo.model.js";
import { VectorInitService } from "./vectorInit.service.js";

const COLLECTION = "repo_entities";

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "models/gemini-embedding-001",
});

export async function embedRepository(repoId: string) {
  // Ensure the Qdrant collection and indexes exist before interacting
  const vectorInit = new VectorInitService();
  await vectorInit.initVectorCollection();

  const repo = await Repository.findById(repoId);

  if (!repo || !repo.fingerprint) {
    throw new Error("Repo or fingerprint missing");
  }

  console.log(`\nChecking embeddings for repo: ${repoId}`);

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
    console.log("Embeddings already exist for this repository. Skipping...\n");

    return {
      success: true,
      message: "Embeddings already exist",
      embedded: 0,
    };
  }

  console.log(`Starting embedding for repo: ${repoId}`);

  const entities = await CodeEntity.find({
    repoId: new mongoose.Types.ObjectId(repoId),
  });

  const total = entities.length;

  console.log(`Found ${total} entities`);

  if (!total) {
    throw new Error("No entities found for this repository");
  }

  const points: any[] = [];

  for (let i = 0; i < total; i++) {
    const entity = entities[i];

    console.log(`Embedding ${i + 1}/${total}: ${entity.name}`);

    const text = `
Entity Type: ${entity?.type}
Name: ${entity?.name}
File: ${entity?.filePath}

Code:
${entity?.content || ""}
`;

    const vector = await embeddings.embedQuery(text);

    const language = entity.language || "unknown";

    points.push({
      id: uuidv4(), // UUID required by Qdrant
      vector,
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

  console.log(`Uploading ${points.length} vectors to Qdrant in chunks...`);

  const CHUNK_SIZE = 200;
  for (let i = 0; i < points.length; i += CHUNK_SIZE) {
    const chunk = points.slice(i, i + CHUNK_SIZE);
    console.log(
      `Pushing chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(points.length / CHUNK_SIZE)}`
    );

    await qdrant.upsert(COLLECTION, {
      wait: true,
      points: chunk,
    });
  }

  console.log(`Embedding completed: ${total}/${total} stored in Qdrant\n`);

  return {
    success: true,
    embedded: total,
  };
}
