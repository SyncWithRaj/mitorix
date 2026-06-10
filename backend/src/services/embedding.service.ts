import { OllamaEmbeddings } from "@langchain/ollama";
import dotenv from "dotenv";

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
