import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk, isErr } from '@forge/protocol';
import { createMission } from './create.js';

describe('createMission', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mission-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should create a mission directory with all expected files', async () => {
    const result = await createMission(tmpDir, 'Add Endpoint', 'standard', 'Build a REST endpoint');

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    // Check ID format
    expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}-add-endpoint$/);

    const dir = join(tmpDir, '.claude', 'missions', result.value);

    // Verify all files exist
    const context = await readFile(join(dir, 'context.md'), 'utf-8');
    expect(context).toBe('Build a REST endpoint');

    const whiteboard = await readFile(join(dir, 'whiteboard.md'), 'utf-8');
    expect(whiteboard).toBe('# Mission Whiteboard\n');

    const dashboard = JSON.parse(await readFile(join(dir, 'dashboard.json'), 'utf-8'));
    expect(dashboard.missionId).toBe(result.value);
    expect(dashboard.name).toBe('Add Endpoint');
    expect(dashboard.mode).toBe('standard');
    expect(dashboard.status).toBe('active');
    expect(dashboard.roles).toEqual([]);
    expect(dashboard.totalCostUsd).toBe(0);

    const status = await readFile(join(dir, 'status.md'), 'utf-8');
    expect(status).toContain('Mission started');

    const decisions = await readFile(join(dir, 'decisions.md'), 'utf-8');
    expect(decisions).toBe('# Decisions\n');

    // Verify artifacts directory exists
    await expect(access(join(dir, 'artifacts'))).resolves.toBeUndefined();
  });

  it('should slugify the mission name correctly', async () => {
    const result = await createMission(tmpDir, 'My Cool Feature!!!', 'standard', 'test');

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}-my-cool-feature$/);
  });

  it('should truncate long names to 40 chars in slug', async () => {
    const longName = 'a'.repeat(60);
    const result = await createMission(tmpDir, longName, '24h', 'test');

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    const slug = result.value.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    expect(slug.length).toBeLessThanOrEqual(40);
  });

  it('should return ALREADY_EXISTS if mission directory exists', async () => {
    const r1 = await createMission(tmpDir, 'Duplicate', 'standard', 'first');
    expect(isOk(r1)).toBe(true);

    const r2 = await createMission(tmpDir, 'Duplicate', 'standard', 'second');
    expect(isErr(r2)).toBe(true);
    if (r2.ok) return;
    expect(r2.error.code).toBe('ALREADY_EXISTS');
  });

  it('should support 24h mode', async () => {
    const result = await createMission(tmpDir, 'Urgent Fix', '24h', 'fix it');

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    const dir = join(tmpDir, '.claude', 'missions', result.value);
    const dashboard = JSON.parse(await readFile(join(dir, 'dashboard.json'), 'utf-8'));
    expect(dashboard.mode).toBe('24h');
  });
});
