import { describe, it, expect } from 'vitest';
import { cosineSimilarity, findSimilar } from './similarity.js';

describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
  });

  it('returns 0.0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it('returns -1.0 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
  });

  it('returns 0 when either vector is zero', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
  });
});

describe('findSimilar', () => {
  const candidates = [
    { id: 'a', embedding: [1, 0, 0] },
    { id: 'b', embedding: [0, 1, 0] },
    { id: 'c', embedding: [0.9, 0.1, 0] },
    { id: 'd', embedding: [0, 0, 1] },
  ];

  it('ranks most similar first', () => {
    const results = findSimilar([1, 0, 0], candidates);
    expect(results[0]!.id).toBe('a');
    expect(results[1]!.id).toBe('c');
  });

  it('respects the limit parameter', () => {
    const results = findSimilar([1, 0, 0], candidates, 2);
    expect(results).toHaveLength(2);
  });
});
