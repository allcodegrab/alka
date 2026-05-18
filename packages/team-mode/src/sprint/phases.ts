import type { SprintPhase } from './types.js';

/**
 * 24-hour sprint phase budgets per FORGE_TEAM_MODE.md section 7.
 * Phases with CTO-controlled deadlines use Infinity for hard deadlines.
 */
export const TWENTY_FOUR_HOUR_PHASES: SprintPhase[] = [
  {
    id: 'brief',
    name: 'Brief',
    budgetMinutes: 30,
    softDeadlineMinutes: 30,
    hardDeadlineMinutes: 45,
  },
  {
    id: 'research',
    name: 'Research',
    budgetMinutes: 75,
    softDeadlineMinutes: 75,
    hardDeadlineMinutes: 150,
  },
  {
    id: 'arch_review',
    name: 'Architecture Review',
    budgetMinutes: Infinity,
    softDeadlineMinutes: Infinity,
    hardDeadlineMinutes: Infinity,
  },
  {
    id: 'plan',
    name: 'Plan',
    budgetMinutes: 25,
    softDeadlineMinutes: 25,
    hardDeadlineMinutes: 45,
  },
  {
    id: 'implementation',
    name: 'Implementation',
    budgetMinutes: 840,
    softDeadlineMinutes: 840,
    hardDeadlineMinutes: 960,
  },
  {
    id: 'verification',
    name: 'Verification',
    budgetMinutes: 50,
    softDeadlineMinutes: 50,
    hardDeadlineMinutes: 90,
  },
  {
    id: 'remediation',
    name: 'Remediation',
    budgetMinutes: 150,
    softDeadlineMinutes: 150,
    hardDeadlineMinutes: 240,
  },
  {
    id: 'pr_review',
    name: 'PR Review',
    budgetMinutes: 45,
    softDeadlineMinutes: 45,
    hardDeadlineMinutes: 90,
  },
  {
    id: 'docs_release',
    name: 'Docs & Release',
    budgetMinutes: 45,
    softDeadlineMinutes: 45,
    hardDeadlineMinutes: 90,
  },
  {
    id: 'final_approval',
    name: 'Final Approval',
    budgetMinutes: Infinity,
    softDeadlineMinutes: Infinity,
    hardDeadlineMinutes: Infinity,
  },
];

/**
 * Standard (relaxed) phase definitions — no hard deadlines enforced.
 */
export const STANDARD_PHASES: SprintPhase[] = TWENTY_FOUR_HOUR_PHASES.map((phase) => ({
  ...phase,
  hardDeadlineMinutes: Infinity,
}));
