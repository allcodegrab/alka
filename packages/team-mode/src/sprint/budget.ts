import { createInboxItem, writeInboxItem } from '../inbox/index.js';
import type { SprintClock } from './clock.js';

export async function checkBudget(
  clock: SprintClock,
  missionId: string,
  projectRoot: string,
): Promise<{ warnings: string[]; escalations: string[] }> {
  const warnings: string[] = [];
  const escalations: string[] = [];
  const currentPhaseId = clock.currentPhase();

  if (!currentPhaseId) {
    return { warnings, escalations };
  }

  const phases = clock.getPhases();

  for (const phase of phases) {
    // Only check phases that have been started (have elapsed time > 0) or are the current phase
    if (phase.id !== currentPhaseId) continue;

    if (clock.isOverHardDeadline(phase.id)) {
      const overMs = -clock.timeRemainingInPhase(phase.id);
      const overMinutes = Math.round(overMs / (1000 * 60));
      const message = `Phase "${phase.name}" exceeded hard deadline by ${overMinutes} minutes`;
      escalations.push(message);

      const item = createInboxItem({
        missionId,
        severity: 'high',
        type: 'budget_threshold',
        proposer: 'sprint-clock',
        summary: `Hard deadline exceeded: ${phase.name}`,
        what: message,
        why: `Phase "${phase.name}" has exceeded its hard deadline of ${phase.hardDeadlineMinutes} minutes. Immediate CTO attention required.`,
        recommendation: 'Consider scope cuts or phase extension approval.',
        evidence: [
          `Phase: ${phase.name}`,
          `Hard deadline: ${phase.hardDeadlineMinutes}min`,
          `Elapsed: ${phase.hardDeadlineMinutes + overMinutes}min`,
          `Sprint time: ${clock.formatElapsed()}`,
        ],
        decisionOptions: [
          { id: 'extend', label: 'Extend deadline', consequence: 'Sprint may exceed 24h window' },
          { id: 'cut-scope', label: 'Cut scope', consequence: 'Some features will be deferred' },
          { id: 'abort', label: 'Abort mission', consequence: 'Mission is cancelled' },
        ],
        timeSensitivity: 'Immediate — phase is blocked',
      });

      await writeInboxItem(projectRoot, item);
    } else if (clock.isOverSoftDeadline(phase.id)) {
      const elapsedMs = clock.phaseElapsed(phase.id);
      const elapsedMinutes = Math.round(elapsedMs / (1000 * 60));
      warnings.push(
        `Phase "${phase.name}" exceeded soft deadline (${elapsedMinutes}min / ${phase.softDeadlineMinutes}min budget)`,
      );
    }
  }

  return { warnings, escalations };
}
