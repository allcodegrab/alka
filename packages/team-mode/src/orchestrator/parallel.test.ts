import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, isOk } from '@forge/protocol';
import type { AgentRun, RoleDefinition, OrgChart } from '@forge/protocol';
import type { SliceAssignment, SliceResult } from './types.js';

// Mock external dependencies
vi.mock('@forge/agent-runtime', () => ({
  spawnAgent: vi.fn(),
}));

vi.mock('@forge/skill-loader', () => ({
  getSkillsForRole: vi.fn().mockResolvedValue(ok([])),
  formatSkillsForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('../org-chart/parser.js', () => ({
  parseOrgChart: vi.fn(),
}));

vi.mock('../mission/io.js', () => ({
  updateWhiteboard: vi.fn().mockResolvedValue(ok(undefined)),
}));

import { executeSlicesParallel } from './parallel.js';
import { spawnAgent } from '@forge/agent-runtime';
import { parseOrgChart } from '../org-chart/parser.js';

const mockSpawnAgent = vi.mocked(spawnAgent);
const mockParseOrgChart = vi.mocked(parseOrgChart);

function makeRole(id: string): RoleDefinition {
  return {
    id: id as RoleDefinition['id'],
    title: `Role ${id}`,
    tier: 'build',
    reportsTo: 'vp-eng',
    model: 'claude-sonnet-4-6',
    tools: ['Read', 'Edit', 'Write', 'Bash'],
    skills: [],
    isolation: 'worktree',
    maxTurns: 10,
    color: '#000',
  };
}

function makeOrgChart(roleIds: string[]): OrgChart {
  return {
    version: 1,
    name: 'test',
    cto: 'cto',
    roles: roleIds.map(makeRole),
  };
}

function makeSlice(num: number, roleId: string, deps: string[] = []): SliceAssignment {
  return {
    sliceId: `slice-${num}`,
    roleId,
    description: `Slice ${num} description`,
    files: [`src/file${num}.ts`],
    dependencies: deps,
  };
}

function makeAgentRun(roleId: string, status: 'complete' | 'failed' = 'complete'): AgentRun {
  return {
    agentId: `agent-${roleId}-abc12345` as AgentRun['agentId'],
    roleId,
    missionId: 'test-mission',
    model: 'claude-sonnet-4-6',
    status,
    tokensIn: 1000,
    tokensOut: 500,
    costUsd: 0.01,
    turns: 3,
    maxTurns: 10,
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:01:00.000Z',
    error: status === 'failed' ? 'Agent failed' : undefined,
  };
}

describe('executeSlicesParallel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseOrgChart.mockResolvedValue(ok(makeOrgChart(['impl-a', 'impl-b', 'impl-c', 'impl-d'])));
  });

  it('should execute all slices and return results', async () => {
    mockSpawnAgent.mockResolvedValue(ok(makeAgentRun('impl-a')));

    const slices = [makeSlice(1, 'impl-a'), makeSlice(2, 'impl-a')];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      2,
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(2);
    expect(result.value[0]!.status).toBe('complete');
    expect(result.value[1]!.status).toBe('complete');
  });

  it('should respect concurrency limit (4 slices, concurrency=2)', async () => {
    // Track how many agents are running concurrently
    let active = 0;
    let maxActive = 0;

    mockSpawnAgent.mockImplementation(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      // Simulate some async work
      await new Promise((resolve) => setTimeout(resolve, 20));
      active--;
      return ok(makeAgentRun('impl-a'));
    });

    const slices = [
      makeSlice(1, 'impl-a'),
      makeSlice(2, 'impl-b'),
      makeSlice(3, 'impl-c'),
      makeSlice(4, 'impl-d'),
    ];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      2,
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(4);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('should not block other slices when one fails', async () => {
    let callCount = 0;
    mockSpawnAgent.mockImplementation(async () => {
      callCount++;
      if (callCount === 2) {
        return ok(makeAgentRun('impl-b', 'failed'));
      }
      return ok(makeAgentRun('impl-a'));
    });

    const slices = [makeSlice(1, 'impl-a'), makeSlice(2, 'impl-b'), makeSlice(3, 'impl-c')];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      3,
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(3);
    // All three ran - the failure didn't prevent others
    expect(mockSpawnAgent).toHaveBeenCalledTimes(3);
  });

  it('should return all results even with failures', async () => {
    mockSpawnAgent
      .mockResolvedValueOnce(ok(makeAgentRun('impl-a', 'complete')))
      .mockResolvedValueOnce(ok(makeAgentRun('impl-b', 'failed')))
      .mockResolvedValueOnce(ok(makeAgentRun('impl-c', 'complete')));

    const slices = [makeSlice(1, 'impl-a'), makeSlice(2, 'impl-b'), makeSlice(3, 'impl-c')];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      3,
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(3);
    expect(result.value[0]!.status).toBe('complete');
    expect(result.value[1]!.status).toBe('failed');
    expect(result.value[2]!.status).toBe('complete');
  });

  it('should return failed result when role is not found in org chart', async () => {
    const slices = [makeSlice(1, 'nonexistent-role')];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      2,
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.status).toBe('failed');
    expect(result.value[0]!.error).toContain('not found in org chart');
    // spawnAgent should not have been called
    expect(mockSpawnAgent).not.toHaveBeenCalled();
  });

  it('should fail when org chart cannot be loaded', async () => {
    const { OrgChartError } = await import('../org-chart/errors.js');
    mockParseOrgChart.mockResolvedValue({
      ok: false,
      error: new OrgChartError('IO_ERROR', 'File not found'),
    });

    const slices = [makeSlice(1, 'impl-a')];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      2,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('EXECUTION_FAILED');
    expect(result.error.message).toContain('org chart');
  });

  it('should track cost from agent runs', async () => {
    const run = makeAgentRun('impl-a');
    run.costUsd = 0.05;
    mockSpawnAgent.mockResolvedValue(ok(run));

    const slices = [makeSlice(1, 'impl-a')];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      1,
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value[0]!.costUsd).toBe(0.05);
  });

  it('should handle concurrency=1 as serial execution', async () => {
    let active = 0;
    let maxActive = 0;

    mockSpawnAgent.mockImplementation(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
      return ok(makeAgentRun('impl-a'));
    });

    const slices = [makeSlice(1, 'impl-a'), makeSlice(2, 'impl-b'), makeSlice(3, 'impl-c')];

    const result = await executeSlicesParallel(
      '/tmp/project',
      'test-mission',
      slices,
      '/tmp/org-chart.yaml',
      '/tmp/skills',
      1,
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(3);
    expect(maxActive).toBe(1);
  });
});
