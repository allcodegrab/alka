import lunr from 'lunr';
import type { SearchResult } from './types.js';

interface StoredDocument {
  content: string;
  metadata?: Record<string, string>;
}

const DEFAULT_LIMIT = 50;

export class BM25Index {
  private documents = new Map<string, StoredDocument>();
  private index: lunr.Index | null = null;
  private dirty = false;

  addDocument(id: string, content: string, metadata?: Record<string, string>): void {
    this.documents.set(id, { content, metadata });
    this.dirty = true;
  }

  removeDocument(id: string): void {
    if (this.documents.delete(id)) {
      this.dirty = true;
    }
  }

  search(query: string, limit: number = DEFAULT_LIMIT): SearchResult[] {
    if (this.documents.size === 0 || !query.trim()) {
      return [];
    }

    if (this.dirty || !this.index) {
      this.rebuild();
    }

    let results: lunr.Index.Result[];
    try {
      results = this.index!.search(query);
    } catch {
      // lunr query parse error — fall back to individual term search
      const terms = query.trim().split(/\s+/);
      const termQuery = terms.map((t) => `${t}`).join(' ');
      try {
        results = this.index!.search(termQuery);
      } catch {
        return [];
      }
    }

    return results.slice(0, limit).map((result) => {
      const doc = this.documents.get(result.ref);
      return {
        id: result.ref,
        score: result.score,
        content: doc?.content,
        metadata: doc?.metadata,
      };
    });
  }

  get documentCount(): number {
    return this.documents.size;
  }

  private rebuild(): void {
    const docs = this.documents;

    this.index = lunr(function (this: lunr.Builder) {
      this.ref('id');
      this.field('content');

      for (const [id, doc] of docs) {
        this.add({ id, content: doc.content });
      }
    });

    this.dirty = false;
  }
}
