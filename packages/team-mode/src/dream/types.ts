export interface DreamCycleReport {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  operations: Array<{ name: string; status: 'success' | 'failed'; detail?: string }>;
  proposalsGenerated: number;
  anomalies: string[];
}
