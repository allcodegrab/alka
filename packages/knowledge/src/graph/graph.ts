import type { GraphNode, GraphEdge, NodeType, EdgeType } from './types.js';

export class KnowledgeGraph {
  private nodes = new Map<string, GraphNode>();
  private outEdges = new Map<string, GraphEdge[]>();
  private inEdges = new Map<string, GraphEdge[]>();

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.outEdges.has(node.id)) {
      this.outEdges.set(node.id, []);
    }
    if (!this.inEdges.has(node.id)) {
      this.inEdges.set(node.id, []);
    }
  }

  removeNode(id: string): void {
    this.nodes.delete(id);

    // Remove all outgoing edges
    const out = this.outEdges.get(id) ?? [];
    for (const edge of out) {
      const targetIn = this.inEdges.get(edge.to);
      if (targetIn) {
        this.inEdges.set(
          edge.to,
          targetIn.filter((e) => e.from !== id),
        );
      }
    }
    this.outEdges.delete(id);

    // Remove all incoming edges
    const inc = this.inEdges.get(id) ?? [];
    for (const edge of inc) {
      const sourceOut = this.outEdges.get(edge.from);
      if (sourceOut) {
        this.outEdges.set(
          edge.from,
          sourceOut.filter((e) => e.to !== id),
        );
      }
    }
    this.inEdges.delete(id);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  addEdge(edge: GraphEdge): void {
    const out = this.outEdges.get(edge.from);
    if (out) {
      out.push(edge);
    } else {
      this.outEdges.set(edge.from, [edge]);
    }

    const inc = this.inEdges.get(edge.to);
    if (inc) {
      inc.push(edge);
    } else {
      this.inEdges.set(edge.to, [edge]);
    }
  }

  getEdges(nodeId: string, direction: 'in' | 'out' | 'both' = 'both'): GraphEdge[] {
    if (direction === 'out') {
      return this.outEdges.get(nodeId) ?? [];
    }
    if (direction === 'in') {
      return this.inEdges.get(nodeId) ?? [];
    }
    const out = this.outEdges.get(nodeId) ?? [];
    const inc = this.inEdges.get(nodeId) ?? [];
    return [...out, ...inc];
  }

  getNeighbors(
    nodeId: string,
    edgeType?: EdgeType,
    direction: 'in' | 'out' | 'both' = 'both',
  ): GraphNode[] {
    const edges = this.getEdges(nodeId, direction);
    const neighborIds = new Set<string>();

    for (const edge of edges) {
      if (edgeType && edge.type !== edgeType) continue;
      const neighborId = edge.from === nodeId ? edge.to : edge.from;
      neighborIds.add(neighborId);
    }

    const result: GraphNode[] = [];
    for (const nid of neighborIds) {
      const node = this.nodes.get(nid);
      if (node) {
        result.push(node);
      }
    }
    return result;
  }

  query(params?: { type?: NodeType; filter?: (n: GraphNode) => boolean }): GraphNode[] {
    const results: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (params?.type && node.type !== params.type) continue;
      if (params?.filter && !params.filter(node)) continue;
      results.push(node);
    }
    return results;
  }

  getAllNodes(): GraphNode[] {
    return [...this.nodes.values()];
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    let count = 0;
    for (const edges of this.outEdges.values()) {
      count += edges.length;
    }
    return count;
  }

  clear(): void {
    this.nodes.clear();
    this.outEdges.clear();
    this.inEdges.clear();
  }
}
