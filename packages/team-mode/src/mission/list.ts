import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import type { MissionStatus, MissionMode } from '@forge/protocol';
import { MissionError } from './errors.js';
import { readDashboard } from './io.js';

export interface MissionSummary {
  id: string;
  name: string;
  mode: MissionMode;
  status: MissionStatus;
  startedAt: string;
  completedAt?: string;
}

export async function listMissions(
  projectRoot: string,
): Promise<Result<MissionSummary[], MissionError>> {
  const missionsDir = join(projectRoot, '.claude', 'missions');

  let entries: string[];
  try {
    const dirents = await readdir(missionsDir, { withFileTypes: true });
    entries = dirents.filter((d) => d.isDirectory()).map((d) => d.name);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return ok([]);
    }
    return err(new MissionError('IO_ERROR', `Failed to list missions: ${msg}`));
  }

  const summaries: MissionSummary[] = [];
  for (const entry of entries) {
    const dashResult = await readDashboard(projectRoot, entry);
    if (!dashResult.ok) continue; // skip unreadable missions

    const dash = dashResult.value;
    summaries.push({
      id: entry,
      name: dash.name,
      mode: dash.mode,
      status: dash.status,
      startedAt: dash.startedAt,
      completedAt: dash.completedAt,
    });
  }

  // Sort by date, newest first
  summaries.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return ok(summaries);
}
