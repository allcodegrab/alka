import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk } from '@forge/protocol';
import { emitStandup } from './emitter.js';
import { resetAll, canEmit, recordEmission } from './rate-limiter.js';

function makeDashboard(missionId: string, roles: Array<Record<string, unknown>> = []) {
  return {
    missionId,
    name: 'Test Mission',
    mode: 'standard',
    status: 'active',
    startedAt: '2025-06-01T00:00:00.000Z',
    roles,
    totalCostUsd: 0,
    slicesTotal: 5,
    slicesCompleted: 0,
  };
}

describe('standup emitter', () => {
  let tmpDir: string;
  const missionId = 'test-mission';

  beforeEach(async () => {
    vi.useFakeTimers();
    resetAll();
    tmpDir = await mkdtemp(join(tmpdir(), 'standup-test-'));
    const missionDir = join(tmpDir, '.claude', 'missions', missionId);
    await mkdir(missionDir, { recursive: true });
    await writeFile(join(missionDir, 'dashboard.json'), JSON.stringify(makeDashboard(missionId)));
  });

  afterEach(async () => {
    vi.useRealTimers();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should update dashboard with role status on first emission', async () => {
    const result = await emitStandup(tmpDir, missionId, 'architect', 'running', 'Designing API');
    expect(isOk(result)).toBe(true);

    const dashboard = JSON.parse(
      await readFile(join(tmpDir, '.claude', 'missions', missionId, 'dashboard.json'), 'utf-8'),
    );
    expect(dashboard.roles).toHaveLength(1);
    expect(dashboard.roles[0].roleId).toBe('architect');
    expect(dashboard.roles[0].status).toBe('running');
    expect(dashboard.roles[0].currentAction).toBe('Designing API');
  });

  it('should update existing role entry', async () => {
    const dashPath = join(tmpDir, '.claude', 'missions', missionId, 'dashboard.json');
    const existing = makeDashboard(missionId, [
      {
        roleId: 'architect',
        status: 'idle',
        costUsd: 1.5,
        lastUpdated: '2025-06-01T00:00:00.000Z',
      },
    ]);
    await writeFile(dashPath, JSON.stringify(existing));

    const result = await emitStandup(tmpDir, missionId, 'architect', 'running', 'Writing code');
    expect(isOk(result)).toBe(true);

    const dashboard = JSON.parse(await readFile(dashPath, 'utf-8'));
    expect(dashboard.roles).toHaveLength(1);
    expect(dashboard.roles[0].status).toBe('running');
    expect(dashboard.roles[0].currentAction).toBe('Writing code');
    expect(dashboard.roles[0].costUsd).toBe(1.5);
  });

  it('should silently skip when rate-limited', async () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    const result1 = await emitStandup(tmpDir, missionId, 'architect', 'running', 'Task 1');
    expect(isOk(result1)).toBe(true);

    vi.setSystemTime(new Date('2025-06-01T12:05:00.000Z'));
    const result2 = await emitStandup(tmpDir, missionId, 'architect', 'running', 'Task 2');
    expect(isOk(result2)).toBe(true);

    // Dashboard should still show Task 1 since the second emission was skipped
    const dashboard = JSON.parse(
      await readFile(join(tmpDir, '.claude', 'missions', missionId, 'dashboard.json'), 'utf-8'),
    );
    expect(dashboard.roles[0].currentAction).toBe('Task 1');
  });

  it('should emit after rate limit window passes', async () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    await emitStandup(tmpDir, missionId, 'architect', 'running', 'Task 1');

    vi.setSystemTime(new Date('2025-06-01T12:16:00.000Z'));
    await emitStandup(tmpDir, missionId, 'architect', 'running', 'Task 2');

    const dashboard = JSON.parse(
      await readFile(join(tmpDir, '.claude', 'missions', missionId, 'dashboard.json'), 'utf-8'),
    );
    expect(dashboard.roles[0].currentAction).toBe('Task 2');
  });

  it('should return IO_ERROR when dashboard is missing', async () => {
    const result = await emitStandup(tmpDir, 'nonexistent', 'architect', 'running', 'Task');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('IO_ERROR');
  });

  it('should handle multiple roles independently', async () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    await emitStandup(tmpDir, missionId, 'architect', 'running', 'Designing');
    await emitStandup(tmpDir, missionId, 'developer', 'planning', 'Reading specs');

    const dashboard = JSON.parse(
      await readFile(join(tmpDir, '.claude', 'missions', missionId, 'dashboard.json'), 'utf-8'),
    );
    expect(dashboard.roles).toHaveLength(2);
    expect(dashboard.roles.find((r: { roleId: string }) => r.roleId === 'architect').status).toBe(
      'running',
    );
    expect(dashboard.roles.find((r: { roleId: string }) => r.roleId === 'developer').status).toBe(
      'planning',
    );
  });

  it('should rate-limit roles independently', async () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    await emitStandup(tmpDir, missionId, 'architect', 'running', 'Task A');

    vi.setSystemTime(new Date('2025-06-01T12:05:00.000Z'));
    // architect is rate-limited, but developer is not
    await emitStandup(tmpDir, missionId, 'developer', 'running', 'Task B');

    const dashboard = JSON.parse(
      await readFile(join(tmpDir, '.claude', 'missions', missionId, 'dashboard.json'), 'utf-8'),
    );
    expect(dashboard.roles).toHaveLength(2);
  });

  it('should include eta when provided', async () => {
    await emitStandup(tmpDir, missionId, 'architect', 'running', 'Building', '30 minutes');

    const dashboard = JSON.parse(
      await readFile(join(tmpDir, '.claude', 'missions', missionId, 'dashboard.json'), 'utf-8'),
    );
    expect(dashboard.roles[0].eta).toBe('30 minutes');
  });
});

describe('rate-limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAll();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow first emission', () => {
    expect(canEmit('test-role')).toBe(true);
  });

  it('should block emission within interval', () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    recordEmission('test-role');

    vi.setSystemTime(new Date('2025-06-01T12:10:00.000Z'));
    expect(canEmit('test-role')).toBe(false);
  });

  it('should allow emission after interval', () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    recordEmission('test-role');

    vi.setSystemTime(new Date('2025-06-01T12:15:00.000Z'));
    expect(canEmit('test-role')).toBe(true);
  });

  it('should support custom interval', () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    recordEmission('test-role');

    vi.setSystemTime(new Date('2025-06-01T12:02:00.000Z'));
    expect(canEmit('test-role', 60_000)).toBe(true);
  });

  it('should reset all emissions', () => {
    recordEmission('role-a');
    recordEmission('role-b');
    resetAll();
    expect(canEmit('role-a')).toBe(true);
    expect(canEmit('role-b')).toBe(true);
  });
});
