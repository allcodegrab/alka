import { describe, it, expect } from 'vitest';
import { MissionBriefSchema, MissionStateSchema, MissionStatus, MissionMode } from './mission.js';

describe('MissionBrief schema', () => {
  const validBrief = {
    id: 'test-mission-001',
    name: 'Add endpoint to Mandalore',
    mode: 'standard' as const,
    problemStatement: 'We need a new REST endpoint for user profiles.',
    successCriteria: ['Endpoint responds with 200', 'Tests pass', 'PR reviewed'],
    outOfScope: ['Frontend changes', 'Database migration'],
    constraints: ['Must use Fastify', 'Budget: $20'],
    risks: ['Schema might need update'],
    teamAssembled: ['vp-engineering', 'architect', 'impl-a'],
    createdAt: '2026-05-17T10:00:00Z',
  };

  it('validates a correct mission brief', () => {
    const result = MissionBriefSchema.safeParse(validBrief);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { name: _, ...incomplete } = validBrief;
    const result = MissionBriefSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('accepts optional approval fields', () => {
    const result = MissionBriefSchema.safeParse({
      ...validBrief,
      approvedBy: 'cto',
      approvedAt: '2026-05-17T10:05:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('MissionState schema', () => {
  it('validates a correct mission state', () => {
    const state = {
      missionId: 'test-001',
      name: 'Test Mission',
      mode: 'standard' as const,
      status: 'active' as const,
      startedAt: '2026-05-17T10:00:00Z',
      roles: [
        {
          roleId: 'vp-engineering',
          status: 'running' as const,
          costUsd: 0.5,
          lastUpdated: '2026-05-17T10:01:00Z',
        },
      ],
      totalCostUsd: 0.5,
      slicesTotal: 4,
      slicesCompleted: 1,
    };
    const result = MissionStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });
});

describe('MissionStatus enum', () => {
  it('accepts valid statuses', () => {
    for (const s of ['active', 'paused', 'completed', 'aborted']) {
      expect(MissionStatus.safeParse(s).success).toBe(true);
    }
  });
});

describe('MissionMode enum', () => {
  it('accepts standard and 24h', () => {
    expect(MissionMode.safeParse('standard').success).toBe(true);
    expect(MissionMode.safeParse('24h').success).toBe(true);
    expect(MissionMode.safeParse('invalid').success).toBe(false);
  });
});
