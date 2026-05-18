import { describe, it, expect } from 'vitest';
import { TfIdfVectorizer } from './tfidf.js';
import { cosineSimilarity } from './similarity.js';

describe('TfIdfVectorizer', () => {
  it('adds documents and tracks count', () => {
    const v = new TfIdfVectorizer();
    v.addDocument('a', 'hello world');
    v.addDocument('b', 'hello there');
    expect(v.documentCount).toBe(2);
  });

  it('produces vectors of consistent length', () => {
    const v = new TfIdfVectorizer();
    v.addDocument('a', 'the quick brown fox');
    v.addDocument('b', 'the lazy brown dog');
    const va = v.getVector('a');
    const vb = v.getVector('b');
    expect(va).toBeDefined();
    expect(vb).toBeDefined();
    expect(va!.length).toBe(vb!.length);
    expect(va!.length).toBeGreaterThan(0);
  });

  it('similar documents have higher cosine similarity', () => {
    const v = new TfIdfVectorizer();
    v.addDocument('a', 'typescript function export class interface');
    v.addDocument('b', 'typescript class extends implements export');
    v.addDocument('c', 'cooking recipe pasta tomato sauce garlic');

    const va = v.getVector('a')!;
    const vb = v.getVector('b')!;
    const vc = v.getVector('c')!;

    const simAB = cosineSimilarity(va, vb);
    const simAC = cosineSimilarity(va, vc);

    expect(simAB).toBeGreaterThan(simAC);
  });

  it('vectorize produces a vector for ad-hoc text', () => {
    const v = new TfIdfVectorizer();
    v.addDocument('a', 'hello world test');
    v.addDocument('b', 'foo bar baz');

    const query = v.vectorize('hello test');
    expect(query.length).toBeGreaterThan(0);
  });

  it('removeDocument updates count and vocabulary', () => {
    const v = new TfIdfVectorizer();
    v.addDocument('a', 'hello world');
    v.addDocument('b', 'goodbye world');
    expect(v.documentCount).toBe(2);

    v.removeDocument('a');
    expect(v.documentCount).toBe(1);
    expect(v.getVector('a')).toBeUndefined();
  });

  it('handles empty text gracefully', () => {
    const v = new TfIdfVectorizer();
    v.addDocument('a', '');
    expect(v.documentCount).toBe(1);
  });

  it('vocabulary grows with new terms', () => {
    const v = new TfIdfVectorizer();
    v.addDocument('a', 'alpha beta');
    const size1 = v.vocabularySize;
    v.addDocument('b', 'gamma delta');
    const size2 = v.vocabularySize;
    expect(size2).toBeGreaterThan(size1);
  });
});
