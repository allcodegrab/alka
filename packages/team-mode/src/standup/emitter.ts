import { ok, err, type Result } from '@forge/protocol';
import { readDashboard, updateDashboard } from '../mission/io.js';
import { StandupError } from './errors.js';
import { canEmit, recordEmission } from './rate-limiter.js';

export async function emitStandup(
  projectRoot: string,
  missionId: string,
  roleId: string,
  status: string,
  currentAction: string,
  eta?: string,
): Promise<Result<void, StandupError>> {
  if (!canEmit(roleId)) {
    return ok(undefined);
  }

  const dashResult = await readDashboard(projectRoot, missionId);
  if (!dashResult.ok) {
    return err(
      new StandupError('IO_ERROR', `Failed to read dashboard: ${dashResult.error.message}`),
    );
  }

  const state = dashResult.value;
  const now = new Date().toISOString();

  const existingIndex = state.roles.findIndex((r) => r.roleId === roleId);
  const roleEntry = {
    roleId,
    status: status as 'idle' | 'planning' | 'running' | 'blocked' | 'complete' | 'failed',
    currentAction,
    costUsd: existingIndex >= 0 ? state.roles[existingIndex]!.costUsd : 0,
    lastUpdated: now,
    ...(eta !== undefined ? { eta } : {}),
  };

  if (existingIndex >= 0) {
    state.roles[existingIndex] = {
      ...state.roles[existingIndex]!,
      ...roleEntry,
    };
  } else {
    state.roles.push(roleEntry);
  }

  const writeResult = await updateDashboard(projectRoot, missionId, state);
  if (!writeResult.ok) {
    return err(
      new StandupError('IO_ERROR', `Failed to update dashboard: ${writeResult.error.message}`),
    );
  }

  recordEmission(roleId);
  return ok(undefined);
}
