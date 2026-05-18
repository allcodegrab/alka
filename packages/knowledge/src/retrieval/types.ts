import type { GraphNode } from '../graph/types.js';

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  source: string;
}

export interface RetrievedContext {
  chunks: RetrievedChunk[];
  graphNodes: GraphNode[];
  totalTokens: number;
}

export interface QueryParams {
  projectRoot: string;
  intent: string;
  symbols?: string[];
  types?: string[];
  k?: number;
  includeGraph?: boolean;
}
