import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk, isErr } from '@forge/protocol';
import { addRole, removeRole, pauseRole, resumeRole, reconfigureRole } from './operations.js';
import { readTeamDelta } from './team-delta.js';
import type { TeamModEntry, ReconfigEntry } from './types.js';

describe('team-mods operations', () => {
  let tmpDir: string;
  const missionId = 'test-mission';

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'team-mods-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('addRole', () => {
    it('should create team-delta.yaml with addition entry', async () => {
      const entry: TeamModEntry = {
        id: 'security-reviewer',
        template: 'security',
        reason: 'Need security audit',
        proposedBy: 'vp-engineering',
        budgetImpactUsd: 2.5,
      };

      const result = await addRole(tmpDir, missionId, entry);
      expect(isOk(result)).toBe(true);

      const delta = await readTeamDelta(tmpDir, missionId);
      expect(isOk(delta)).toBe(true);
      if (!delta.ok) return;
      expect(delta.value.additions).toHaveLength(1);
      expect(delta.value.additions[0]!.id).toBe('security-reviewer');
      expect(delta.value.additions[0]!.reason).toBe('Need security audit');
    });

    it('should reject duplicate addition', async () => {
      const entry: TeamModEntry = {
        id: 'security-reviewer',
        reason: 'Need security audit',
        proposedBy: 'vp-engineering',
      };

      await addRole(tmpDir, missionId, entry);
      const result = await addRole(tmpDir, missionId, entry);
      expect(isErr(result)).toBe(true);
      if (result.ok) return;
      expect(result.error.code).toBe('ALREADY_EXISTS');
    });
  });

  describe('removeRole', () => {
    it('should add to removals', async () => {
      const result = await removeRole(
        tmpDir,
        missionId,
        'qa-engineer',
        'Not needed',
        'vp-engineering',
      );
      expect(isOk(result)).toBe(true);

      const delta = await readTeamDelta(tmpDir, missionId);
      if (!delta.ok) return;
      expect(delta.value.removals).toHaveLength(1);
      expect(delta.value.removals[0]!.id).toBe('qa-engineer');
      expect(delta.value.removals[0]!.reason).toBe('Not needed');
    });

    it('should reject duplicate removal', async () => {
      await removeRole(tmpDir, missionId, 'qa-engineer', 'Not needed', 'vp-engineering');
      const result = await removeRole(
        tmpDir,
        missionId,
        'qa-engineer',
        'Still not needed',
        'vp-engineering',
      );
      expect(isErr(result)).toBe(true);
      if (result.ok) return;
      expect(result.error.code).toBe('ALREADY_EXISTS');
    });
  });

  describe('pauseRole', () => {
    it('should add role to paused list', async () => {
      const result = await pauseRole(tmpDir, missionId, 'frontend-dev');
      expect(isOk(result)).toBe(true);

      const delta = await readTeamDelta(tmpDir, missionId);
      if (!delta.ok) return;
      expect(delta.value.paused).toContain('frontend-dev');
    });

    it('should be idempotent', async () => {
      await pauseRole(tmpDir, missionId, 'frontend-dev');
      await pauseRole(tmpDir, missionId, 'frontend-dev');

      const delta = await readTeamDelta(tmpDir, missionId);
      if (!delta.ok) return;
      expect(delta.value.paused.filter((p) => p === 'frontend-dev')).toHaveLength(1);
    });
  });

  describe('resumeRole', () => {
    it('should remove role from paused list', async () => {
      await pauseRole(tmpDir, missionId, 'frontend-dev');
      const result = await resumeRole(tmpDir, missionId, 'frontend-dev');
      expect(isOk(result)).toBe(true);

      const delta = await readTeamDelta(tmpDir, missionId);
      if (!delta.ok) return;
      expect(delta.value.paused).not.toContain('frontend-dev');
    });

    it('should be idempotent when role is not paused', async () => {
      const result = await resumeRole(tmpDir, missionId, 'nonexistent');
      expect(isOk(result)).toBe(true);
    });
  });

  describe('reconfigureRole', () => {
    it('should add reconfig entry', async () => {
      const entry: ReconfigEntry = {
        id: 'backend-dev',
        change: 'model',
        from: 'claude-sonnet-4-20250514',
        to: 'claude-opus-4-20250514',
        reason: 'Need stronger reasoning',
        proposedBy: 'vp-engineering',
        budgetImpactUsd: 5.0,
      };

      const result = await reconfigureRole(tmpDir, missionId, entry);
      expect(isOk(result)).toBe(true);

      const delta = await readTeamDelta(tmpDir, missionId);
      if (!delta.ok) return;
      expect(delta.value.reconfigurations).toHaveLength(1);
      expect(delta.value.reconfigurations[0]!.id).toBe('backend-dev');
      expect(delta.value.reconfigurations[0]!.change).toBe('model');
    });
  });

  describe('combined operations', () => {
    it('should accumulate multiple operations', async () => {
      await addRole(tmpDir, missionId, {
        id: 'security-reviewer',
        reason: 'Security audit',
        proposedBy: 'vp-engineering',
      });
      await removeRole(tmpDir, missionId, 'qa-engineer', 'Not needed', 'vp-engineering');
      await pauseRole(tmpDir, missionId, 'frontend-dev');

      const delta = await readTeamDelta(tmpDir, missionId);
      if (!delta.ok) return;
      expect(delta.value.additions).toHaveLength(1);
      expect(delta.value.removals).toHaveLength(1);
      expect(delta.value.paused).toHaveLength(1);
    });
  });
});
