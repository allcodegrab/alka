import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk } from '@forge/protocol';
import { appendToJournal, updateWorking, clearWorking, appendToConventions } from './writer.js';
import { readMemoryFiles } from './reader.js';

describe('memory writer', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'memory-write-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('appendToJournal', () => {
    it('should create journal file and append entry with timestamp', async () => {
      const result = await appendToJournal(tmpDir, 'First entry');
      expect(isOk(result)).toBe(true);

      const content = await readFile(join(tmpDir, '.claude', 'memory', 'journal.md'), 'utf-8');
      expect(content).toContain('## ');
      expect(content).toContain('First entry');
    });

    it('should append multiple entries', async () => {
      await appendToJournal(tmpDir, 'Entry one');
      await appendToJournal(tmpDir, 'Entry two');

      const content = await readFile(join(tmpDir, '.claude', 'memory', 'journal.md'), 'utf-8');
      expect(content).toContain('Entry one');
      expect(content).toContain('Entry two');
      // Should have two timestamp headers
      const headers = content.match(/^## /gm);
      expect(headers).toHaveLength(2);
    });
  });

  describe('updateWorking', () => {
    it('should create and write working memory', async () => {
      const result = await updateWorking(tmpDir, 'Current context');
      expect(isOk(result)).toBe(true);

      const content = await readFile(join(tmpDir, '.claude', 'memory', 'working.md'), 'utf-8');
      expect(content).toBe('Current context');
    });

    it('should overwrite existing content', async () => {
      await updateWorking(tmpDir, 'Version 1');
      await updateWorking(tmpDir, 'Version 2');

      const content = await readFile(join(tmpDir, '.claude', 'memory', 'working.md'), 'utf-8');
      expect(content).toBe('Version 2');
    });
  });

  describe('clearWorking', () => {
    it('should clear working memory', async () => {
      await updateWorking(tmpDir, 'Some content');
      const result = await clearWorking(tmpDir);
      expect(isOk(result)).toBe(true);

      const content = await readFile(join(tmpDir, '.claude', 'memory', 'working.md'), 'utf-8');
      expect(content).toBe('');
    });
  });

  describe('appendToConventions', () => {
    it('should create conventions file', async () => {
      const result = await appendToConventions(tmpDir, 'Use kebab-case for files');
      expect(isOk(result)).toBe(true);

      const content = await readFile(join(tmpDir, '.claude', 'memory', 'conventions.md'), 'utf-8');
      expect(content).toContain('Use kebab-case for files');
    });

    it('should append with separator', async () => {
      await appendToConventions(tmpDir, 'Convention one');
      await appendToConventions(tmpDir, 'Convention two');

      const content = await readFile(join(tmpDir, '.claude', 'memory', 'conventions.md'), 'utf-8');
      expect(content).toContain('Convention one');
      expect(content).toContain('---');
      expect(content).toContain('Convention two');
    });
  });

  describe('read/write lifecycle', () => {
    it('should round-trip through reader and writer', async () => {
      await updateWorking(tmpDir, 'Working state');
      await appendToJournal(tmpDir, 'Journal entry');
      await appendToConventions(tmpDir, 'A convention');

      const result = await readMemoryFiles(tmpDir);
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value.working).toBe('Working state');
      expect(result.value.journal).toContain('Journal entry');
      expect(result.value.conventions).toContain('A convention');
      expect(result.value.playbooks).toBe('');
    });
  });
});
