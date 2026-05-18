export interface SearchResult {
  id: string;
  score: number;
  content?: string;
  metadata?: Record<string, string>;
}
