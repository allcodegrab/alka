import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isOk, isErr, type Result } from '@forge/protocol';
import type { AgentRun } from '@forge/protocol';
import type { AgentSpawnError } from '@forge/agent-runtime';

// Mock external dependencies before importing the module under test
vi.mock('@forge/agent-runtime', () => ({
  spawnAgent: vi.fn(),
}));

vi.mock('../org-chart/parser.js', () => ({
  parseOrgChart: vi.fn(),
}));

vi.mock('@forge/skill-loader', () => ({
  getSkillsForRole: vi.fn(),
  formatSkillsForPrompt: vi.fn(),
}));

import { runVerification } from './fan-out.js';
import { spawnAgent } from '@forge/agent-runtime';
import { parseOrgChart } from '../org-chart/parser.js';
import { getSkillsForRole, formatSkillsForPrompt } from '@forge/skill-loader';
import type { RoleDefinition, OrgChart } from '@forge/protocol';

const mockSpawnAgent = vi.mocked(spawnAgent);
const mockParseOrgChart = vi.mocked(parseOrgChart);
const mockGetSkillsForRole = vi.mocked(getSkillsForRole);
const mockFormatSkillsForPrompt = vi.mocked(formatSkillsForPrompt);

function makeRole(id: string): RoleDefinition {
  return {
    id,
    title: `${id} role`,
    tier: 'verify',
    reportsTo: 'cto',
    model: 'claude-sonnet-4-6',
    tools: ['Read', 'Grep', 'Glob'],
    skills: [],
    isolation: 'none',
    maxTurns: 5,
    color: '#000000',
  } as unknown as RoleDefinition;
}

function makeOrgChart(roleIds: string[]): OrgChart {
  return {
    version: 1,
    name: 'Test Org',
    cto: 'cto',
    roles: roleIds.map(makeRole),
  } as OrgChart;
}

function makeAgentRunWithOutput(
  roleId: string,
  output: string,
  status: 'complete' | 'failed' = 'complete',
): Result<AgentRun & { result: string }, AgentSpawnError> {
  return {
    ok: true as const,
    value: {
      agentId: `agent-${roleId}-12345678` as AgentRun['agentId'],
      roleId,
      missionId: 'mission-1',
      model: 'claude-sonnet-4-6',
      status,
      tokensIn: 100,
      tokensOut: 50,
      costUsd: 0.01,
      turns: 1,
      maxTurns: 5,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      result: output,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSkillsForRole.mockResolvedValue({ ok: true, value: [] });
  mockFormatSkillsForPrompt.mockReturnValue('');
});

describe('runVerification', () => {
  it('should spawn verifiers concurrently and aggregate findings', async () => {
    const orgChart = makeOrgChart(['linter', 'security']);
    mockParseOrgChart.mockResolvedValue({ ok: true, value: orgChart });

    mockSpawnAgent
      .mockResolvedValueOnce(
        makeAgentRunWithOutput(
          'linter',
          '{ "findings": [{ "severity": "low", "location": "a.ts:1", "evidence": "unused var", "suggestion": "remove it" }] }',
        ),
      )
      .mockResolvedValueOnce(
        makeAgentRunWithOutput(
          'security',
          '{ "findings": [{ "severity": "high", "location": "b.ts:5", "evidence": "sql injection", "suggestion": "use params" }] }',
        ),
      );

    const result = await runVerification(
      '/project',
      'mission-1',
      'slice-1',
      'diff content',
      ['linter', 'security'],
      '/org.yaml',
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value.findings).toHaveLength(2);
    expect(result.value.passedVerifiers).toEqual(['linter', 'security']);
    expect(result.value.failedVerifiers).toEqual([]);
    // Should be sorted: high before low
    expect(result.value.findings[0]!.severity).toBe('high');
    expect(result.value.findings[1]!.severity).toBe('low');
  });

  it('should handle verifier spawn failures gracefully', async () => {
    const orgChart = makeOrgChart(['linter', 'security']);
    mockParseOrgChart.mockResolvedValue({ ok: true, value: orgChart });

    mockSpawnAgent
      .mockResolvedValueOnce(makeAgentRunWithOutput('linter', '{ "findings": [] }'))
      .mockResolvedValueOnce({
        ok: false,
        error: new Error('spawn failed'),
      } as never);

    const result = await runVerification(
      '/project',
      'mission-1',
      'slice-1',
      'diff',
      ['linter', 'security'],
      '/org.yaml',
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value.passedVerifiers).toEqual(['linter']);
    expect(result.value.failedVerifiers).toEqual(['security']);
  });

  it('should return IO_ERROR when org chart parsing fails', async () => {
    mockParseOrgChart.mockResolvedValue({
      ok: false,
      error: { message: 'file not found', code: 'IO_ERROR', name: 'OrgChartError' },
    } as never);

    const result = await runVerification(
      '/project',
      'mission-1',
      'slice-1',
      'diff',
      ['linter'],
      '/org.yaml',
    );

    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('IO_ERROR');
  });

  it('should detect blocked state with critical finding', async () => {
    const orgChart = makeOrgChart(['security']);
    mockParseOrgChart.mockResolvedValue({ ok: true, value: orgChart });

    mockSpawnAgent.mockResolvedValueOnce(
      makeAgentRunWithOutput(
        'security',
        '{ "findings": [{ "severity": "critical", "location": "auth.ts:1", "evidence": "no auth", "suggestion": "add auth" }] }',
      ),
    );

    const result = await runVerification(
      '/project',
      'mission-1',
      'slice-1',
      'diff',
      ['security'],
      '/org.yaml',
    );

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.isBlocked).toBe(true);
  });

  it('should return STORM_DETECTED error when storm condition is met', async () => {
    const orgChart = makeOrgChart(['verifier']);
    mockParseOrgChart.mockResolvedValue({ ok: true, value: orgChart });

    const manyHighFindings = Array.from({ length: 6 }, (_, i) => ({
      severity: 'high',
      location: `file.ts:${i}`,
      evidence: `issue ${i}`,
      suggestion: `fix ${i}`,
    }));

    mockSpawnAgent.mockResolvedValueOnce(
      makeAgentRunWithOutput('verifier', JSON.stringify({ findings: manyHighFindings })),
    );

    const result = await runVerification(
      '/project',
      'mission-1',
      'slice-1',
      'diff',
      ['verifier'],
      '/org.yaml',
    );

    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('STORM_DETECTED');
  });
});
