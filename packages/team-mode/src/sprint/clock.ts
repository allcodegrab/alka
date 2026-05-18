import type { SprintPhase } from './types.js';
import { TWENTY_FOUR_HOUR_PHASES, STANDARD_PHASES } from './phases.js';

export class SprintClock {
  private readonly startedAt: Date;
  private readonly mode: '24h' | 'standard';
  private readonly phaseStartTimes: Map<string, Date> = new Map();
  private currentPhaseId: string | null = null;

  constructor(startedAt: Date, mode: '24h' | 'standard') {
    this.startedAt = startedAt;
    this.mode = mode;
  }

  /** Total elapsed milliseconds since sprint start. */
  elapsed(): number {
    return Date.now() - this.startedAt.getTime();
  }

  /** Total elapsed hours since sprint start. */
  elapsedHours(): number {
    return this.elapsed() / (1000 * 60 * 60);
  }

  /** Formatted elapsed time as "H+HH:MM". */
  formatElapsed(): string {
    const totalMs = this.elapsed();
    const totalMinutes = Math.floor(totalMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `H+${hours}:${String(minutes).padStart(2, '0')}`;
  }

  /** Mark the start of a phase. */
  startPhase(phaseId: string): void {
    this.phaseStartTimes.set(phaseId, new Date());
    this.currentPhaseId = phaseId;
  }

  /** Return the ID of the currently active phase, or null. */
  currentPhase(): string | null {
    return this.currentPhaseId;
  }

  /** Milliseconds elapsed since a phase started. Returns 0 if phase not started. */
  phaseElapsed(phaseId: string): number {
    const start = this.phaseStartTimes.get(phaseId);
    if (!start) return 0;
    return Date.now() - start.getTime();
  }

  /** Whether the phase has exceeded its soft deadline. */
  isOverSoftDeadline(phaseId: string): boolean {
    const phase = this.findPhase(phaseId);
    if (!phase || phase.softDeadlineMinutes === Infinity) return false;
    const elapsedMinutes = this.phaseElapsed(phaseId) / (1000 * 60);
    return elapsedMinutes > phase.softDeadlineMinutes;
  }

  /** Whether the phase has exceeded its hard deadline. */
  isOverHardDeadline(phaseId: string): boolean {
    const phase = this.findPhase(phaseId);
    if (!phase || phase.hardDeadlineMinutes === Infinity) return false;
    const elapsedMinutes = this.phaseElapsed(phaseId) / (1000 * 60);
    return elapsedMinutes > phase.hardDeadlineMinutes;
  }

  /** Milliseconds remaining in the phase (negative if over deadline). */
  timeRemainingInPhase(phaseId: string): number {
    const phase = this.findPhase(phaseId);
    if (!phase || phase.hardDeadlineMinutes === Infinity) return Infinity;
    const budgetMs = phase.hardDeadlineMinutes * 60 * 1000;
    return budgetMs - this.phaseElapsed(phaseId);
  }

  /** Return the phase definitions for the current mode. */
  getPhases(): SprintPhase[] {
    return this.mode === '24h' ? TWENTY_FOUR_HOUR_PHASES : STANDARD_PHASES;
  }

  private findPhase(phaseId: string): SprintPhase | undefined {
    return this.getPhases().find((p) => p.id === phaseId);
  }
}
