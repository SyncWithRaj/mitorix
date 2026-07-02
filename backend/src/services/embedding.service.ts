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
export async function embedDirect(text: string, attempt = 1): Promise<number[]> {
  try {
    const truncated = truncateForEmbedding(text);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(truncated);
    return result.embedding.values;
  } catch (err: any) {
    if (attempt <= 3 && (err.status === 429 || (err.message && err.message.includes("429 Too Many Requests")))) {
      let delayMs = 60000;
      const match = err.message.match(/retry in (\d+(?:\.\d+)?)s/);
      if (match) {
        delayMs = parseFloat(match[1]) * 1000 + 1000; // Add 1s buffer
      }
      logger.warn(`429 Too Many Requests. Retrying in ${delayMs}ms... (Attempt ${attempt}/3)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return embedDirect(text, attempt + 1);
    }
    throw err;
  }
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
  const BATCH_SIZE = 100; // Gemini max batch size
  
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);
    const indices = Array.from({ length: chunk.length }, (_, idx) => i + idx);
    
    const requests = chunk.map(text => ({
      content: { role: "user", parts: [{ text: truncateForEmbedding(text) }] }
    }));
    
    let attempt = 1;
    const maxAttempts = 5;
    
    while (attempt <= maxAttempts) {
      try {
        const response = await model.batchEmbedContents({ requests });
        
        response.embeddings.forEach((emb, idx) => {
          results[indices[idx]] = emb.values;
        });
        
        break; // Success, break the retry loop
      } catch (err: any) {
        if (attempt < maxAttempts && (err.status === 429 || (err.message && err.message.includes("429 Too Many Requests")))) {
          let delayMs = 60000;
          const match = err.message.match(/retry in (\d+(?:\.\d+)?)s/);
          if (match) {
            delayMs = parseFloat(match[1]) * 1000 + 1000;
          }
          logger.warn(`429 Too Many Requests in batch ${Math.floor(i/BATCH_SIZE) + 1}. Retrying in ${delayMs}ms... (Attempt ${attempt}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempt++;
        } else {
           logger.error({ err, batchIndex: Math.floor(i/BATCH_SIZE) }, "Batch embedding failed");
           throw err;
        }
      }
    }
  }

  // Verify all results are populated
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) {
      throw new Error(`Embedding missing for text at index ${i}`);
    }
  }

  return results as number[][];
}
