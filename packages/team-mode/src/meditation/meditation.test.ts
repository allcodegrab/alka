import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { shouldMeditate } from './trigger.js';
import { validateMeditation } from './schema.js';
import { generateMeditation } from './generator.js';
import type { MeditationMetrics } from './types.js';

describe('shouldMeditate', () => {
  it('should return true for completed missions', () => {
    expect(shouldMeditate('completed', false)).toBe(true);
  });

  it('should return true for failed missions', () => {
    expect(shouldMeditate('failed', false)).toBe(true);
  });

  it('should return false for active missions', () => {
    expect(shouldMeditate('active', false)).toBe(false);
  });

  it('should return true when forced regardless of status', () => {
    expect(shouldMeditate('active', true)).toBe(true);
  });
});

describe('validateMeditation', () => {
  const validMeditation = [
    '## Concrete metrics',
    '- Slices: 5',
    '## Concrete observations',
    '- Completed 4 of 5 slices based on dashboard data',
    '## Proposals',
    '- Reduce retry rate',
    "## What I'm NOT going to do",
    '- Overcomplicate the process',
  ].join('\n');

  it('should pass validation for valid meditation', () => {
    const result = validateMeditation(validMeditation);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when a required section is missing', () => {
    const incomplete = '## Concrete metrics\n- data\n## Proposals\n- one';
    const result = validateMeditation(incomplete);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('Concrete observations'))).toBe(true);
  });

  it('should fail when more than 3 proposals', () => {
    const tooMany = [
      '## Concrete metrics',
      '- data',
      '## Concrete observations',
      '- obs',
      '## Proposals',
      '- one',
      '- two',
      '- three',
      '- four',
      "## What I'm NOT going to do",
      '- nothing',
    ].join('\n');

    const result = validateMeditation(tooMany);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too many proposals'))).toBe(true);
  });
});

describe('generateMeditation', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'meditation-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should produce file at correct path with metrics', async () => {
    const metrics: MeditationMetrics = {
      slicesAssigned: 5,
      slicesCompleted: 4,
      slicesRetried: 1,
      findingsAgainst: 2,
      escalations: 0,
      avgWallTimeMinutes: 15,
      budgetMinutes: 120,
      costUsd: 3.5,
      missionSharePct: 25,
      retries: 1,
    };

    const result = await generateMeditation(tmpDir, 'mission-001', 'dev-lead', metrics);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expectedPath = join(tmpDir, '.claude', 'meditations', 'mission-001', 'dev-lead.md');
    expect(result.value).toBe(expectedPath);

    const content = await readFile(expectedPath, 'utf-8');
    expect(content).toContain('Slices assigned: 5');
    expect(content).toContain('Slices completed: 4');
    expect(content).toContain('Cost: $3.50');
    expect(content).toContain('## Concrete metrics');
  });
});
