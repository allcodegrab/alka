import { KnowledgeGraph } from '../graph/graph.js';
import { buildGraph } from '../graph/builder.js';
import { BM25Index } from '../search/bm25.js';
import { indexProject } from '../search/indexer.js';
import { TfIdfVectorizer } from '../embeddings/tfidf.js';
import { cosineSimilarity } from '../embeddings/similarity.js';
import { applyDiversity } from './diversity.js';
import type { QueryParams, RetrievedContext, RetrievedChunk } from './types.js';
import type { GraphNode } from '../graph/types.js';

// Rough token estimate: ~4 chars per token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

let cachedGraph: KnowledgeGraph | null = null;
let cachedBm25: BM25Index | null = null;
let cachedTfidf: TfIdfVectorizer | null = null;
let cachedProjectRoot: string | null = null;

export async function ensureIndex(projectRoot: string): Promise<{
  graph: KnowledgeGraph;
  bm25: BM25Index;
  tfidf: TfIdfVectorizer;
}> {
  if (cachedProjectRoot === projectRoot && cachedGraph && cachedBm25 && cachedTfidf) {
    return { graph: cachedGraph, bm25: cachedBm25, tfidf: cachedTfidf };
  }

  const graph = await buildGraph(projectRoot);
  const bm25 = await indexProject(projectRoot, graph);

  // Build TF-IDF from the same documents
  const tfidf = new TfIdfVectorizer();
  for (const node of graph.getAllNodes()) {
    if (node.type === 'file') {
      const path = node.data['path'] as string | undefined;
      if (path) {
        tfidf.addDocument(node.id, `${path} ${JSON.stringify(node.data)}`);
      }
    } else {
      tfidf.addDocument(node.id, JSON.stringify(node.data));
    }
  }

  cachedGraph = graph;
  cachedBm25 = bm25;
  cachedTfidf = tfidf;
  cachedProjectRoot = projectRoot;

  return { graph, bm25, tfidf };
}

export function clearCache(): void {
  cachedGraph = null;
  cachedBm25 = null;
  cachedTfidf = null;
  cachedProjectRoot = null;
}

export async function query(params: QueryParams): Promise<RetrievedContext> {
  const { projectRoot, intent, symbols, k = 12, includeGraph = true } = params;
  const { graph, bm25, tfidf } = await ensureIndex(projectRoot);

  // Step 1: BM25 lexical search
  const searchQuery = symbols ? `${intent} ${symbols.join(' ')}` : intent;
  const bm25Results = bm25.search(searchQuery, 100);

  // Step 2: TF-IDF re-ranking
  const queryVector = tfidf.vectorize(searchQuery);
  const reranked = bm25Results
    .map((r) => {
      const docVector = tfidf.getVector(r.id);
      const tfidfScore = docVector ? cosineSimilarity(queryVector, docVector) : 0;
      // Combine BM25 score (normalized) and TF-IDF score
      const combinedScore = r.score * 0.6 + tfidfScore * 0.4;
      return { ...r, score: combinedScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  // Step 3: Build chunks
  const chunks: RetrievedChunk[] = reranked.map((r) => ({
    id: r.id,
    content: r.content ?? '',
    score: r.score,
    source: r.metadata?.['path'] ?? r.id,
  }));

  // Step 4: Diversity filter
  const diverseChunks = applyDiversity(chunks);

  // Step 5: Graph expansion
  const graphNodes: GraphNode[] = [];
  if (includeGraph) {
    const seenIds = new Set<string>();
    for (const chunk of diverseChunks.slice(0, 5)) {
      const node = graph.getNode(chunk.id);
      if (node && !seenIds.has(node.id)) {
        seenIds.add(node.id);
        graphNodes.push(node);
        // Add neighbors
        for (const neighbor of graph.getNeighbors(node.id)) {
          if (!seenIds.has(neighbor.id)) {
            seenIds.add(neighbor.id);
            graphNodes.push(neighbor);
          }
        }
      }
    }
  }

  // Step 6: Trim to token budget
  let totalTokens = 0;
  const maxTokens = 30_000;
  const trimmedChunks: RetrievedChunk[] = [];
  for (const chunk of diverseChunks) {
    const tokens = estimateTokens(chunk.content);
    if (totalTokens + tokens > maxTokens) break;
    totalTokens += tokens;
    trimmedChunks.push(chunk);
  }

  return { chunks: trimmedChunks.slice(0, k), graphNodes, totalTokens };
}
