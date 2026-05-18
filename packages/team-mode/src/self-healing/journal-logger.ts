import { appendFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { RecoveryAction } from './types.js';

export async function logHealingAction(projectRoot: string, action: RecoveryAction): Promise<void> {
  const journalPath = join(projectRoot, '.claude', 'memory', 'journal.md');

  try {
    await mkdir(dirname(journalPath), { recursive: true });
  } catch {
    // Directory may already exist
  }

  const timestamp = action.failure.detectedAt;
  const status = action.success ? 'OK' : 'FAILED';
  const entry = `[self-healing] ${timestamp} | ${action.failure.type} | ${action.action} | ${status} | retry #${action.retryCount}\n`;

  try {
    await appendFile(journalPath, entry, 'utf-8');
  } catch {
    // Best-effort logging — do not throw
  }
}
