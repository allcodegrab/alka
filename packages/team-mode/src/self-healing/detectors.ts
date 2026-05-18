import type { FailureDetection } from './types.js';

const DEFAULT_HEARTBEAT_TIMEOUT_MINUTES = 3;
const DEFAULT_FINDING_STORM_THRESHOLD = 5;

export function detectMissionCrash(
  lastHeartbeat: Date,
  timeoutMinutes: number = DEFAULT_HEARTBEAT_TIMEOUT_MINUTES,
): FailureDetection | null {
  const now = new Date();
  const elapsedMs = now.getTime() - lastHeartbeat.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);

  if (elapsedMinutes > timeoutMinutes) {
    return {
      type: 'mission_crash',
      signal: `No heartbeat for ${elapsedMinutes.toFixed(1)} minutes (timeout: ${timeoutMinutes}min)`,
      detectedAt: now.toISOString(),
    };
  }

  return null;
}

export function detectCostRunaway(currentCost: number, budgetCap: number): FailureDetection | null {
  if (currentCost > budgetCap) {
    return {
      type: 'cost_runaway',
      signal: `Cost $${currentCost.toFixed(2)} exceeds budget cap $${budgetCap.toFixed(2)}`,
      detectedAt: new Date().toISOString(),
    };
  }

  return null;
}

export function detectFindingStorm(
  highCount: number,
  threshold: number = DEFAULT_FINDING_STORM_THRESHOLD,
): FailureDetection | null {
  if (highCount >= threshold) {
    return {
      type: 'finding_storm',
      signal: `${highCount} high-severity findings detected (threshold: ${threshold})`,
      detectedAt: new Date().toISOString(),
    };
  }

  return null;
}

export function detectStuckRole(
  lastProgress: Date,
  phaseBudgetMinutes: number,
): FailureDetection | null {
  const now = new Date();
  const elapsedMs = now.getTime() - lastProgress.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);
  const stuckThreshold = phaseBudgetMinutes * 2;

  if (elapsedMinutes > stuckThreshold) {
    return {
      type: 'stuck_role',
      signal: `No progress for ${elapsedMinutes.toFixed(1)} minutes (2x budget: ${stuckThreshold}min)`,
      detectedAt: now.toISOString(),
    };
  }

  return null;
}

export function detectWorktreeConflict(errorMessage: string): FailureDetection | null {
  const conflictPatterns = [
    'CONFLICT',
    'merge conflict',
    'worktree already exists',
    'already checked out',
  ];

  for (const pattern of conflictPatterns) {
    if (errorMessage.includes(pattern)) {
      return {
        type: 'worktree_conflict',
        signal: `Worktree conflict detected: ${errorMessage.slice(0, 200)}`,
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

export function detectModelOutage(errorMessage: string): FailureDetection | null {
  const outagePatterns = [
    'rate limit',
    'Rate limit',
    '429',
    '503',
    'Service Unavailable',
    'model not found',
    'overloaded',
    'capacity',
  ];

  for (const pattern of outagePatterns) {
    if (errorMessage.includes(pattern)) {
      return {
        type: 'model_outage',
        signal: `Model outage detected: ${errorMessage.slice(0, 200)}`,
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return null;
}
