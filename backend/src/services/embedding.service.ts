import dotenv from "dotenv";
import logger from "../lib/logger.js";
import { genAI } from "./llm.service.js";

dotenv.config();

/**
 * Gemini embedding limit is 2048 tokens.
 * ~1 token ≈ 4 chars for code → safe limit is ~8000 chars.
 */
const MAX_EMBED_CHARS = 8000;

/**
 * Truncate text to fit within Nomic's 2048-token context window.
 * Tries to cut at a newline boundary to avoid splitting mid-line.
 */
function truncateForEmbedding(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;

  const truncated = text.substring(0, MAX_EMBED_CHARS);
  const lastNewline = truncated.lastIndexOf("\n");

  // Cut at last newline if possible, otherwise hard cut
  return lastNewline > MAX_EMBED_CHARS * 0.5
    ? truncated.substring(0, lastNewline)
    : truncated;
}

// ─── Gemini API Embedding ───────────────────────────────────────────────────
// Bypasses LangChain and calls Gemini API directly.
// Used by all embedding and search operations.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Embed a single text using Gemini's native embedContent endpoint.
 */
export async function embedDirect(text: string): Promise<number[]> {
  const truncated = truncateForEmbedding(text);

  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(truncated);

  return result.embedding.values;
}

/**
 * Embed multiple texts using a worker pool.
 *
 * @param texts       - Array of raw texts to embed (will be truncated internally)
 * @param concurrency - Number of parallel Ollama requests (default: 1 for laptop CPUs)
 * @returns Array of embedding vectors in the same order as input texts
 */
export async function embedBatch(
  texts: string[],
  concurrency: number = 1
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
