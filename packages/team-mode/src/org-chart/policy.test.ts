import { describe, it, expect } from 'vitest';
import type { RoleDefinition, OrgChartPolicy } from '@forge/protocol';
import { applyPolicies, globMatch } from './policy.js';

function makeRole(overrides: Partial<RoleDefinition> = {}): RoleDefinition {
  return {
    id: 'test-role',
    title: 'Test Role',
    tier: 'build',
    reportsTo: 'cto',
    model: 'claude-sonnet-4-6',
    tools: ['Read', 'Edit', 'Write'],
    skills: ['testing-discipline'],
    isolation: 'none',
    maxTurns: 30,
    color: 'green',
    ...overrides,
  } as RoleDefinition;
}

describe('globMatch', () => {
  it('should match exact strings', () => {
    expect(globMatch('pr-reviewer', 'pr-reviewer')).toBe(true);
    expect(globMatch('pr-reviewer', 'security-verifier')).toBe(false);
  });

  it('should match wildcard prefix', () => {
    expect(globMatch('*-verifier', 'security-verifier')).toBe(true);
    expect(globMatch('*-verifier', 'tests-verifier')).toBe(true);
    expect(globMatch('*-verifier', 'pr-reviewer')).toBe(false);
  });

  it('should match wildcard suffix', () => {
    expect(globMatch('impl-*', 'impl-a')).toBe(true);
    expect(globMatch('impl-*', 'impl-b')).toBe(true);
    expect(globMatch('impl-*', 'architect')).toBe(false);
  });

  it('should match wildcard in the middle', () => {
    expect(globMatch('a-*-b', 'a-middle-b')).toBe(true);
    expect(globMatch('a-*-b', 'a-b')).toBe(false);
  });

  it('should handle * matching everything', () => {
    expect(globMatch('*', 'anything')).toBe(true);
  });
});

describe('applyPolicies', () => {
  it('should apply disallowedTools policy to matching roles', () => {
    const role = makeRole({ id: 'security-verifier' } as Partial<RoleDefinition>);
    const policies: OrgChartPolicy[] = [
      {
        id: 'verifier-must-be-read-only',
        appliesTo: ['*-verifier'],
        rule: 'disallowedTools: [Edit, Write, Bash]',
      },
    ];

    const result = applyPolicies(role, policies);
    expect(result.disallowedTools).toEqual(['Edit', 'Write', 'Bash']);
  });

  it('should apply model policy to matching roles', () => {
    const role = makeRole({ id: 'pr-reviewer' } as Partial<RoleDefinition>);
    const policies: OrgChartPolicy[] = [
      {
        id: 'pr-review-uses-gemini',
        appliesTo: ['pr-reviewer'],
        rule: 'model: gemini-2-5-pro',
      },
    ];

    const result = applyPolicies(role, policies);
    expect(result.model).toBe('gemini-2-5-pro');
  });

  it('should not apply policy to non-matching roles', () => {
    const role = makeRole({ id: 'architect' } as Partial<RoleDefinition>);
    const policies: OrgChartPolicy[] = [
      {
        id: 'verifier-must-be-read-only',
        appliesTo: ['*-verifier'],
        rule: 'disallowedTools: [Edit, Write, Bash]',
      },
    ];

    const result = applyPolicies(role, policies);
    expect(result.disallowedTools).toBeUndefined();
  });

  it('should apply multiple matching policies in order', () => {
    const role = makeRole({ id: 'pr-reviewer' } as Partial<RoleDefinition>);
    const policies: OrgChartPolicy[] = [
      {
        id: 'verifier-must-be-read-only',
        appliesTo: ['*-verifier', 'pr-reviewer'],
        rule: 'disallowedTools: [Edit, Write, Bash]',
      },
      {
        id: 'pr-review-uses-gemini',
        appliesTo: ['pr-reviewer'],
        rule: 'model: gemini-2-5-pro',
      },
    ];

    const result = applyPolicies(role, policies);
    expect(result.disallowedTools).toEqual(['Edit', 'Write', 'Bash']);
    expect(result.model).toBe('gemini-2-5-pro');
  });

  it('should handle empty policies array', () => {
    const role = makeRole();
    const result = applyPolicies(role, []);
    expect(result).toEqual(role);
  });
});
