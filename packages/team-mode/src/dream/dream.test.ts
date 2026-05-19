import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDreamWindow } from './scheduler.js';
import { isDreamSafe } from './guard.js';
import { runDreamCycle } from './operations.js';

const dreamConfig = { weekday: '02:00-06:00', weekend: '01:00-07:00' };

describe('isDreamWindow', () => {
  it('should return true when within the weekday window', () => {
    // Wednesday at 03:00
    const wednesday3am = new Date('2026-01-07T03:00:00');
    expect(isDreamWindow(dreamConfig, wednesday3am)).toBe(true);
  });

  it('should return false when outside the weekday window', () => {
    // Wednesday at 10:00
    const wednesday10am = new Date('2026-01-07T10:00:00');
    expect(isDreamWindow(dreamConfig, wednesday10am)).toBe(false);
  });

  it('should use weekend window on Saturday', () => {
    // Saturday at 01:30 — within weekend window 01:00-07:00
    const saturday130am = new Date('2026-01-10T01:30:00');
    expect(isDreamWindow(dreamConfig, saturday130am)).toBe(true);
  });

  it('should return false on weekend outside window', () => {
    // Saturday at 08:00
    const saturday8am = new Date('2026-01-10T08:00:00');
    expect(isDreamWindow(dreamConfig, saturday8am)).toBe(false);
  });
});

describe('isDreamSafe', () => {
  it('should return true for .claude/ paths', () => {
    expect(isDreamSafe('.claude/dreams/2026-01-01.md')).toBe(true);
  });

  it('should return true for .forge/ paths', () => {
    expect(isDreamSafe('.forge/config.yaml')).toBe(true);
  });

  it('should return false for packages/ paths', () => {
    expect(isDreamSafe('packages/team-mode/src/index.ts')).toBe(false);
  });

  it('should return false for src/ paths', () => {
    expect(isDreamSafe('src/main.ts')).toBe(false);
  });

  it('should return false for codeoss/ paths', () => {
    expect(isDreamSafe('codeoss/build.ts')).toBe(false);
  });
});

describe('runDreamCycle', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dream-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should produce a dream artifact file', async () => {
    const result = await runDreamCycle(tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dreamPath = join(tmpDir, '.claude', 'dreams', `${dateStr}.md`);
    const content = await readFile(dreamPath, 'utf-8');
    expect(content).toContain('# Dream Cycle');
  });

  it('should have correct date format in dream summary', async () => {
    const result = await runDreamCycle(tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dreamPath = join(tmpDir, '.claude', 'dreams', `${dateStr}.md`);
    const content = await readFile(dreamPath, 'utf-8');
    expect(content).toMatch(/# Dream Cycle — \d{4}-\d{2}-\d{2}/);
  });

  it('should include KG rebuild operation in report', async () => {
    const result = await runDreamCycle(tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const kgOp = result.value.operations.find((op) => op.name === 'kg-rebuild');
    expect(kgOp).toBeDefined();
    expect(kgOp?.status).toBe('success');
  });
});
