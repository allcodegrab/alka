export interface MeditationMetrics {
  slicesAssigned: number;
  slicesCompleted: number;
  slicesRetried: number;
  findingsAgainst: number;
  escalations: number;
  avgWallTimeMinutes: number;
  budgetMinutes: number;
  costUsd: number;
  missionSharePct: number;
  retries: number;
}
