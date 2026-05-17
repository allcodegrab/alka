import { readFile } from 'node:fs/promises';
import { ok, err, type Result } from '@forge/protocol';
import type { DecisionEntry } from '@forge/protocol';
import { LedgerError } from './errors.js';

function parseBlock(block: string): DecisionEntry | null {
  try {
    const headerMatch = block.match(/^###\s+(.+?)\s+—\s+(.+)$/m);
    if (!headerMatch) return null;

    const id = headerMatch[1]!.trim();
    const timestamp = headerMatch[2]!.trim();

    const role = block.match(/\*\*Role:\*\*\s*(.+?)(?:\s\s)?$/m)?.[1]?.trim() ?? '';
    const type = block.match(/\*\*Type:\*\*\s*(.+?)(?:\s\s)?$/m)?.[1]?.trim() ?? '';
    const summary = block.match(/\*\*Summary:\*\*\s*(.+?)(?:\s\s)?$/m)?.[1]?.trim() ?? '';
    const why = block.match(/\*\*Why:\*\*\s*(.+?)(?:\s\s)?$/m)?.[1]?.trim() ?? '';
    const status = block.match(/\*\*Status:\*\*\s*(.+?)(?:\s\s)?$/m)?.[1]?.trim() ?? 'active';
    const scope = block.match(/\*\*Scope:\*\*\s*(.+?)$/m)?.[1]?.trim() ?? 'mission';

    return {
      id,
      timestamp,
      role,
      type: type as DecisionEntry['type'],
      summary,
      why,
      status: status as DecisionEntry['status'],
      scope: scope as DecisionEntry['scope'],
    };
  } catch {
    return null;
  }
}

export async function searchLedger(
  filePath: string,
  query: string,
): Promise<Result<DecisionEntry[], LedgerError>> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return ok([]);
    }
    return err(new LedgerError('IO_ERROR', `Failed to read ledger: ${msg}`));
  }

  const blocks = content.split(/(?=^### )/m).filter((b) => b.trim().length > 0);
  const lowerQuery = query.toLowerCase();
  const results: DecisionEntry[] = [];

  for (const block of blocks) {
    if (!block.toLowerCase().includes(lowerQuery)) continue;
    const entry = parseBlock(block);
    if (entry) {
      results.push(entry);
    }
  }

  return ok(results);
}
