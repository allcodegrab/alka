import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { InboxItemSchema, type InboxItem, type InboxSeverity } from '@forge/protocol';
import { InboxError } from './errors.js';

function inboxDir(projectRoot: string): string {
  return join(projectRoot, '.forge', 'inbox');
}

function itemPath(projectRoot: string, id: string): string {
  return join(inboxDir(projectRoot), `${id}.json`);
}

const severityOrder: Record<InboxSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export async function writeInboxItem(
  projectRoot: string,
  item: InboxItem,
): Promise<Result<void, InboxError>> {
  try {
    const dir = inboxDir(projectRoot);
    await mkdir(dir, { recursive: true });
    await writeFile(itemPath(projectRoot, item.id), JSON.stringify(item, null, 2) + '\n', 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new InboxError(
        'IO_ERROR',
        `Failed to write inbox item: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export async function readInboxItem(
  projectRoot: string,
  id: string,
): Promise<Result<InboxItem, InboxError>> {
  try {
    const content = await readFile(itemPath(projectRoot, id), 'utf-8');
    const parsed = InboxItemSchema.parse(JSON.parse(content));
    return ok(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return err(new InboxError('NOT_FOUND', `Inbox item not found: ${id}`));
    }
    return err(new InboxError('IO_ERROR', `Failed to read inbox item: ${msg}`));
  }
}

export async function listInboxItems(
  projectRoot: string,
): Promise<Result<InboxItem[], InboxError>> {
  const dir = inboxDir(projectRoot);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return ok([]);
    }
    return err(new InboxError('IO_ERROR', `Failed to list inbox items: ${msg}`));
  }

  const items: InboxItem[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = await readFile(join(dir, file), 'utf-8');
      const parsed = InboxItemSchema.parse(JSON.parse(content));
      items.push(parsed);
    } catch {
      // Skip invalid files
    }
  }

  items.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return ok(items);
}

export async function deleteInboxItem(
  projectRoot: string,
  id: string,
): Promise<Result<void, InboxError>> {
  try {
    await unlink(itemPath(projectRoot, id));
    return ok(undefined);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return err(new InboxError('NOT_FOUND', `Inbox item not found: ${id}`));
    }
    return err(new InboxError('IO_ERROR', `Failed to delete inbox item: ${msg}`));
  }
}
