import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isOk, isErr } from '@forge/protocol';
import type { DecisionEntry, MissionState } from '@forge/protocol';
import { createMission } from './create.js';
import {
  appendDecision,
  updateWhiteboard,
  updateDashboard,
  writeArtifact,
  readContext,
  readWhiteboard,
  readDashboard,
} from './io.js';

describe('mission io', () => {
  let tmpDir: string;
  let missionId: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mission-io-test-'));
    const result = await createMission(tmpDir, 'Test Mission', 'standard', 'Test brief content');
    if (!result.ok) throw new Error('Failed to create test mission');
    missionId = result.value;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('readContext', () => {
    it('should read mission context', async () => {
      const result = await readContext(tmpDir, missionId);
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe('Test brief content');
    });

    it('should return NOT_FOUND for nonexistent mission', async () => {
      const result = await readContext(tmpDir, 'nonexistent');
      expect(isErr(result)).toBe(true);
      if (result.ok) return;
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('readWhiteboard / updateWhiteboard', () => {
    it('should read initial whiteboard', async () => {
      const result = await readWhiteboard(tmpDir, missionId);
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe('# Mission Whiteboard\n');
    });

    it('should add a new role section', async () => {
      const updateResult = await updateWhiteboard(
        tmpDir,
        missionId,
        'architect',
        'Design notes here',
      );
      expect(isOk(updateResult)).toBe(true);

      const readResult = await readWhiteboard(tmpDir, missionId);
      expect(isOk(readResult)).toBe(true);
      if (!readResult.ok) return;
      expect(readResult.value).toContain('## @architect');
      expect(readResult.value).toContain('Design notes here');
    });

    it('should replace an existing role section', async () => {
      await updateWhiteboard(tmpDir, missionId, 'architect', 'Version 1');
      await updateWhiteboard(tmpDir, missionId, 'architect', 'Version 2');

      const result = await readWhiteboard(tmpDir, missionId);
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toContain('Version 2');
      expect(result.value).not.toContain('Version 1');
    });

    it('should preserve other role sections when updating', async () => {
      await updateWhiteboard(tmpDir, missionId, 'architect', 'Architect notes');
      await updateWhiteboard(tmpDir, missionId, 'vp-engineering', 'VP notes');

      // Update architect, vp should be preserved
      await updateWhiteboard(tmpDir, missionId, 'architect', 'Updated architect notes');

      const result = await readWhiteboard(tmpDir, missionId);
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toContain('Updated architect notes');
      expect(result.value).toContain('VP notes');
    });
  });

  describe('readDashboard / updateDashboard', () => {
    it('should read initial dashboard', async () => {
      const result = await readDashboard(tmpDir, missionId);
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value.status).toBe('active');
      expect(result.value.name).toBe('Test Mission');
    });

    it('should update dashboard', async () => {
      const dashResult = await readDashboard(tmpDir, missionId);
      if (!dashResult.ok) throw new Error('Failed to read dashboard');

      const updated: MissionState = {
        ...dashResult.value,
        status: 'paused',
        totalCostUsd: 1.5,
      };

      const updateResult = await updateDashboard(tmpDir, missionId, updated);
      expect(isOk(updateResult)).toBe(true);

      const readResult = await readDashboard(tmpDir, missionId);
      expect(isOk(readResult)).toBe(true);
      if (!readResult.ok) return;
      expect(readResult.value.status).toBe('paused');
      expect(readResult.value.totalCostUsd).toBe(1.5);
    });
  });

  describe('appendDecision', () => {
    it('should append a decision entry', async () => {
      const entry: DecisionEntry = {
        id: 'dec-001',
        timestamp: new Date().toISOString(),
        role: 'architect',
        type: 'architecture',
        summary: 'Use REST over GraphQL',
        why: 'Simpler for this use case',
        status: 'active',
        scope: 'mission',
      };

      const result = await appendDecision(tmpDir, missionId, entry);
      expect(isOk(result)).toBe(true);

      const dir = join(tmpDir, '.claude', 'missions', missionId);
      const content = await readFile(join(dir, 'decisions.md'), 'utf-8');
      expect(content).toContain('### dec-001');
      expect(content).toContain('**Role:** architect');
      expect(content).toContain('**Type:** architecture');
      expect(content).toContain('**Summary:** Use REST over GraphQL');
      expect(content).toContain('**Why:** Simpler for this use case');
    });
  });

  describe('writeArtifact', () => {
    it('should write an artifact file', async () => {
      const result = await writeArtifact(
        tmpDir,
        missionId,
        'architect',
        'design.md',
        '# Design doc',
      );
      expect(isOk(result)).toBe(true);

      const dir = join(tmpDir, '.claude', 'missions', missionId);
      const content = await readFile(join(dir, 'artifacts', 'architect', 'design.md'), 'utf-8');
      expect(content).toBe('# Design doc');
    });
  });
});
