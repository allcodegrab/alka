import { describe, it, expect } from 'vitest';
import { chunkFileContent } from './chunker.js';

describe('chunkFileContent', () => {
  it('chunks a 500-line file into 3 chunks with overlap', () => {
    const lines = Array.from({ length: 500 }, (_, i) => `line ${i + 1}`);
    const content = lines.join('\n');

    const chunks = chunkFileContent('src/big.ts', content, 200, 20);

    expect(chunks.length).toBe(3);

    // First chunk: lines 1-200
    expect(chunks[0]!.startLine).toBe(1);
    expect(chunks[0]!.endLine).toBe(200);
    expect(chunks[0]!.filePath).toBe('src/big.ts');
    expect(chunks[0]!.id).toBe('src/big.ts:1-200');

    // Second chunk: lines 181-380 (starts at 200-20=180, so line 181)
    expect(chunks[1]!.startLine).toBe(181);
    expect(chunks[1]!.endLine).toBe(380);

    // Third chunk: lines 361-500
    expect(chunks[2]!.startLine).toBe(361);
    expect(chunks[2]!.endLine).toBe(500);
  });

  it('returns a single chunk for a file smaller than chunk size', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`);
    const content = lines.join('\n');

    const chunks = chunkFileContent('src/small.ts', content, 200, 20);

    expect(chunks.length).toBe(1);
    expect(chunks[0]!.startLine).toBe(1);
    expect(chunks[0]!.endLine).toBe(50);
    expect(chunks[0]!.content).toBe(content);
    expect(chunks[0]!.id).toBe('src/small.ts:1-50');
  });

  it('handles an empty file', () => {
    const chunks = chunkFileContent('src/empty.ts', '', 200, 20);

    expect(chunks.length).toBe(1);
    expect(chunks[0]!.startLine).toBe(1);
    expect(chunks[0]!.endLine).toBe(1);
    expect(chunks[0]!.content).toBe('');
  });

  it('produces correct overlap boundaries', () => {
    // 220 lines with chunk=100, overlap=10 → 3 chunks
    const lines = Array.from({ length: 220 }, (_, i) => `line ${i + 1}`);
    const content = lines.join('\n');

    const chunks = chunkFileContent('src/overlap.ts', content, 100, 10);

    expect(chunks.length).toBe(3);

    // Chunk 1: 1-100
    expect(chunks[0]!.startLine).toBe(1);
    expect(chunks[0]!.endLine).toBe(100);

    // Chunk 2: 91-190 (start = 100-10 = 90, line 91)
    expect(chunks[1]!.startLine).toBe(91);
    expect(chunks[1]!.endLine).toBe(190);

    // Chunk 3: 181-220
    expect(chunks[2]!.startLine).toBe(181);
    expect(chunks[2]!.endLine).toBe(220);

    // Verify overlap: chunk1 ends at 100, chunk2 starts at 91
    // So lines 91-100 appear in both chunks
    const chunk1Lines = chunks[0]!.content.split('\n');
    const chunk2Lines = chunks[1]!.content.split('\n');
    const overlapFromChunk1 = chunk1Lines.slice(-10);
    const overlapFromChunk2 = chunk2Lines.slice(0, 10);
    expect(overlapFromChunk1).toEqual(overlapFromChunk2);
  });
});
