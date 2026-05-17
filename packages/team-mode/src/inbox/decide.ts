import { ok, err, type Result } from '@forge/protocol';
import type { InboxItem } from '@forge/protocol';
import { InboxError } from './errors.js';
import { readInboxItem, writeInboxItem } from './store.js';

export async function approveInboxItem(
  projectRoot: string,
  id: string,
  reason?: string,
): Promise<Result<InboxItem, InboxError>> {
  const result = await readInboxItem(projectRoot, id);
  if (!result.ok) return result;

  const item = result.value;
  if (item.status !== 'pending') {
    return err(
      new InboxError('ALREADY_DECIDED', `Item ${id} has already been decided: ${item.status}`),
    );
  }

  const updated: InboxItem = {
    ...item,
    status: 'approved',
    decidedAt: new Date().toISOString(),
    decision: 'approved',
    decisionReason: reason,
  };

  const writeResult = await writeInboxItem(projectRoot, updated);
  if (!writeResult.ok) return writeResult;

  return ok(updated);
}

export async function rejectInboxItem(
  projectRoot: string,
  id: string,
  reason: string,
): Promise<Result<InboxItem, InboxError>> {
  const result = await readInboxItem(projectRoot, id);
  if (!result.ok) return result;

  const item = result.value;
  if (item.status !== 'pending') {
    return err(
      new InboxError('ALREADY_DECIDED', `Item ${id} has already been decided: ${item.status}`),
    );
  }

  const updated: InboxItem = {
    ...item,
    status: 'rejected',
    decidedAt: new Date().toISOString(),
    decision: 'rejected',
    decisionReason: reason,
  };

  const writeResult = await writeInboxItem(projectRoot, updated);
  if (!writeResult.ok) return writeResult;

  return ok(updated);
}
