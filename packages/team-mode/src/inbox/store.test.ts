import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk, isErr } from '@forge/protocol';
import type { InboxItemId } from '@forge/protocol';
import { createInboxItem } from './create.js';
import { writeInboxItem, readInboxItem, listInboxItems, deleteInboxItem } from './store.js';

function makeItem(
  overrides: { severity?: 'low' | 'medium' | 'high' | 'critical'; createdAt?: string } = {},
) {
  const item = createInboxItem({
    missionId: 'test-mission',
    severity: overrides.severity ?? 'medium',
    type: 'architecture_change',
    proposer: 'architect',
    summary: 'Test item',
    what: 'Change something',
    why: 'Because reasons',
    recommendation: 'Do it',
    evidence: ['evidence-1'],
    decisionOptions: [{ id: 'opt-1', label: 'Yes', consequence: 'Good things' }],
  });
  if (overrides.createdAt) {
    return { ...item, createdAt: overrides.createdAt };
  }
  return item;
}

describe('inbox store', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'inbox-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should write and read an inbox item', async () => {
    const item = makeItem();
    const writeResult = await writeInboxItem(tmpDir, item);
    expect(isOk(writeResult)).toBe(true);

    const readResult = await readInboxItem(tmpDir, item.id);
    expect(isOk(readResult)).toBe(true);
    if (!readResult.ok) return;
    expect(readResult.value.id).toBe(item.id);
    expect(readResult.value.summary).toBe('Test item');
    expect(readResult.value.status).toBe('pending');
  });

  it('should return NOT_FOUND for nonexistent item', async () => {
    const result = await readInboxItem(tmpDir, 'nonexistent' as InboxItemId);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('should list items sorted by severity then createdAt', async () => {
    const low = makeItem({ severity: 'low', createdAt: '2025-01-01T00:00:00.000Z' });
    const critical = makeItem({ severity: 'critical', createdAt: '2025-01-03T00:00:00.000Z' });
    const highOld = makeItem({ severity: 'high', createdAt: '2025-01-01T00:00:00.000Z' });
    const highNew = makeItem({ severity: 'high', createdAt: '2025-01-02T00:00:00.000Z' });

    await writeInboxItem(tmpDir, low);
    await writeInboxItem(tmpDir, critical);
    await writeInboxItem(tmpDir, highOld);
    await writeInboxItem(tmpDir, highNew);

    const result = await listInboxItems(tmpDir);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(4);
    expect(result.value[0]!.severity).toBe('critical');
    expect(result.value[1]!.severity).toBe('high');
    expect(result.value[1]!.createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(result.value[2]!.severity).toBe('high');
    expect(result.value[2]!.createdAt).toBe('2025-01-02T00:00:00.000Z');
    expect(result.value[3]!.severity).toBe('low');
  });

  it('should return empty array when no inbox directory exists', async () => {
    const result = await listInboxItems(tmpDir);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([]);
  });

  it('should delete an inbox item', async () => {
    const item = makeItem();
    await writeInboxItem(tmpDir, item);

    const deleteResult = await deleteInboxItem(tmpDir, item.id);
    expect(isOk(deleteResult)).toBe(true);

    const readResult = await readInboxItem(tmpDir, item.id);
    expect(isErr(readResult)).toBe(true);
    if (readResult.ok) return;
    expect(readResult.error.code).toBe('NOT_FOUND');
  });

  it('should return NOT_FOUND when deleting nonexistent item', async () => {
    const result = await deleteInboxItem(tmpDir, 'nonexistent' as InboxItemId);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });
});
