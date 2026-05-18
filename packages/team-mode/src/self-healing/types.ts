export type FailureType =
  | 'mission_crash'
  | 'kg_corruption'
  | 'cost_runaway'
  | 'finding_storm'
  | 'stuck_role'
  | 'mcp_failure'
  | 'model_outage'
  | 'worktree_conflict';

export interface FailureDetection {
  type: FailureType;
  signal: string;
  missionId?: string;
  roleId?: string;
  detectedAt: string;
}

export interface RecoveryAction {
  failure: FailureDetection;
  action: string;
  success: boolean;
  retryCount: number;
}
