import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type { KnowledgeGraph } from '../graph/graph.js';
import { BM25Index } from './bm25.js';
import { chunkFileContent } from './chunker.js';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.rb': 'ruby',
  '.cpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.html': 'html',
  '.css': 'css',
};

function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] ?? 'unknown';
}

export async function indexProject(projectRoot: string, graph: KnowledgeGraph): Promise<BM25Index> {
  const index = new BM25Index();

  // Index File nodes
  const fileNodes = graph.query({ type: 'file' });
  const readPromises = fileNodes.map(async (node) => {
    const filePath = node.id;
    const fullPath = filePath.startsWith('/') ? filePath : `${projectRoot}/${filePath}`;

    try {
      const content = await readFile(fullPath, 'utf-8');
      const language = detectLanguage(filePath);
      const chunks = chunkFileContent(filePath, content);

      for (const chunk of chunks) {
        index.addDocument(chunk.id, chunk.content, {
          path: filePath,
          type: 'file',
          language,
        });
      }
    } catch {
      // Skip files that cannot be read (deleted, permission issues, etc.)
    }
  });

  await Promise.all(readPromises);

  // Index Decision nodes
  const decisionNodes = graph.query({ type: 'decision' });
  for (const node of decisionNodes) {
    const content =
      typeof node.data['content'] === 'string' ? node.data['content'] : JSON.stringify(node.data);

    index.addDocument(node.id, content, {
      path: node.id,
      type: 'decision',
    });
  }

  // Index Convention nodes
  const conventionNodes = graph.query({ type: 'convention' });
  for (const node of conventionNodes) {
    const content =
      typeof node.data['content'] === 'string' ? node.data['content'] : JSON.stringify(node.data);

    index.addDocument(node.id, content, {
      path: node.id,
      type: 'convention',
    });
  }

  return index;
}
