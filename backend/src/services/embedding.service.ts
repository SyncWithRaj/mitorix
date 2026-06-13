import { OllamaEmbeddings } from "@langchain/ollama";
import dotenv from "dotenv";
import logger from "../lib/logger.js";

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

/**
 * Nomic-embed-text has a 2048-token context window.
 * ~1 token ≈ 4 chars for code → safe limit is ~6000 chars.
 */
const MAX_EMBED_CHARS = 6000;

export const embeddingModel = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: OLLAMA_BASE_URL,
});

/**
 * Truncate text to fit within Nomic's 2048-token context window.
 * Tries to cut at a newline boundary to avoid splitting mid-line.
 */
export function truncateForEmbedding(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;

  const truncated = text.substring(0, MAX_EMBED_CHARS);
  const lastNewline = truncated.lastIndexOf("\n");

  // Cut at last newline if possible, otherwise hard cut
  return lastNewline > MAX_EMBED_CHARS * 0.5
    ? truncated.substring(0, lastNewline)
    : truncated;
}

export const embedText = async (text: string) => {
  const vector = await embeddingModel.embedQuery(truncateForEmbedding(text));
  return vector;
};

// ─── High-Performance Concurrent Embedding ──────────────────────────────────
// LangChain's embedDocuments() calls Ollama one-by-one sequentially.
// This bypasses LangChain and calls Ollama's /api/embed directly with
// a concurrent worker pool for 3-4x faster bulk embedding.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Embed a single text using Ollama's native /api/embed endpoint.
 * Faster than LangChain wrapper — no overhead, direct HTTP call.
 */
export async function embedDirect(text: string): Promise<number[]> {
  const truncated = truncateForEmbedding(text);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      input: truncated,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embed failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.embeddings[0];
}

/**
 * Embed multiple texts concurrently using a worker pool.
 * Bypasses LangChain's sequential embedDocuments() for ~3-4x speedup.
 *
 * @param texts     - Array of raw texts to embed (will be truncated internally)
 * @param concurrency - Number of parallel Ollama requests (default: 4)
 * @returns Array of embedding vectors in the same order as input texts
 */
export async function embedBatch(
  texts: string[],
  concurrency: number = 4
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  let nextIndex = 0;
  let errorOccurred: Error | null = null;

  async function worker() {
    while (nextIndex < texts.length && !errorOccurred) {
      const idx = nextIndex++;
      if (idx >= texts.length) break;

      try {
        results[idx] = await embedDirect(texts[idx]!);
      } catch (err: any) {
        errorOccurred = err;
        logger.error({ err, textIndex: idx }, "Concurrent embed worker failed");
        throw err;
      }
    }
  }

  // Launch concurrent workers — cap at actual text count
  const workerCount = Math.min(concurrency, texts.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  // Verify all results are populated
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) {
      throw new Error(`Embedding missing for text at index ${i}`);
    }
  }

  return results as number[][];
}
