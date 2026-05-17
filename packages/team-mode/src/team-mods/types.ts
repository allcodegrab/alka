export interface TeamDelta {
  missionId: string;
  baseOrgChartVersion: number;
  additions: TeamModEntry[];
  removals: TeamModEntry[];
  paused: string[];
  reconfigurations: ReconfigEntry[];
}

export interface TeamModEntry {
  id: string;
  template?: string;
  reason: string;
  proposedBy: string;
  approvedAt?: string;
  budgetImpactUsd?: number;
}

export interface ReconfigEntry {
  id: string;
  change: string;
  from: string;
  to: string;
  reason: string;
  proposedBy: string;
  approvedAt?: string;
  budgetImpactUsd?: number;
}
