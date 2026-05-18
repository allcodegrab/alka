import { describe, it, expect } from 'vitest';
import { BM25Index } from './bm25.js';

describe('BM25Index', () => {
  it('addDocument and search returns matching results', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'typescript compiler optimization');
    index.addDocument('doc2', 'javascript runtime performance');
    index.addDocument('doc3', 'rust memory safety');

    const results = index.search('typescript');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.id).toBe('doc1');
    expect(results[0]!.score).toBeGreaterThan(0);
  });

  it('ranks relevant documents higher', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'the quick brown fox jumps over the lazy dog');
    index.addDocument('doc2', 'fox fox fox fox fox');
    index.addDocument('doc3', 'completely unrelated content about databases');

    const results = index.search('fox');
    expect(results.length).toBeGreaterThanOrEqual(2);

    // doc2 has higher term frequency so should score higher
    const doc2Result = results.find((r) => r.id === 'doc2');
    const doc1Result = results.find((r) => r.id === 'doc1');
    expect(doc2Result).toBeDefined();
    expect(doc1Result).toBeDefined();
    expect(doc2Result!.score).toBeGreaterThanOrEqual(doc1Result!.score);
  });

  it('removeDocument excludes document from results', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'typescript language features');
    index.addDocument('doc2', 'typescript compiler');

    index.removeDocument('doc1');

    const results = index.search('typescript');
    expect(results.length).toBe(1);
    expect(results[0]!.id).toBe('doc2');
  });

  it('search with no results returns empty array', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'typescript compiler');

    const results = index.search('zzzznonexistent');
    expect(results).toEqual([]);
  });

  it('rebuilds index after modifications', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'initial content about search');

    // First search triggers build
    let results = index.search('search');
    expect(results.length).toBe(1);

    // Add another document — triggers rebuild on next search
    index.addDocument('doc2', 'more search content here');
    results = index.search('search');
    expect(results.length).toBe(2);
  });

  it('limit parameter caps results', () => {
    const index = new BM25Index();
    for (let i = 0; i < 10; i++) {
      index.addDocument(`doc${i}`, `search term document number ${i}`);
    }

    const results = index.search('search', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('handles special characters in query gracefully', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'function hello() { return 42; }');

    // Special characters that might break lunr query parser
    const results = index.search('hello()');
    // Should not throw; may or may not find results depending on lunr tokenizer
    expect(Array.isArray(results)).toBe(true);
  });

  it('search on empty index returns empty array', () => {
    const index = new BM25Index();
    const results = index.search('anything');
    expect(results).toEqual([]);
  });

  it('documentCount reflects stored documents', () => {
    const index = new BM25Index();
    expect(index.documentCount).toBe(0);

    index.addDocument('doc1', 'content');
    expect(index.documentCount).toBe(1);

    index.addDocument('doc2', 'more content');
    expect(index.documentCount).toBe(2);

    index.removeDocument('doc1');
    expect(index.documentCount).toBe(1);
  });

  it('returns content and metadata in results', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'typescript code', { path: 'src/app.ts', type: 'file' });

    const results = index.search('typescript');
    expect(results.length).toBe(1);
    expect(results[0]!.content).toBe('typescript code');
    expect(results[0]!.metadata).toEqual({ path: 'src/app.ts', type: 'file' });
  });
});
