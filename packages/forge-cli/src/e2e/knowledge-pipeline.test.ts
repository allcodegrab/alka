import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildGraph,
  BM25Index,
  TfIdfVectorizer,
  cosineSimilarity,
  applyDiversity,
  query,
  clearCache,
} from '@forge/knowledge';
import type { RetrievedChunk } from '@forge/knowledge';

describe('knowledge pipeline (e2e)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'knowledge-e2e-'));
    clearCache();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    clearCache();
  });

  it('should build graph from temp directory with sample .ts files', async () => {
    const srcDir = join(tmpDir, 'src');
    await mkdir(srcDir, { recursive: true });

    await writeFile(
      join(srcDir, 'main.ts'),
      'export function main() { return "hello"; }\n',
      'utf-8',
    );
    await writeFile(
      join(srcDir, 'utils.ts'),
      'export function add(a: number, b: number) { return a + b; }\n',
      'utf-8',
    );

    const graph = await buildGraph(tmpDir);
    const fileNodes = graph.query({ type: 'file' });
    expect(fileNodes.length).toBeGreaterThanOrEqual(2);

    const paths = fileNodes.map((n) => n.data['path'] as string);
    expect(paths).toContain('src/main.ts');
    expect(paths).toContain('src/utils.ts');
  });

  it('should search with BM25Index and verify ranking', () => {
    const index = new BM25Index();
    index.addDocument('doc1', 'typescript function handler request response');
    index.addDocument('doc2', 'python flask api endpoint');
    index.addDocument('doc3', 'typescript async function handler middleware');

    const results = index.search('typescript handler');
    expect(results.length).toBeGreaterThan(0);

    // TypeScript docs should rank higher
    const topIds = results.slice(0, 2).map((r) => r.id);
    expect(topIds).toContain('doc1');
    expect(topIds).toContain('doc3');
  });

  it('should vectorize with TfIdf and verify cosine similarity ranking', () => {
    const tfidf = new TfIdfVectorizer();
    tfidf.addDocument('doc1', 'machine learning neural network deep learning');
    tfidf.addDocument('doc2', 'web development frontend backend api');
    tfidf.addDocument('doc3', 'deep learning neural network training model');

    const queryVec = tfidf.vectorize('neural network deep learning');
    const vec1 = tfidf.getVector('doc1')!;
    const vec2 = tfidf.getVector('doc2')!;
    const vec3 = tfidf.getVector('doc3')!;

    const sim1 = cosineSimilarity(queryVec, vec1);
    const sim2 = cosineSimilarity(queryVec, vec2);
    const sim3 = cosineSimilarity(queryVec, vec3);

    // ML docs should be more similar to query than web dev doc
    expect(sim1).toBeGreaterThan(sim2);
    expect(sim3).toBeGreaterThan(sim2);
  });

  it('should run full pipeline query on temp directory and return context object', async () => {
    const srcDir = join(tmpDir, 'src');
    await mkdir(srcDir, { recursive: true });

    await writeFile(
      join(srcDir, 'auth.ts'),
      'export function authenticate(token: string): boolean { return token.length > 0; }\nexport function authorize(role: string): boolean { return role === "admin"; }\n',
      'utf-8',
    );
    await writeFile(
      join(srcDir, 'database.ts'),
      'export function connect(url: string): void { console.log("connecting to", url); }\nexport function query(sql: string): void { console.log("query:", sql); }\n',
      'utf-8',
    );

    // Build graph first to verify file nodes are created
    const graph = await buildGraph(tmpDir);
    const fileNodes = graph.query({ type: 'file' });
    expect(fileNodes.length).toBeGreaterThanOrEqual(2);

    // Query pipeline: returns a valid RetrievedContext structure
    const result = await query({
      projectRoot: tmpDir,
      intent: 'authenticate token',
      k: 5,
    });

    // Pipeline should complete without error and return valid structure
    expect(result).toHaveProperty('chunks');
    expect(result).toHaveProperty('graphNodes');
    expect(result).toHaveProperty('totalTokens');
    expect(Array.isArray(result.chunks)).toBe(true);
    expect(Array.isArray(result.graphNodes)).toBe(true);
    expect(typeof result.totalTokens).toBe('number');
  });

  it('should apply diversity to remove near-duplicates', () => {
    const chunks: RetrievedChunk[] = [
      {
        id: 'a',
        content: 'the quick brown fox jumps over the lazy dog',
        score: 0.9,
        source: 'a.ts',
      },
      {
        id: 'b',
        content: 'the quick brown fox jumps over the lazy cat',
        score: 0.8,
        source: 'b.ts',
      },
      { id: 'c', content: 'python flask api server endpoint routing', score: 0.7, source: 'c.ts' },
    ];

    const diverse = applyDiversity(chunks, 0.7);
    // 'a' and 'b' are near-duplicates, 'c' is different
    expect(diverse.length).toBeLessThan(chunks.length);
    expect(diverse.map((c) => c.id)).toContain('a');
    expect(diverse.map((c) => c.id)).toContain('c');
  });
});
