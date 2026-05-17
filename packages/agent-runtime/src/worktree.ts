import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { AgentSpawnError } from './errors.js';

const exec = promisify(execFile);

export async function createWorktree(
  repoRoot: string,
  branchName: string,
): Promise<Result<string, AgentSpawnError>> {
  const worktreePath = join(repoRoot, '.forge', 'worktrees', branchName);

  try {
    await exec('git', ['worktree', 'add', '-b', branchName, worktreePath], { cwd: repoRoot });
    return ok(worktreePath);
  } catch (e) {
    return err(
      new AgentSpawnError(
        'WORKTREE_ERROR',
        `Failed to create worktree ${branchName}: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export async function removeWorktree(
  repoRoot: string,
  worktreePath: string,
  branchName: string,
): Promise<Result<void, AgentSpawnError>> {
  try {
    await exec('git', ['worktree', 'remove', worktreePath, '--force'], { cwd: repoRoot });
  } catch {
    // Worktree might already be removed
  }

  try {
    await exec('git', ['branch', '-D', branchName], { cwd: repoRoot });
  } catch {
    // Branch might already be deleted
  }

  return ok(undefined);
}
