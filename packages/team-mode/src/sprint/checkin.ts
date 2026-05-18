import { ok, err, type Result } from '@forge/protocol';
import { createInboxItem, writeInboxItem } from '../inbox/index.js';
import type { SprintClock } from './clock.js';
import { SprintError } from './errors.js';

export async function emitMidMissionCheckin(
  projectRoot: string,
  missionId: string,
  clock: SprintClock,
  completedSlices: number,
  totalSlices: number,
  totalCostUsd: number,
): Promise<Result<void, SprintError>> {
  const elapsed = clock.formatElapsed();
  const pct = totalSlices > 0 ? Math.round((completedSlices / totalSlices) * 100) : 0;

  const item = createInboxItem({
    missionId,
    severity: 'medium',
    type: 'budget_threshold',
    proposer: 'sprint-clock',
    summary: `Mid-mission check-in at ${elapsed}`,
    what: `Progress: ${completedSlices}/${totalSlices} slices (${pct}%) complete. Total cost: $${totalCostUsd.toFixed(2)}.`,
    why: `Scheduled mid-mission check-in to keep CTO informed of sprint progress at the halfway mark.`,
    recommendation:
      pct < 40
        ? 'Consider scope cuts — progress is below 40% at midpoint.'
        : 'On track — no action needed.',
    evidence: [
      `Elapsed: ${elapsed}`,
      `Slices: ${completedSlices}/${totalSlices} (${pct}%)`,
      `Cost: $${totalCostUsd.toFixed(2)}`,
      `Current phase: ${clock.currentPhase() ?? 'unknown'}`,
    ],
    decisionOptions: [
      { id: 'continue', label: 'Continue as planned', consequence: 'No changes to scope' },
      { id: 'cut-scope', label: 'Cut scope', consequence: 'Some features will be deferred' },
      { id: 'extend', label: 'Extend timeline', consequence: 'Sprint exceeds 24h window' },
    ],
  });

  try {
    const writeResult = await writeInboxItem(projectRoot, item);
    if (!writeResult.ok) {
      return err(
        new SprintError(
          'IO_ERROR',
          `Failed to write check-in inbox item: ${writeResult.error.message}`,
        ),
      );
    }
    return ok(undefined);
  } catch (e) {
    return err(
      new SprintError(
        'IO_ERROR',
        `Failed to emit check-in: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
