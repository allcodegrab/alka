import { ok, err, type Result } from '@forge/protocol';
import { HealingError } from './errors.js';
import type { FailureDetection, RecoveryAction } from './types.js';
import { logHealingAction } from './journal-logger.js';

const MAX_RETRIES = 3;
const retryCounters = new Map<string, number>();

function retryKey(failure: FailureDetection): string {
  return `${failure.type}:${failure.missionId ?? 'global'}:${failure.roleId ?? 'none'}`;
}

export function resetRetryCounters(): void {
  retryCounters.clear();
}

export async function recover(
  projectRoot: string,
  failure: FailureDetection,
): Promise<Result<RecoveryAction, HealingError>> {
  const key = retryKey(failure);
  const currentRetries = retryCounters.get(key) ?? 0;

  if (currentRetries >= MAX_RETRIES) {
    const action: RecoveryAction = {
      failure,
      action: 'escalate_to_cto_inbox',
      success: false,
      retryCount: currentRetries,
    };
    await logHealingAction(projectRoot, action);
    return err(
      new HealingError('MAX_RETRIES', `Max retries (${MAX_RETRIES}) exceeded for ${failure.type}`),
    );
  }

  retryCounters.set(key, currentRetries + 1);

  let actionDescription: string;
  let success = true;

  switch (failure.type) {
    case 'mission_crash':
      actionDescription = 'resume_from_whiteboard';
      break;
    case 'cost_runaway':
      actionDescription = 'pause_mission_and_emit_inbox';
      break;
    case 'finding_storm':
      actionDescription = 'stop_new_slices_and_emit_inbox';
      break;
    case 'stuck_role':
      actionDescription = 'soft_restart_role';
      break;
    case 'worktree_conflict':
      actionDescription = 'soft_abort_slice';
      break;
    case 'model_outage':
      actionDescription = 'log_warning_and_wait';
      break;
    case 'kg_corruption':
      actionDescription = 'rebuild_knowledge_graph';
      break;
    case 'mcp_failure':
      actionDescription = 'restart_mcp_connection';
      break;
    default:
      actionDescription = 'unknown_recovery';
      success = false;
      break;
  }

  const action: RecoveryAction = {
    failure,
    action: actionDescription,
    success,
    retryCount: currentRetries + 1,
  };

  await logHealingAction(projectRoot, action);

  return ok(action);
}
