import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraph } from './graph.js';
import type { GraphNode, GraphEdge } from './types.js';

function makeNode(id: string, type: GraphNode['type'] = 'file'): GraphNode {
  return { id, type, data: {} };
}

function makeEdge(from: string, to: string, type: GraphEdge['type'] = 'contains'): GraphEdge {
  return { from, to, type };
}

describe('KnowledgeGraph', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  it('should add and retrieve a node', () => {
    const node = makeNode('a');
    graph.addNode(node);
    expect(graph.getNode('a')).toBe(node);
    expect(graph.hasNode('a')).toBe(true);
  });

  it('should return undefined for unknown node', () => {
    expect(graph.getNode('missing')).toBeUndefined();
    expect(graph.hasNode('missing')).toBe(false);
  });

  it('should remove a node', () => {
    graph.addNode(makeNode('a'));
    graph.removeNode('a');
    expect(graph.hasNode('a')).toBe(false);
    expect(graph.nodeCount).toBe(0);
  });

  it('should add and retrieve edges', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    const edge = makeEdge('a', 'b');
    graph.addEdge(edge);

    expect(graph.getEdges('a', 'out')).toEqual([edge]);
    expect(graph.getEdges('b', 'in')).toEqual([edge]);
    expect(graph.getEdges('a', 'in')).toEqual([]);
  });

  it('should return both in and out edges with direction=both', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    graph.addNode(makeNode('c'));
    graph.addEdge(makeEdge('a', 'b'));
    graph.addEdge(makeEdge('c', 'b'));

    const edges = graph.getEdges('b', 'both');
    expect(edges).toHaveLength(2);
  });

  it('should default to both direction for getEdges', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    graph.addEdge(makeEdge('a', 'b'));

    expect(graph.getEdges('b')).toHaveLength(1);
    expect(graph.getEdges('a')).toHaveLength(1);
  });

  it('should get neighbors following edges', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    graph.addNode(makeNode('c'));
    graph.addEdge(makeEdge('a', 'b'));
    graph.addEdge(makeEdge('a', 'c'));

    const neighbors = graph.getNeighbors('a', undefined, 'out');
    expect(neighbors).toHaveLength(2);
    expect(neighbors.map((n) => n.id).sort()).toEqual(['b', 'c']);
  });

  it('should filter neighbors by edge type', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    graph.addNode(makeNode('c'));
    graph.addEdge(makeEdge('a', 'b', 'contains'));
    graph.addEdge(makeEdge('a', 'c', 'references'));

    const neighbors = graph.getNeighbors('a', 'contains', 'out');
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0]!.id).toBe('b');
  });

  it('should query nodes by type', () => {
    graph.addNode(makeNode('f1', 'file'));
    graph.addNode(makeNode('f2', 'file'));
    graph.addNode(makeNode('d1', 'decision'));

    const files = graph.query({ type: 'file' });
    expect(files).toHaveLength(2);
  });

  it('should query nodes with custom filter', () => {
    graph.addNode({ id: 'a', type: 'file', data: { size: 100 } });
    graph.addNode({ id: 'b', type: 'file', data: { size: 5000 } });

    const large = graph.query({ filter: (n) => (n.data['size'] as number) > 1000 });
    expect(large).toHaveLength(1);
    expect(large[0]!.id).toBe('b');
  });

  it('should return all nodes when query has no params', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));

    const all = graph.query();
    expect(all).toHaveLength(2);
  });

  it('should cascade edge removal when removing a node', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    graph.addNode(makeNode('c'));
    graph.addEdge(makeEdge('a', 'b'));
    graph.addEdge(makeEdge('b', 'c'));
    graph.addEdge(makeEdge('c', 'a'));

    graph.removeNode('b');

    expect(graph.edgeCount).toBe(1);
    expect(graph.getEdges('a', 'out')).toHaveLength(0);
    expect(graph.getEdges('c', 'out')).toHaveLength(1);
  });

  it('should track nodeCount accurately', () => {
    expect(graph.nodeCount).toBe(0);
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    expect(graph.nodeCount).toBe(2);
    graph.removeNode('a');
    expect(graph.nodeCount).toBe(1);
  });

  it('should track edgeCount accurately', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    expect(graph.edgeCount).toBe(0);
    graph.addEdge(makeEdge('a', 'b'));
    expect(graph.edgeCount).toBe(1);
  });

  it('should clear all nodes and edges', () => {
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    graph.addEdge(makeEdge('a', 'b'));

    graph.clear();

    expect(graph.nodeCount).toBe(0);
    expect(graph.edgeCount).toBe(0);
    expect(graph.getAllNodes()).toEqual([]);
  });

  it('should return all nodes via getAllNodes', () => {
    graph.addNode(makeNode('x'));
    graph.addNode(makeNode('y'));

    const all = graph.getAllNodes();
    expect(all).toHaveLength(2);
    expect(all.map((n) => n.id).sort()).toEqual(['x', 'y']);
  });
});
