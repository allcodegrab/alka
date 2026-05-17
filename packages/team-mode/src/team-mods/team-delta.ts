import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { parse, stringify } from 'yaml';
import type { TeamDelta } from './types.js';
import { TeamModError } from './errors.js';

function teamDeltaPath(projectRoot: string, missionId: string): string {
  return join(projectRoot, '.claude', 'missions', missionId, 'team-delta.yaml');
}

function emptyDelta(missionId: string): TeamDelta {
  return {
    missionId,
    baseOrgChartVersion: 1,
    additions: [],
    removals: [],
    paused: [],
    reconfigurations: [],
  };
}

export async function readTeamDelta(
  projectRoot: string,
  missionId: string,
): Promise<Result<TeamDelta, TeamModError>> {
  const path = teamDeltaPath(projectRoot, missionId);
  try {
    const content = await readFile(path, 'utf-8');
    const parsed = parse(content) as TeamDelta;
    return ok(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return ok(emptyDelta(missionId));
    }
    return err(new TeamModError('IO_ERROR', `Failed to read team-delta.yaml: ${msg}`));
  }
}

export async function writeTeamDelta(
  projectRoot: string,
  missionId: string,
  delta: TeamDelta,
): Promise<Result<void, TeamModError>> {
  const path = teamDeltaPath(projectRoot, missionId);
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, stringify(delta), 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new TeamModError(
        'IO_ERROR',
        `Failed to write team-delta.yaml: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
