import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import type { TimelineEntry } from './types.js';
import { SprintError } from './errors.js';

function timelinePath(projectRoot: string, missionId: string): string {
  return join(projectRoot, '.claude', 'missions', missionId, 'timeline.json');
}

export async function recordPhaseTransition(
  projectRoot: string,
  missionId: string,
  entry: TimelineEntry,
): Promise<Result<void, SprintError>> {
  const path = timelinePath(projectRoot, missionId);

  try {
    await mkdir(dirname(path), { recursive: true });
  } catch (e) {
    return err(
      new SprintError(
        'IO_ERROR',
        `Failed to create timeline directory: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  let entries: TimelineEntry[] = [];
  try {
    const raw = await readFile(path, 'utf-8');
    entries = JSON.parse(raw) as TimelineEntry[];
  } catch {
    // File doesn't exist yet or is invalid — start fresh
  }

  entries.push(entry);

  try {
    await writeFile(path, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new SprintError(
        'IO_ERROR',
        `Failed to write timeline: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export async function getMissionTimeline(
  projectRoot: string,
  missionId: string,
): Promise<Result<TimelineEntry[], SprintError>> {
  const path = timelinePath(projectRoot, missionId);

  try {
    const raw = await readFile(path, 'utf-8');
    const entries = JSON.parse(raw) as TimelineEntry[];
    return ok(entries);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return ok([]);
    }
    return err(new SprintError('IO_ERROR', `Failed to read timeline: ${msg}`));
  }
}
