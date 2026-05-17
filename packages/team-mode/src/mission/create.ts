import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import type { MissionId, MissionState } from '@forge/protocol';
import { MissionError } from './errors.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function missionDir(projectRoot: string, id: string): string {
  return join(projectRoot, '.claude', 'missions', id);
}

export async function createMission(
  projectRoot: string,
  name: string,
  mode: 'standard' | '24h',
  brief: string,
): Promise<Result<MissionId, MissionError>> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const slug = slugify(name);
  const id = `${dateStr}-${slug}` as MissionId;
  const dir = missionDir(projectRoot, id);

  try {
    await access(dir);
    return err(new MissionError('ALREADY_EXISTS', `Mission directory already exists: ${id}`));
  } catch {
    // Directory does not exist, proceed
  }

  try {
    await mkdir(dir, { recursive: true });
    await mkdir(join(dir, 'artifacts'), { recursive: true });

    const dashboard: MissionState = {
      missionId: id,
      name,
      mode,
      status: 'active',
      startedAt: now.toISOString(),
      roles: [],
      totalCostUsd: 0,
      slicesTotal: 0,
      slicesCompleted: 0,
    };

    await Promise.all([
      writeFile(join(dir, 'context.md'), brief, 'utf-8'),
      writeFile(join(dir, 'whiteboard.md'), '# Mission Whiteboard\n', 'utf-8'),
      writeFile(join(dir, 'dashboard.json'), JSON.stringify(dashboard, null, 2) + '\n', 'utf-8'),
      writeFile(join(dir, 'status.md'), '# Mission Status\n\nMission started.\n', 'utf-8'),
      writeFile(join(dir, 'decisions.md'), '# Decisions\n', 'utf-8'),
    ]);

    return ok(id);
  } catch (e) {
    return err(
      new MissionError(
        'IO_ERROR',
        `Failed to create mission: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
