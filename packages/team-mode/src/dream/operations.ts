import { ok, err, type Result } from '@forge/protocol';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DreamError } from './errors.js';
import type { DreamCycleReport } from './types.js';

export async function runDreamCycle(
  projectRoot: string,
): Promise<Result<DreamCycleReport, DreamError>> {
  const startedAt = new Date();
  const operations: DreamCycleReport['operations'] = [];
  const anomalies: string[] = [];
  let proposalsGenerated = 0;

  // Operation 1: KG rebuild (simulated)
  try {
    operations.push({
      name: 'kg-rebuild',
      status: 'success',
      detail: 'Knowledge graph rebuild simulated',
    });
  } catch (error) {
    operations.push({ name: 'kg-rebuild', status: 'failed', detail: (error as Error).message });
  }

  // Operation 2: Journal digest on Friday/Saturday
  try {
    const dayOfWeek = startedAt.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      const journalPath = join(projectRoot, '.claude', 'memory', 'journal.md');
      try {
        const journalContent = await readFile(journalPath, 'utf-8');
        const weekNumber = getWeekNumber(startedAt);
        const digestDir = join(projectRoot, '.claude', 'digests');
        await mkdir(digestDir, { recursive: true });
        const digestPath = join(digestDir, `journal-week-${weekNumber}.md`);
        const digest = `# Journal Digest — Week ${weekNumber}\n\nGenerated: ${startedAt.toISOString()}\n\n${journalContent}\n`;
        await writeFile(digestPath, digest, 'utf-8');
        operations.push({
          name: 'journal-digest',
          status: 'success',
          detail: `Week ${weekNumber} digest created`,
        });
        proposalsGenerated++;
      } catch {
        operations.push({
          name: 'journal-digest',
          status: 'failed',
          detail: 'journal.md not found',
        });
      }
    } else {
      operations.push({
        name: 'journal-digest',
        status: 'success',
        detail: 'Skipped (not Friday/Saturday)',
      });
    }
  } catch (error) {
    operations.push({ name: 'journal-digest', status: 'failed', detail: (error as Error).message });
  }

  // Operation 3: Decision ledger stats
  try {
    const decisionsPath = join(projectRoot, '.claude', 'memory', 'decisions.md');
    try {
      const content = await readFile(decisionsPath, 'utf-8');
      const entryCount = content.split('\n').filter((line) => line.startsWith('- ')).length;
      operations.push({
        name: 'decision-ledger',
        status: 'success',
        detail: `${entryCount} entries found`,
      });
    } catch {
      operations.push({
        name: 'decision-ledger',
        status: 'success',
        detail: '0 entries (file not found)',
      });
    }
  } catch (error) {
    operations.push({
      name: 'decision-ledger',
      status: 'failed',
      detail: (error as Error).message,
    });
  }

  // Operation 4: Write dream summary
  try {
    const dateStr = formatDate(startedAt);
    const dreamsDir = join(projectRoot, '.claude', 'dreams');
    await mkdir(dreamsDir, { recursive: true });
    const dreamPath = join(dreamsDir, `${dateStr}.md`);

    const summary = buildDreamSummary(startedAt, operations, anomalies);
    await writeFile(dreamPath, summary, 'utf-8');
    operations.push({ name: 'dream-summary', status: 'success', detail: dreamPath });
  } catch (error) {
    operations.push({ name: 'dream-summary', status: 'failed', detail: (error as Error).message });
    return err(
      new DreamError(
        'OPERATION_ERROR',
        `Failed to write dream summary: ${(error as Error).message}`,
      ),
    );
  }

  const completedAt = new Date();

  return ok({
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
    operations,
    proposalsGenerated,
    anomalies,
  });
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil(diff / oneWeek + 1);
}

function buildDreamSummary(
  date: Date,
  operations: DreamCycleReport['operations'],
  anomalies: string[],
): string {
  const lines: string[] = [
    `# Dream Cycle — ${formatDate(date)}`,
    '',
    `Started: ${date.toISOString()}`,
    '',
    '## Operations',
    '',
  ];

  for (const op of operations) {
    const icon = op.status === 'success' ? '[OK]' : '[FAIL]';
    lines.push(`- ${icon} ${op.name}${op.detail ? `: ${op.detail}` : ''}`);
  }

  if (anomalies.length > 0) {
    lines.push('', '## Anomalies', '');
    for (const anomaly of anomalies) {
      lines.push(`- ${anomaly}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
