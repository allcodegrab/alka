import type { RetrievedChunk } from './types.js';

/**
 * Remove near-duplicate chunks based on content overlap.
 * Uses Jaccard similarity of word sets as a fast proxy.
 */
export function applyDiversity(chunks: RetrievedChunk[], threshold = 0.7): RetrievedChunk[] {
  if (chunks.length <= 1) return chunks;

  const result: RetrievedChunk[] = [];
  const wordSets: Set<string>[] = [];

  for (const chunk of chunks) {
    const words = new Set(
      chunk.content
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

    let isDuplicate = false;
    for (const existing of wordSets) {
      const sim = jaccardSimilarity(words, existing);
      if (sim > threshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(chunk);
      wordSets.push(words);
    }
  }

  return result;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;

  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
