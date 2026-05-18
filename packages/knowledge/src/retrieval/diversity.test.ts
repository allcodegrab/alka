import { describe, it, expect } from 'vitest';
import { applyDiversity } from './diversity.js';
import type { RetrievedChunk } from './types.js';

describe('applyDiversity', () => {
  it('keeps unique chunks', () => {
    const chunks: RetrievedChunk[] = [
      { id: 'a', content: 'typescript function class export', score: 1, source: 'a.ts' },
      { id: 'b', content: 'cooking recipe pasta tomato sauce', score: 0.8, source: 'b.md' },
    ];
    const result = applyDiversity(chunks);
    expect(result).toHaveLength(2);
  });

  it('removes near-duplicates', () => {
    const chunks: RetrievedChunk[] = [
      { id: 'a', content: 'the quick brown fox jumps over the lazy dog', score: 1, source: 'a' },
      {
        id: 'b',
        content: 'the quick brown fox jumps over the lazy cat',
        score: 0.9,
        source: 'b',
      },
      { id: 'c', content: 'something completely different here', score: 0.5, source: 'c' },
    ];
    const result = applyDiversity(chunks, 0.6);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('a');
    expect(result[1]!.id).toBe('c');
  });

  it('handles empty array', () => {
    expect(applyDiversity([])).toHaveLength(0);
  });

  it('handles single chunk', () => {
    const chunks: RetrievedChunk[] = [{ id: 'a', content: 'hello world', score: 1, source: 'a' }];
    expect(applyDiversity(chunks)).toHaveLength(1);
  });
});
