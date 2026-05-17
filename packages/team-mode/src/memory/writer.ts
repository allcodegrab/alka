import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { MemoryError } from './errors.js';

function memoryDir(projectRoot: string): string {
  return join(projectRoot, '.claude', 'memory');
}

async function ensureDir(projectRoot: string): Promise<void> {
  await mkdir(memoryDir(projectRoot), { recursive: true });
}

export async function appendToJournal(
  projectRoot: string,
  entry: string,
): Promise<Result<void, MemoryError>> {
  try {
    await ensureDir(projectRoot);
    const path = join(memoryDir(projectRoot), 'journal.md');

    let existing = '';
    try {
      existing = await readFile(path, 'utf-8');
    } catch {
      // File doesn't exist yet
    }

    const timestamp = new Date().toISOString();
    const header = `## ${timestamp}\n`;
    const content = existing
      ? existing.trimEnd() + '\n\n' + header + entry + '\n'
      : header + entry + '\n';

    await writeFile(path, content, 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new MemoryError(
        'IO_ERROR',
        `Failed to append to journal: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export async function updateWorking(
  projectRoot: string,
  content: string,
): Promise<Result<void, MemoryError>> {
  try {
    await ensureDir(projectRoot);
    await writeFile(join(memoryDir(projectRoot), 'working.md'), content, 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new MemoryError(
        'IO_ERROR',
        `Failed to update working memory: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export async function clearWorking(projectRoot: string): Promise<Result<void, MemoryError>> {
  try {
    await ensureDir(projectRoot);
    await writeFile(join(memoryDir(projectRoot), 'working.md'), '', 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new MemoryError(
        'IO_ERROR',
        `Failed to clear working memory: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export async function appendToConventions(
  projectRoot: string,
  entry: string,
): Promise<Result<void, MemoryError>> {
  try {
    await ensureDir(projectRoot);
    const path = join(memoryDir(projectRoot), 'conventions.md');

    let existing = '';
    try {
      existing = await readFile(path, 'utf-8');
    } catch {
      // File doesn't exist yet
    }

    const separator = '---';
    const content = existing
      ? existing.trimEnd() + '\n\n' + separator + '\n\n' + entry + '\n'
      : entry + '\n';

    await writeFile(path, content, 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new MemoryError(
        'IO_ERROR',
        `Failed to append to conventions: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
