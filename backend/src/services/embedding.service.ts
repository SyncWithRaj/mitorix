import dotenv from "dotenv";
import logger from "../lib/logger.js";
import axios from "axios";

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

// ─── Cohere AI Embedding ──────────────────────────────────────────────────────
// Bypasses LangChain and calls Cohere AI directly.
// Used by all embedding and search operations.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Embed a single text using Cohere AI's native embed endpoint.
 */
export async function embedDirect(text: string, attempt = 1): Promise<number[]> {
  try {
    const truncated = truncateForEmbedding(text);
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) throw new Error("COHERE_API_KEY is not defined in .env");

    const response = await axios.post(
      "https://api.cohere.ai/v1/embed",
      {
        model: "embed-english-v3.0",
        texts: [truncated],
        input_type: "search_query" // query type for searching
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    return response.data.embeddings[0];
  } catch (err: any) {
    if (attempt <= 3 && err.response && err.response.status === 429) {
      logger.warn(`429 Too Many Requests. Waiting 5s before retrying... (Attempt ${attempt}/3)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return embedDirect(text, attempt + 1);
    }
    throw err;
  }
}

/**
 * Embed multiple texts using Cohere AI batch API.
 */
export async function embedBatch(
  texts: string[],
  concurrency: number = 1
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const BATCH_SIZE = 90; // Safe batch size for Cohere (limit is 96)
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error("COHERE_API_KEY is not defined in .env");

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    if (i > 0) {
      logger.info(`Throttling: Waiting 5 seconds before batch ${Math.floor(i/BATCH_SIZE) + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const chunk = texts.slice(i, i + BATCH_SIZE);
    const indices = Array.from({ length: chunk.length }, (_, idx) => i + idx);
    const requests = chunk.map(text => truncateForEmbedding(text));
    
    let attempt = 1;
    const maxAttempts = 5;
    
    while (attempt <= maxAttempts) {
      try {
        const response = await axios.post(
          "https://api.cohere.ai/v1/embed",
          {
            model: "embed-english-v3.0",
            texts: requests,
            input_type: "search_document" // document type for storing in db
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          }
        );
        
        response.data.embeddings.forEach((emb: any, idx: number) => {
          results[indices[idx]] = emb;
        });
        
        break; // Success, break the retry loop
      } catch (err: any) {
        if (attempt < maxAttempts && err.response && err.response.status === 429) {
          logger.warn(`429 Too Many Requests in batch ${Math.floor(i/BATCH_SIZE) + 1}. Waiting 15s before retrying... (Attempt ${attempt}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          attempt++;
        } else {
           logger.error({ err: err.response?.data || err.message, batchIndex: Math.floor(i/BATCH_SIZE) }, "Batch embedding failed");
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
