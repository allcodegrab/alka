import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { ScheduleError } from './errors.js';

export type RoleLifecycleState =
  | 'active'
  | 'paused'
  | 'on-leave'
  | 'retired'
  | 'dreaming'
  | 'consulting';

interface RoleStateEntry {
  state: RoleLifecycleState;
  until?: string;
}

type RoleStatesFile = Record<string, RoleStateEntry>;

function statesPath(projectRoot: string): string {
  return join(projectRoot, '.forge', 'role-states.json');
}

async function readStatesFile(projectRoot: string): Promise<Result<RoleStatesFile, ScheduleError>> {
  const path = statesPath(projectRoot);
  try {
    const content = await readFile(path, 'utf-8');
    const parsed = JSON.parse(content) as RoleStatesFile;
    return ok(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return ok({});
    }
    return err(new ScheduleError('IO_ERROR', `Failed to read role states: ${msg}`));
  }
}

async function writeStatesFile(
  projectRoot: string,
  states: RoleStatesFile,
): Promise<Result<void, ScheduleError>> {
  const path = statesPath(projectRoot);
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(states, null, 2) + '\n', 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new ScheduleError(
        'IO_ERROR',
        `Failed to write role states: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export async function setRoleState(
  projectRoot: string,
  roleId: string,
  state: RoleLifecycleState,
  until?: string,
): Promise<Result<void, ScheduleError>> {
  const statesResult = await readStatesFile(projectRoot);
  if (!statesResult.ok) return statesResult;

  const states = statesResult.value;
  const entry: RoleStateEntry = { state };
  if (until) {
    entry.until = until;
  }
  states[roleId] = entry;

  return writeStatesFile(projectRoot, states);
}

export async function getRoleState(
  projectRoot: string,
  roleId: string,
): Promise<Result<RoleLifecycleState, ScheduleError>> {
  const statesResult = await readStatesFile(projectRoot);
  if (!statesResult.ok) return statesResult;

  const entry = statesResult.value[roleId];
  return ok(entry?.state ?? 'active');
}

export async function listRoleStates(
  projectRoot: string,
): Promise<Result<Record<string, RoleLifecycleState>, ScheduleError>> {
  const statesResult = await readStatesFile(projectRoot);
  if (!statesResult.ok) return statesResult;

  const result: Record<string, RoleLifecycleState> = {};
  for (const [roleId, entry] of Object.entries(statesResult.value)) {
    result[roleId] = entry.state;
  }

  return ok(result);
}
