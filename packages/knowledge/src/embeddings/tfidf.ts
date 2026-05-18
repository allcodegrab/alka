/**
 * TF-IDF vectorizer — pure TypeScript, in-memory, zero external deps.
 * Produces sparse vectors for similarity comparison. Not as good as neural
 * embeddings but free, instant, and sufficient for hybrid retrieval where
 * BM25 handles lexical matching and TF-IDF handles re-ranking.
 */

export class TfIdfVectorizer {
  private documents = new Map<string, Map<string, number>>();
  private df = new Map<string, number>();
  private vocabulary = new Set<string>();
  private totalDocs = 0;
  private dirty = true;
  private idfCache = new Map<string, number>();

  addDocument(id: string, text: string): void {
    const terms = tokenize(text);
    const tf = computeTf(terms);
    this.documents.set(id, tf);
    for (const term of tf.keys()) {
      this.vocabulary.add(term);
      this.df.set(term, (this.df.get(term) ?? 0) + 1);
    }
    this.totalDocs++;
    this.dirty = true;
  }

  removeDocument(id: string): void {
    const tf = this.documents.get(id);
    if (!tf) return;

    for (const term of tf.keys()) {
      const count = this.df.get(term) ?? 1;
      if (count <= 1) {
        this.df.delete(term);
        this.vocabulary.delete(term);
      } else {
        this.df.set(term, count - 1);
      }
    }
    this.documents.delete(id);
    this.totalDocs--;
    this.dirty = true;
  }

  getVector(id: string): number[] | undefined {
    const tf = this.documents.get(id);
    if (!tf) return undefined;
    this.ensureIdf();
    return this.buildVector(tf);
  }

  vectorize(text: string): number[] {
    const terms = tokenize(text);
    const tf = computeTf(terms);
    this.ensureIdf();
    return this.buildVector(tf);
  }

  get documentCount(): number {
    return this.totalDocs;
  }

  get vocabularySize(): number {
    return this.vocabulary.size;
  }

  private ensureIdf(): void {
    if (!this.dirty) return;
    this.idfCache.clear();
    for (const [term, docFreq] of this.df) {
      this.idfCache.set(term, Math.log(1 + this.totalDocs / (1 + docFreq)));
    }
    this.dirty = false;
  }

  private buildVector(tf: Map<string, number>): number[] {
    const vocabArray = [...this.vocabulary];
    const vector = new Array<number>(vocabArray.length).fill(0);
    for (let i = 0; i < vocabArray.length; i++) {
      const term = vocabArray[i]!;
      const termFreq = tf.get(term) ?? 0;
      const idf = this.idfCache.get(term) ?? 0;
      vector[i] = termFreq * idf;
    }
    return vector;
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && t.length < 50);
}

function computeTf(terms: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const term of terms) {
    tf.set(term, (tf.get(term) ?? 0) + 1);
  }
  // Normalize by max frequency
  const maxFreq = Math.max(...tf.values(), 1);
  for (const [term, count] of tf) {
    tf.set(term, count / maxFreq);
  }
  return tf;
}
