export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

export function magnitude(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i]! * v[i]!;
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

export interface SimilarityResult {
  id: string;
  score: number;
}

export function findSimilar(
  query: number[],
  candidates: Array<{ id: string; embedding: number[] }>,
  limit: number = 20,
): SimilarityResult[] {
  const scored = candidates.map((c) => ({
    id: c.id,
    score: cosineSimilarity(query, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
