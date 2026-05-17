import { describe, it, expect } from 'vitest';
import type { RoleDefinition } from '@forge/protocol';
import type { SpawnOptions } from './spawn.js';

// Note: actual spawn tests require ANTHROPIC_API_KEY and are integration tests.
// These tests verify the options and types without actually spawning agents.

const mockRole: RoleDefinition = {
  id: 'impl-a' as RoleDefinition['id'],
  title: 'Implementer A',
  tier: 'build',
  reportsTo: 'vp-engineering',
  model: 'claude-sonnet-4-6',
  tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'],
  skills: ['engineering-excellence', 'surgical-edits'],
  isolation: 'worktree',
  maxTurns: 60,
  color: 'orange',
};

const mockOrchestratorRole: RoleDefinition = {
  id: 'vp-engineering' as RoleDefinition['id'],
  title: 'VP Engineering',
  tier: 'leadership',
  reportsTo: 'cto',
  model: 'claude-opus-4-7',
  tools: ['Read', 'Glob', 'Task', 'AskUserQuestion'],
  skills: ['engineering-excellence'],
  isolation: 'none',
  maxTurns: 80,
  color: 'blue',
};

describe('SpawnOptions type', () => {
  it('constructs valid spawn options for impl-a', () => {
    const opts: SpawnOptions = {
      role: mockRole,
      missionId: '2026-05-17-test-mission',
      systemPrompt: 'You are an implementer.',
      userMessage: 'Create a hello world file.',
      projectRoot: '/tmp/test-project',
    };

    expect(opts.role.id).toBe('impl-a');
    expect(opts.role.isolation).toBe('worktree');
    expect(opts.role.tools).toContain('Edit');
  });

  it('orchestrator has no Edit tool', () => {
    const opts: SpawnOptions = {
      role: mockOrchestratorRole,
      missionId: '2026-05-17-test',
      systemPrompt: 'You are the VP Engineering.',
      userMessage: 'Decompose this mission.',
      projectRoot: '/tmp/test-project',
    };

    expect(opts.role.tools).not.toContain('Edit');
    expect(opts.role.tools).not.toContain('Write');
    expect(opts.role.tools).not.toContain('Bash');
    expect(opts.role.isolation).toBe('none');
  });
});
