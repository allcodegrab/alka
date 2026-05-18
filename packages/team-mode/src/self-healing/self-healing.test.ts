import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  detectMissionCrash,
  detectCostRunaway,
  detectFindingStorm,
  detectStuckRole,
  detectWorktreeConflict,
  detectModelOutage,
} from './detectors.js';
import { recover, resetRetryCounters } from './recovery.js';

describe('self-healing', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'healing-test-'));
    resetRetryCounters();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('detectMissionCrash', () => {
    it('should detect crash when heartbeat is stale', () => {
      const staleHeartbeat = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = detectMissionCrash(staleHeartbeat);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('mission_crash');
    });

    it('should return null when heartbeat is recent', () => {
      const recentHeartbeat = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
      const result = detectMissionCrash(recentHeartbeat);
      expect(result).toBeNull();
    });
  });

  describe('detectCostRunaway', () => {
    it('should detect cost runaway when over budget', () => {
      const result = detectCostRunaway(150, 100);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('cost_runaway');
    });

    it('should return null when within budget', () => {
      const result = detectCostRunaway(80, 100);
      expect(result).toBeNull();
    });
  });

  describe('detectFindingStorm', () => {
    it('should detect finding storm when threshold exceeded', () => {
      const result = detectFindingStorm(7);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('finding_storm');
    });

    it('should return null when below threshold', () => {
      const result = detectFindingStorm(3);
      expect(result).toBeNull();
    });
  });

  describe('detectStuckRole', () => {
    it('should detect stuck role when no progress beyond 2x budget', () => {
      const staleProgress = new Date(Date.now() - 25 * 60 * 1000); // 25 minutes ago
      const result = detectStuckRole(staleProgress, 10); // 2x budget = 20 min
      expect(result).not.toBeNull();
      expect(result!.type).toBe('stuck_role');
    });

    it('should return null when within budget', () => {
      const recentProgress = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = detectStuckRole(recentProgress, 10);
      expect(result).toBeNull();
    });
  });

  describe('detectWorktreeConflict', () => {
    it('should detect worktree conflict from error message', () => {
      const result = detectWorktreeConflict('fatal: CONFLICT (content): merge conflict in file.ts');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('worktree_conflict');
    });

    it('should return null for non-conflict errors', () => {
      const result = detectWorktreeConflict('Some other error');
      expect(result).toBeNull();
    });
  });

  describe('detectModelOutage', () => {
    it('should detect model outage from rate limit error', () => {
      const result = detectModelOutage('Error: rate limit exceeded, please try again later');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('model_outage');
    });

    it('should return null for non-outage errors', () => {
      const result = detectModelOutage('TypeError: cannot read property');
      expect(result).toBeNull();
    });
  });

  describe('recovery', () => {
    it('should recover from mission crash with resume_from_whiteboard', async () => {
      const failure = {
        type: 'mission_crash' as const,
        signal: 'No heartbeat',
        detectedAt: new Date().toISOString(),
      };

      const result = await recover(tmpDir, failure);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.action).toBe('resume_from_whiteboard');
      expect(result.value.success).toBe(true);
    });

    it('should recover from cost runaway with pause_mission_and_emit_inbox', async () => {
      const failure = {
        type: 'cost_runaway' as const,
        signal: 'Cost exceeded',
        detectedAt: new Date().toISOString(),
      };

      const result = await recover(tmpDir, failure);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.action).toBe('pause_mission_and_emit_inbox');
    });

    it('should escalate after max retries', async () => {
      const failure = {
        type: 'mission_crash' as const,
        signal: 'No heartbeat',
        missionId: 'test-mission',
        detectedAt: new Date().toISOString(),
      };

      // Exhaust retries
      await recover(tmpDir, failure);
      await recover(tmpDir, failure);
      await recover(tmpDir, failure);

      // 4th attempt should fail with MAX_RETRIES
      const result = await recover(tmpDir, failure);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('MAX_RETRIES');
    });

    it('should log healing actions to journal.md with [self-healing] prefix', async () => {
      const failure = {
        type: 'stuck_role' as const,
        signal: 'No progress',
        roleId: 'impl-a',
        detectedAt: new Date().toISOString(),
      };

      await recover(tmpDir, failure);

      const journalPath = join(tmpDir, '.claude', 'memory', 'journal.md');
      const content = await readFile(journalPath, 'utf-8');
      expect(content).toContain('[self-healing]');
      expect(content).toContain('stuck_role');
      expect(content).toContain('soft_restart_role');
    });
  });
});
