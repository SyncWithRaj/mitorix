/**
 * Content Compression Utility
 *
 * Compresses raw text file content using gzip before storing in MongoDB,
 * and decompresses on read. Provides ~65-75% storage savings for source code.
 *
 * Backward compatible: old uncompressed documents (contentEncoding === 'plain'
 * or missing) are returned as-is.
 */

import zlib from "zlib";

/**
 * Compress raw text content using gzip, returning a base64-encoded string.
 * Returns the original content if compression would make it larger (very small files).
 */
export function compressContent(raw: string): {
  content: string;
  contentEncoding: "gzip" | "plain";
} {
  // Don't compress very small files — overhead of base64 + gzip header
  // makes it larger for files under ~200 bytes
  if (raw.length < 200) {
    return { content: raw, contentEncoding: "plain" };
  }

  const compressed = zlib.gzipSync(Buffer.from(raw, "utf-8"), {
    level: zlib.constants.Z_BEST_SPEED, // Level 1: fastest, still ~60% compression
  });

  const base64 = compressed.toString("base64");

  // Only use compressed version if it's actually smaller
  if (base64.length < raw.length) {
    return { content: base64, contentEncoding: "gzip" };
  }

  return { content: raw, contentEncoding: "plain" };
}

/**
 * Decompress stored content back to the original UTF-8 string.
 * Handles both gzip-compressed and plain (uncompressed) content transparently.
 */
export function decompressContent(
  stored: string | null,
  encoding?: string | null
): string {
  if (!stored) return "";

  if (encoding === "gzip") {
    try {
      const buf = Buffer.from(stored, "base64");
      return zlib.gunzipSync(buf).toString("utf-8");
    } catch {
      // If decompression fails, return as-is (data may have been stored incorrectly)
      return stored;
    }
  }

  // 'plain' or missing encoding — return as-is (backward compatible)
  return stored;
}
