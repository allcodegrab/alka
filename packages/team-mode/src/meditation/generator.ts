import { ok, err, type Result } from '@forge/protocol';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MeditationError } from './errors.js';
import type { MeditationMetrics } from './types.js';

export async function generateMeditation(
  projectRoot: string,
  missionId: string,
  roleId: string,
  metrics: MeditationMetrics,
): Promise<Result<string, MeditationError>> {
  try {
    const meditationDir = join(projectRoot, '.claude', 'meditations', missionId);
    await mkdir(meditationDir, { recursive: true });

    const filePath = join(meditationDir, `${roleId}.md`);
    const completionRate =
      metrics.slicesAssigned > 0
        ? ((metrics.slicesCompleted / metrics.slicesAssigned) * 100).toFixed(1)
        : '0.0';

    const content = [
      `# Meditation: ${roleId}`,
      `**Mission:** ${missionId}`,
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '## Concrete metrics',
      '',
      `- Slices assigned: ${metrics.slicesAssigned}`,
      `- Slices completed: ${metrics.slicesCompleted}`,
      `- Slices retried: ${metrics.slicesRetried}`,
      `- Completion rate: ${completionRate}%`,
      `- Findings against: ${metrics.findingsAgainst}`,
      `- Escalations: ${metrics.escalations}`,
      `- Avg wall time: ${metrics.avgWallTimeMinutes} min`,
      `- Budget: ${metrics.budgetMinutes} min`,
      `- Cost: $${metrics.costUsd.toFixed(2)}`,
      `- Mission share: ${metrics.missionSharePct}%`,
      `- Retries: ${metrics.retries}`,
      '',
      '## Concrete observations',
      '',
      `- Completed ${metrics.slicesCompleted} of ${metrics.slicesAssigned} assigned slices`,
      metrics.findingsAgainst > 0
        ? `- ${metrics.findingsAgainst} verification findings require attention`
        : '- No verification findings',
      '',
      '## Proposals',
      '',
      metrics.slicesRetried > 0
        ? '- Investigate retry causes to reduce rework'
        : '- Maintain current approach',
      '',
      "## What I'm NOT going to do",
      '',
      '- Change working patterns without evidence of improvement',
      '- Increase scope without CTO approval',
      '',
    ].join('\n');

    await writeFile(filePath, content, 'utf-8');
    return ok(filePath);
  } catch (error) {
    return err(
      new MeditationError('IO_ERROR', `Failed to generate meditation: ${(error as Error).message}`),
    );
  }
}
