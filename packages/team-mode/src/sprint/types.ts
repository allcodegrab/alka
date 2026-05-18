export interface SprintPhase {
  id: string;
  name: string;
  budgetMinutes: number;
  softDeadlineMinutes: number;
  hardDeadlineMinutes: number;
}

export type SlicePriority = 'critical' | 'important' | 'nice-to-have';

export interface ScopeCutResult {
  cutSlices: string[];
  cutVerifiers: string[];
  docsMode: 'full' | 'draft';
  releaseMode: 'full' | 'draft-pr';
  reason: string;
}

export interface TimelineEntry {
  phase: string;
  startedAt: string;
  completedAt?: string;
  status: 'active' | 'complete' | 'overrun' | 'skipped';
}
