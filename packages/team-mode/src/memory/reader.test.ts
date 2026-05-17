import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk } from '@forge/protocol';
import { readMemoryFiles } from './reader.js';

describe('readMemoryFiles', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'memory-read-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should return empty strings when no memory files exist', async () => {
    const result = await readMemoryFiles(tmpDir);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.working).toBe('');
    expect(result.value.journal).toBe('');
    expect(result.value.conventions).toBe('');
    expect(result.value.playbooks).toBe('');
  });

  it('should read existing memory files', async () => {
    const memDir = join(tmpDir, '.claude', 'memory');
    await mkdir(memDir, { recursive: true });
    await writeFile(join(memDir, 'working.md'), 'Current task info', 'utf-8');
    await writeFile(join(memDir, 'journal.md'), 'Journal entries', 'utf-8');
    await writeFile(join(memDir, 'conventions.md'), 'Code conventions', 'utf-8');
    await writeFile(join(memDir, 'playbooks.md'), 'Playbook content', 'utf-8');

    const result = await readMemoryFiles(tmpDir);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.working).toBe('Current task info');
    expect(result.value.journal).toBe('Journal entries');
    expect(result.value.conventions).toBe('Code conventions');
    expect(result.value.playbooks).toBe('Playbook content');
  });

  it('should return empty string for missing files and content for existing ones', async () => {
    const memDir = join(tmpDir, '.claude', 'memory');
    await mkdir(memDir, { recursive: true });
    await writeFile(join(memDir, 'working.md'), 'Only working', 'utf-8');

    const result = await readMemoryFiles(tmpDir);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.working).toBe('Only working');
    expect(result.value.journal).toBe('');
    expect(result.value.conventions).toBe('');
    expect(result.value.playbooks).toBe('');
  });
});
