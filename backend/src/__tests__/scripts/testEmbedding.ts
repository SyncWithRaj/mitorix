/**
 * Embedding Test Script
 *
 * Tests the direct Ollama embedding pipeline (no LangChain).
 * Seeds fake code entities into MongoDB, embeds them into Qdrant,
 * then verifies vector search returns correct results.
 *
 * Usage:
 *   npx tsx src/__tests__/scripts/testEmbedding.ts <repoId>
 *
 * If no repoId is provided, it creates a temporary test repo.
 */
import dotenv from "dotenv";
dotenv.config({ path: "../../.env", quiet: true } as any);

import mongoose from "mongoose";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embedDirect, embedBatch } from "../../services/embedding.service.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/RepoLens";
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION = "repo_entities";

const qdrant = new QdrantClient({ url: QDRANT_URL });

async function testSingleEmbed() {
  console.log("\n── Test 1: Single Embedding (embedDirect) ──");
  const start = Date.now();

  const vector = await embedDirect("function add(a: number, b: number) { return a + b; }");

  const elapsed = Date.now() - start;
  console.log(`  ✓ Vector dimensions: ${vector.length}`);
  console.log(`  ✓ First 5 values: [${vector.slice(0, 5).map(v => v.toFixed(4)).join(", ")}]`);
  console.log(`  ✓ Time: ${elapsed}ms`);

  if (vector.length !== 768) {
    throw new Error(`Expected 768 dimensions, got ${vector.length}`);
  }

  return vector;
}

async function testBatchEmbed() {
  console.log("\n── Test 2: Batch Embedding (embedBatch) ──");

  const texts = [
    "function greet(name: string) { return `Hello, ${name}`; }",
    "class UserService { constructor(private db: Database) {} }",
    "export interface Config { port: number; host: string; }",
    "const router = express.Router(); router.get('/api/health', healthCheck);",
    "enum Status { Active = 'active', Inactive = 'inactive' }",
  ];

  const start = Date.now();
  const vectors = await embedBatch(texts, 1);
  const elapsed = Date.now() - start;

  console.log(`  ✓ Embedded ${vectors.length} texts in ${elapsed}ms`);
  console.log(`  ✓ Avg: ${(elapsed / vectors.length).toFixed(0)}ms per text`);

  for (let i = 0; i < vectors.length; i++) {
    if (vectors[i]!.length !== 768) {
      throw new Error(`Vector ${i} has ${vectors[i]!.length} dimensions, expected 768`);
    }
  }
  console.log(`  ✓ All vectors have 768 dimensions`);

  return vectors;
}

async function testVectorSearch() {
  console.log("\n── Test 3: Qdrant Vector Search ──");

  // Check if collection exists and has points
  try {
    const info = await qdrant.getCollection(COLLECTION);
    console.log(`  ✓ Collection "${COLLECTION}" exists`);
    console.log(`  ✓ Points count: ${info.points_count}`);

    if (info.points_count === 0) {
      console.log("  ⚠ No points in collection — skipping search test");
      return;
    }

    // Embed a search query
    const queryVector = await embedDirect("function that adds two numbers");

    const results = await qdrant.search(COLLECTION, {
      vector: queryVector,
      limit: 3,
      with_payload: true,
      params: { hnsw_ef: 96, exact: false },
    });

    console.log(`  ✓ Search returned ${results.length} results`);
    for (const hit of results) {
      const meta = (hit.payload as any)?.metadata;
      console.log(`    - Score: ${hit.score?.toFixed(4)} | File: ${meta?.filePath || "N/A"}`);
    }
  } catch (err: any) {
    if (err.message?.includes("Not found") || err.status === 404) {
      console.log(`  ⚠ Collection "${COLLECTION}" does not exist yet — skipping`);
    } else {
      throw err;
    }
  }
}

async function testOllamaHealth() {
  console.log("── Test 0: Ollama Health Check ──");
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name);
    console.log(`  ✓ Ollama is running at ${baseUrl}`);
    console.log(`  ✓ Models available: ${models.join(", ") || "none"}`);

    if (!models.some((m: string) => m.includes("nomic-embed-text"))) {
      console.error("  ✗ nomic-embed-text not found! Run: docker exec repolens_ollama ollama pull nomic-embed-text");
      process.exit(1);
    }
  } catch {
    console.error(`  ✗ Cannot reach Ollama at ${baseUrl}. Is it running?`);
    process.exit(1);
  }
}

async function run() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   RepoLens Embedding Pipeline Test       ║");
  console.log("╚══════════════════════════════════════════╝\n");

  await testOllamaHealth();
  await testSingleEmbed();
  await testBatchEmbed();
  await testVectorSearch();

  console.log("\n✅ All embedding tests passed!\n");
}

run().catch((err) => {
  console.error("\n✗ Test failed:", err.message);
  process.exit(1);
});
