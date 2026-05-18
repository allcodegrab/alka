import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { recordPhaseTransition, getMissionTimeline } from './timeline.js';
import type { TimelineEntry } from './types.js';

describe('timeline', () => {
  let tmpDir: string;
  const missionId = 'test-mission';

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'sprint-timeline-test-'));
    const missionDir = join(tmpDir, '.claude', 'missions', missionId);
    await mkdir(missionDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should record a timeline entry to a new file', async () => {
    const entry: TimelineEntry = {
      phase: 'brief',
      startedAt: '2025-06-01T00:00:00.000Z',
      status: 'active',
    };

    const result = await recordPhaseTransition(tmpDir, missionId, entry);
    expect(result.ok).toBe(true);

    const raw = await readFile(
      join(tmpDir, '.claude', 'missions', missionId, 'timeline.json'),
      'utf-8',
    );
    const entries = JSON.parse(raw);
    expect(entries).toHaveLength(1);
    expect(entries[0].phase).toBe('brief');
  });

  it('should append to existing timeline', async () => {
    const entry1: TimelineEntry = {
      phase: 'brief',
      startedAt: '2025-06-01T00:00:00.000Z',
      completedAt: '2025-06-01T00:25:00.000Z',
      status: 'complete',
    };
    const entry2: TimelineEntry = {
      phase: 'research',
      startedAt: '2025-06-01T00:25:00.000Z',
      status: 'active',
    };

    await recordPhaseTransition(tmpDir, missionId, entry1);
    const result = await recordPhaseTransition(tmpDir, missionId, entry2);
    expect(result.ok).toBe(true);

    const raw = await readFile(
      join(tmpDir, '.claude', 'missions', missionId, 'timeline.json'),
      'utf-8',
    );
    const entries = JSON.parse(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0].phase).toBe('brief');
    expect(entries[1].phase).toBe('research');
  });

  it('should read timeline entries', async () => {
    await recordPhaseTransition(tmpDir, missionId, {
      phase: 'brief',
      startedAt: '2025-06-01T00:00:00.000Z',
      status: 'complete',
    });
    await recordPhaseTransition(tmpDir, missionId, {
      phase: 'research',
      startedAt: '2025-06-01T00:25:00.000Z',
      status: 'active',
    });

    const result = await getMissionTimeline(tmpDir, missionId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value[0]!.phase).toBe('brief');
    expect(result.value[1]!.phase).toBe('research');
  });

  it('should return empty array for non-existent timeline', async () => {
    const result = await getMissionTimeline(tmpDir, 'nonexistent');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([]);
  });

  it('should maintain ordering across multiple transitions', async () => {
    const phases = ['brief', 'research', 'plan', 'implementation'];
    for (const phase of phases) {
      await recordPhaseTransition(tmpDir, missionId, {
        phase,
        startedAt: new Date().toISOString(),
        status: 'complete',
      });
    }

    const result = await getMissionTimeline(tmpDir, missionId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(4);
    expect(result.value.map((e) => e.phase)).toEqual(phases);
  });

  it('should preserve completedAt field when present', async () => {
    const entry: TimelineEntry = {
      phase: 'brief',
      startedAt: '2025-06-01T00:00:00.000Z',
      completedAt: '2025-06-01T00:30:00.000Z',
      status: 'complete',
    };

    await recordPhaseTransition(tmpDir, missionId, entry);
    const result = await getMissionTimeline(tmpDir, missionId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]!.completedAt).toBe('2025-06-01T00:30:00.000Z');
  });
});
