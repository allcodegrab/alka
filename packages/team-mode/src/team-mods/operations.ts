import { ok, err, type Result } from '@forge/protocol';
import type { TeamModEntry, ReconfigEntry } from './types.js';
import { TeamModError } from './errors.js';
import { readTeamDelta, writeTeamDelta } from './team-delta.js';

export async function addRole(
  projectRoot: string,
  missionId: string,
  entry: TeamModEntry,
): Promise<Result<void, TeamModError>> {
  const deltaResult = await readTeamDelta(projectRoot, missionId);
  if (!deltaResult.ok) return deltaResult;

  const delta = deltaResult.value;
  const existing = delta.additions.find((a) => a.id === entry.id);
  if (existing) {
    return err(new TeamModError('ALREADY_EXISTS', `Role '${entry.id}' already in additions`));
  }

  delta.additions.push(entry);
  return writeTeamDelta(projectRoot, missionId, delta);
}

export async function removeRole(
  projectRoot: string,
  missionId: string,
  roleId: string,
  reason: string,
  proposedBy: string,
): Promise<Result<void, TeamModError>> {
  const deltaResult = await readTeamDelta(projectRoot, missionId);
  if (!deltaResult.ok) return deltaResult;

  const delta = deltaResult.value;
  const existing = delta.removals.find((r) => r.id === roleId);
  if (existing) {
    return err(new TeamModError('ALREADY_EXISTS', `Role '${roleId}' already in removals`));
  }

  delta.removals.push({ id: roleId, reason, proposedBy });
  return writeTeamDelta(projectRoot, missionId, delta);
}

export async function pauseRole(
  projectRoot: string,
  missionId: string,
  roleId: string,
): Promise<Result<void, TeamModError>> {
  const deltaResult = await readTeamDelta(projectRoot, missionId);
  if (!deltaResult.ok) return deltaResult;

  const delta = deltaResult.value;
  if (delta.paused.includes(roleId)) {
    return ok(undefined);
  }

  delta.paused.push(roleId);
  return writeTeamDelta(projectRoot, missionId, delta);
}

export async function resumeRole(
  projectRoot: string,
  missionId: string,
  roleId: string,
): Promise<Result<void, TeamModError>> {
  const deltaResult = await readTeamDelta(projectRoot, missionId);
  if (!deltaResult.ok) return deltaResult;

  const delta = deltaResult.value;
  const index = delta.paused.indexOf(roleId);
  if (index === -1) {
    return ok(undefined);
  }

  delta.paused.splice(index, 1);
  return writeTeamDelta(projectRoot, missionId, delta);
}

export async function reconfigureRole(
  projectRoot: string,
  missionId: string,
  entry: ReconfigEntry,
): Promise<Result<void, TeamModError>> {
  const deltaResult = await readTeamDelta(projectRoot, missionId);
  if (!deltaResult.ok) return deltaResult;

  const delta = deltaResult.value;
  delta.reconfigurations.push(entry);
  return writeTeamDelta(projectRoot, missionId, delta);
}
