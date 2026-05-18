import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { loadDashboardState } from './state.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = join(tmpdir(), `dashboard-test-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('loadDashboardState', () => {
  it('returns empty state when no missions exist', async () => {
    const state = await loadDashboardState(tempDir);
    expect(state.missionId).toBeNull();
    expect(state.roles).toHaveLength(0);
    expect(state.inbox).toHaveLength(0);
  });

  it('loads active mission from dashboard.json', async () => {
    const missionDir = join(tempDir, '.claude', 'missions', '2026-05-18-test');
    await mkdir(missionDir, { recursive: true });
    await writeFile(
      join(missionDir, 'dashboard.json'),
      JSON.stringify({
        name: 'Test Mission',
        mode: 'standard',
        status: 'active',
        totalCostUsd: 1.5,
        slicesTotal: 4,
        slicesCompleted: 2,
        roles: [{ roleId: 'impl-a', status: 'running', costUsd: 0.5 }],
      }),
    );

    const state = await loadDashboardState(tempDir);
    expect(state.missionId).toBe('2026-05-18-test');
    expect(state.missionName).toBe('Test Mission');
    expect(state.status).toBe('active');
    expect(state.totalCostUsd).toBe(1.5);
    expect(state.roles).toHaveLength(1);
  });

  it('loads inbox items sorted by severity', async () => {
    const inboxDir = join(tempDir, '.forge', 'inbox');
    await mkdir(inboxDir, { recursive: true });

    await writeFile(
      join(inboxDir, 'item-1.json'),
      JSON.stringify({ id: 'item-1', severity: 'low', summary: 'Low item', status: 'pending' }),
    );
    await writeFile(
      join(inboxDir, 'item-2.json'),
      JSON.stringify({
        id: 'item-2',
        severity: 'high',
        summary: 'High item',
        status: 'pending',
      }),
    );

    const state = await loadDashboardState(tempDir);
    expect(state.inbox).toHaveLength(2);
    expect(state.inbox[0]!.severity).toBe('high');
    expect(state.inbox[1]!.severity).toBe('low');
  });

  it('handles missing inbox directory gracefully', async () => {
    const state = await loadDashboardState(tempDir);
    expect(state.inbox).toHaveLength(0);
  });
});
