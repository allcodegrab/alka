import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { MemoryError } from './errors.js';

export interface MemoryState {
  working: string;
  journal: string;
  conventions: string;
  playbooks: string;
}

function memoryDir(projectRoot: string): string {
  return join(projectRoot, '.claude', 'memory');
}

async function readFileSafe(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return '';
  }
}

export async function readMemoryFiles(
  projectRoot: string,
): Promise<Result<MemoryState, MemoryError>> {
  try {
    const dir = memoryDir(projectRoot);
    const [working, journal, conventions, playbooks] = await Promise.all([
      readFileSafe(join(dir, 'working.md')),
      readFileSafe(join(dir, 'journal.md')),
      readFileSafe(join(dir, 'conventions.md')),
      readFileSafe(join(dir, 'playbooks.md')),
    ]);

    return ok({ working, journal, conventions, playbooks });
  } catch (e) {
    return err(
      new MemoryError(
        'IO_ERROR',
        `Failed to read memory files: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
