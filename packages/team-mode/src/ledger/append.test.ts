import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk } from '@forge/protocol';
import type { DecisionEntry } from '@forge/protocol';
import { appendDecisionToLedger } from './append.js';
import { searchLedger } from './search.js';

function makeEntry(overrides: Partial<DecisionEntry> = {}): DecisionEntry {
  return {
    id: overrides.id ?? 'dec-001',
    timestamp: overrides.timestamp ?? '2025-06-01T12:00:00.000Z',
    role: overrides.role ?? 'architect',
    type: overrides.type ?? 'architecture',
    summary: overrides.summary ?? 'Use REST API',
    why: overrides.why ?? 'Simpler for this use case',
    status: overrides.status ?? 'active',
    scope: overrides.scope ?? 'mission',
  };
}

describe('decision ledger', () => {
  let tmpDir: string;
  let ledgerPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'ledger-test-'));
    ledgerPath = join(tmpDir, 'decisions.md');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should append a decision entry to a new file', async () => {
    const entry = makeEntry();
    const result = await appendDecisionToLedger(ledgerPath, entry);
    expect(isOk(result)).toBe(true);

    const content = await readFile(ledgerPath, 'utf-8');
    expect(content).toContain('### dec-001');
    expect(content).toContain('**Role:** architect');
    expect(content).toContain('**Type:** architecture');
    expect(content).toContain('**Summary:** Use REST API');
    expect(content).toContain('**Why:** Simpler for this use case');
    expect(content).toContain('**Status:** active');
    expect(content).toContain('**Scope:** mission');
  });

  it('should append multiple entries', async () => {
    const entry1 = makeEntry({ id: 'dec-001', summary: 'First decision' });
    const entry2 = makeEntry({ id: 'dec-002', summary: 'Second decision' });

    await appendDecisionToLedger(ledgerPath, entry1);
    await appendDecisionToLedger(ledgerPath, entry2);

    const content = await readFile(ledgerPath, 'utf-8');
    expect(content).toContain('### dec-001');
    expect(content).toContain('First decision');
    expect(content).toContain('### dec-002');
    expect(content).toContain('Second decision');
  });

  it('should format entries with trailing whitespace for markdown line breaks', async () => {
    const entry = makeEntry();
    await appendDecisionToLedger(ledgerPath, entry);

    const content = await readFile(ledgerPath, 'utf-8');
    expect(content).toContain('**Role:** architect  \n');
    expect(content).toContain('**Type:** architecture  \n');
  });

  describe('searchLedger', () => {
    it('should find entries matching query', async () => {
      const entry1 = makeEntry({ id: 'dec-001', summary: 'Use REST API' });
      const entry2 = makeEntry({ id: 'dec-002', summary: 'Use GraphQL' });

      await appendDecisionToLedger(ledgerPath, entry1);
      await appendDecisionToLedger(ledgerPath, entry2);

      const result = await searchLedger(ledgerPath, 'REST');
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]!.id).toBe('dec-001');
    });

    it('should return empty array for no matches', async () => {
      const entry = makeEntry();
      await appendDecisionToLedger(ledgerPath, entry);

      const result = await searchLedger(ledgerPath, 'nonexistent');
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual([]);
    });

    it('should return empty array for nonexistent file', async () => {
      const result = await searchLedger(join(tmpDir, 'nope.md'), 'anything');
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const entry = makeEntry({ summary: 'Use REST API' });
      await appendDecisionToLedger(ledgerPath, entry);

      const result = await searchLedger(ledgerPath, 'rest');
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
    });
  });
});
