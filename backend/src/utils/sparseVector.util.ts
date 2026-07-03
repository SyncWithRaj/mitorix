/**
 * Converts text into a sparse vector using the Hashing Trick.
 * This allows us to use Qdrant's BM25 sparse vectors without needing a global vocabulary database.
 */
export function generateSparseVector(text: string, vocabSize = 100000): { indices: number[], values: number[] } {
  // Extract alphanumeric tokens
  const tokens = text.toLowerCase().match(/\w+/g) || [];
  const freq = new Map<number, number>();
  
  for (const token of tokens) {
    let hash = 0;
    // Simple fast string hash (DJB2-like)
    for (let i = 0; i < token.length; i++) {
      hash = Math.imul(31, hash) + token.charCodeAt(i) | 0;
    }
    const index = Math.abs(hash) % vocabSize;
    freq.set(index, (freq.get(index) || 0) + 1);
  }
  
  const indices = Array.from(freq.keys()).sort((a, b) => a - b);
  const values = indices.map(i => freq.get(i)!);
  
  return { indices, values };
}
