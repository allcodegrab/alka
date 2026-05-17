import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import type { DecisionEntry } from '@forge/protocol';
import { LedgerError } from './errors.js';

export function formatDecisionEntry(entry: DecisionEntry): string {
  let md = `### ${entry.id} — ${entry.timestamp}\n`;
  md += `**Role:** ${entry.role}  \n`;
  md += `**Type:** ${entry.type}  \n`;
  md += `**Summary:** ${entry.summary}  \n`;
  md += `**Why:** ${entry.why}  \n`;
  md += `**Status:** ${entry.status}  \n`;
  md += `**Scope:** ${entry.scope}\n`;
  return md;
}

export async function appendDecisionToLedger(
  filePath: string,
  entry: DecisionEntry,
): Promise<Result<void, LedgerError>> {
  try {
    await mkdir(dirname(filePath), { recursive: true });

    let existing = '';
    try {
      existing = await readFile(filePath, 'utf-8');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('ENOENT')) {
        return err(new LedgerError('IO_ERROR', `Failed to read ledger: ${msg}`));
      }
      // File doesn't exist yet, start fresh
    }

    const formatted = formatDecisionEntry(entry);
    const content = existing ? existing.trimEnd() + '\n\n' + formatted : formatted;
    await writeFile(filePath, content + '\n', 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new LedgerError(
        'IO_ERROR',
        `Failed to append to ledger: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
