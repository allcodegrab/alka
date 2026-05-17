import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk, isErr } from '@forge/protocol';
import type { DecisionEntry } from '@forge/protocol';
import { createMission } from './create.js';
import { appendDecision, readDashboard } from './io.js';
import { closeMission } from './close.js';

describe('closeMission', () => {
  let tmpDir: string;
  let missionId: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mission-close-test-'));
    const result = await createMission(tmpDir, 'Close Test', 'standard', 'Testing close');
    if (!result.ok) throw new Error('Failed to create test mission');
    missionId = result.value;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should close a mission and update dashboard status', async () => {
    const result = await closeMission(tmpDir, missionId);
    expect(isOk(result)).toBe(true);

    const dashResult = await readDashboard(tmpDir, missionId);
    expect(isOk(dashResult)).toBe(true);
    if (!dashResult.ok) return;
    expect(dashResult.value.status).toBe('completed');
    expect(dashResult.value.completedAt).toBeDefined();
  });

  it('should update status.md to completed', async () => {
    await closeMission(tmpDir, missionId);

    const statusPath = join(tmpDir, '.claude', 'missions', missionId, 'status.md');
    const status = await readFile(statusPath, 'utf-8');
    expect(status).toContain('Mission completed');
  });

  it('should merge decisions into project-level decisions.md', async () => {
    const entry: DecisionEntry = {
      id: 'dec-001',
      timestamp: new Date().toISOString(),
      role: 'architect',
      type: 'architecture',
      summary: 'Use microservices',
      why: 'Scalability',
      status: 'active',
      scope: 'project',
    };

    await appendDecision(tmpDir, missionId, entry);
    await closeMission(tmpDir, missionId);

    const projectDecisions = await readFile(
      join(tmpDir, '.claude', 'memory', 'decisions.md'),
      'utf-8',
    );
    expect(projectDecisions).toContain('### dec-001');
    expect(projectDecisions).toContain('Use microservices');
  });

  it('should return INVALID_STATE if mission is already completed', async () => {
    await closeMission(tmpDir, missionId);
    const result = await closeMission(tmpDir, missionId);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_STATE');
  });

  it('should handle missions with no decisions gracefully', async () => {
    const result = await closeMission(tmpDir, missionId);
    expect(isOk(result)).toBe(true);

    // Project-level decisions file should not be created for empty decisions
    const dashResult = await readDashboard(tmpDir, missionId);
    expect(isOk(dashResult)).toBe(true);
    if (!dashResult.ok) return;
    expect(dashResult.value.status).toBe('completed');
  });
});
