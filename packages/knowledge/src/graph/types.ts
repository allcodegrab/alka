export type NodeType = 'file' | 'symbol' | 'decision' | 'convention' | 'mission' | 'finding';
export type EdgeType =
  | 'contains'
  | 'defines'
  | 'references'
  | 'depends_on'
  | 'decided_by'
  | 'produced'
  | 'found_by';

export interface GraphNode {
  id: string;
  type: NodeType;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  data?: Record<string, unknown>;
}
