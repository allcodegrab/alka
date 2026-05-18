export interface Chunk {
  id: string;
  content: string;
  startLine: number;
  endLine: number;
  filePath: string;
}

const DEFAULT_CHUNK_SIZE = 200;
const DEFAULT_OVERLAP = 20;

export function chunkFileContent(
  filePath: string,
  content: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP,
): Chunk[] {
  const lines = content.split('\n');

  if (lines.length === 0) {
    return [
      {
        id: `${filePath}:1-1`,
        content: '',
        startLine: 1,
        endLine: 1,
        filePath,
      },
    ];
  }

  if (lines.length <= chunkSize) {
    return [
      {
        id: `${filePath}:1-${lines.length}`,
        content,
        startLine: 1,
        endLine: lines.length,
        filePath,
      },
    ];
  }

  const chunks: Chunk[] = [];
  let start = 0;

  while (start < lines.length) {
    const end = Math.min(start + chunkSize, lines.length);
    const startLine = start + 1;
    const endLine = end;
    const chunkContent = lines.slice(start, end).join('\n');

    chunks.push({
      id: `${filePath}:${startLine}-${endLine}`,
      content: chunkContent,
      startLine,
      endLine,
      filePath,
    });

    if (end >= lines.length) break;

    start = end - overlap;
  }

  return chunks;
}
