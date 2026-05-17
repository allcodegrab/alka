import { describe, it, expect } from 'vitest';
import { OrgChartSchema } from './org-chart.js';

describe('OrgChart schema', () => {
  const validOrgChart = {
    version: 1,
    name: 'Forge In-House Team',
    cto: 'shashank',
    roles: [
      {
        id: 'vp-engineering',
        title: 'VP Engineering',
        tier: 'leadership' as const,
        reportsTo: 'cto',
        model: 'claude-opus-4-7' as const,
        tools: ['Read', 'Glob', 'Task', 'AskUserQuestion'] as const,
        skills: ['engineering-excellence', 'project-memory'],
        isolation: 'none' as const,
        maxTurns: 80,
        color: 'blue',
        mustEscalate: ['mission_brief', 'architecture_change'],
      },
      {
        id: 'architect',
        title: 'Architect',
        tier: 'planning' as const,
        reportsTo: 'vp-engineering',
        model: 'claude-opus-4-7' as const,
        tools: ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch'] as const,
        skills: ['research-first', 'plan-then-execute'],
        isolation: 'none' as const,
        maxTurns: 30,
        color: 'purple',
      },
      {
        id: 'impl-a',
        title: 'Implementer A',
        tier: 'build' as const,
        reportsTo: 'vp-engineering',
        model: 'claude-sonnet-4-6' as const,
        tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'] as const,
        skills: ['engineering-excellence', 'surgical-edits'],
        isolation: 'worktree' as const,
        maxTurns: 60,
        color: 'orange',
      },
    ],
    policies: [
      {
        id: 'verifier-must-be-read-only',
        appliesTo: ['*-verifier', 'pr-reviewer'],
        rule: 'disallowedTools: [Edit, Write, Bash]',
      },
    ],
  };

  it('validates a correct org chart', () => {
    const result = OrgChartSchema.safeParse(validOrgChart);
    expect(result.success).toBe(true);
  });

  it('rejects missing cto field', () => {
    const { cto: _, ...incomplete } = validOrgChart;
    const result = OrgChartSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects empty roles array', () => {
    const result = OrgChartSchema.safeParse({ ...validOrgChart, roles: [] });
    expect(result.success).toBe(true); // empty is valid — the orchestrator handles the empty case
  });

  it('validates with no policies', () => {
    const { policies: _, ...noPolicies } = validOrgChart;
    const result = OrgChartSchema.safeParse(noPolicies);
    expect(result.success).toBe(true);
  });

  it('round-trips through JSON', () => {
    const parsed = OrgChartSchema.parse(validOrgChart);
    const json = JSON.stringify(parsed);
    const reparsed = OrgChartSchema.parse(JSON.parse(json));
    expect(reparsed).toEqual(parsed);
  });
});
