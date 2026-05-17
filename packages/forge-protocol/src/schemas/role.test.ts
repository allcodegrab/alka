import { describe, it, expect } from 'vitest';
import { RoleDefinitionSchema, RoleTier, ModelId, ToolName } from './role.js';

describe('RoleDefinition schema', () => {
  const validRole = {
    id: 'impl-a',
    title: 'Implementer A',
    tier: 'build' as const,
    reportsTo: 'vp-engineering',
    model: 'claude-sonnet-4-6' as const,
    tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'] as const,
    skills: ['engineering-excellence', 'surgical-edits', 'testing-discipline'],
    isolation: 'worktree' as const,
    maxTurns: 60,
    color: 'orange',
  };

  it('validates a correct role definition', () => {
    const result = RoleDefinitionSchema.safeParse(validRole);
    expect(result.success).toBe(true);
  });

  it('rejects invalid tier', () => {
    const result = RoleDefinitionSchema.safeParse({ ...validRole, tier: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid model', () => {
    const result = RoleDefinitionSchema.safeParse({ ...validRole, model: 'gpt-3' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid tool', () => {
    const result = RoleDefinitionSchema.safeParse({
      ...validRole,
      tools: ['Read', 'InvalidTool'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative maxTurns', () => {
    const result = RoleDefinitionSchema.safeParse({ ...validRole, maxTurns: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = RoleDefinitionSchema.safeParse({
      ...validRole,
      disallowedTools: ['Edit', 'Write'],
      canApprove: ['slice_completion'],
      mustEscalate: ['architecture_change'],
      produces: ['architecture.md'],
    });
    expect(result.success).toBe(true);
  });
});

describe('RoleTier enum', () => {
  it('accepts all valid tiers', () => {
    const tiers = ['leadership', 'planning', 'build', 'verify', 'release', 'knowledge'];
    for (const tier of tiers) {
      expect(RoleTier.safeParse(tier).success).toBe(true);
    }
  });
});

describe('ModelId enum', () => {
  it('accepts all valid models', () => {
    const models = [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
      'gemini-2-5-pro',
      'gpt-5-4',
    ];
    for (const model of models) {
      expect(ModelId.safeParse(model).success).toBe(true);
    }
  });
});

describe('ToolName enum', () => {
  it('accepts Read', () => {
    expect(ToolName.safeParse('Read').success).toBe(true);
  });

  it('rejects unknown tool', () => {
    expect(ToolName.safeParse('Hack').success).toBe(false);
  });
});
