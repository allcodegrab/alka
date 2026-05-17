import { describe, it, expect } from 'vitest';
import { InboxItemSchema, InboxSeverity, InboxItemType } from './inbox.js';

describe('InboxItem schema', () => {
  const validItem = {
    id: 'cto-inbox-2026-05-17-001',
    createdAt: '2026-05-17T13:42:00Z',
    missionId: 'skill-loader-refactor',
    severity: 'high' as const,
    type: 'dependency_addition' as const,
    proposer: '@architect',
    summary: "Add 'jose' npm dependency for JWT verification",
    proposal: {
      what: 'Add jose@5.x as a runtime dependency',
      why: 'Current code has TS type issues and slower verification',
      recommendation: 'Option 3 (jose)',
    },
    evidence: ['license: MIT', 'last release 14d ago'],
    timeSensitivity: 'blocks H+3:00 plan-lock gate',
    decisionOptions: [
      { id: 'approve', label: 'Approve', consequence: 'architecture moves on' },
      { id: 'reject', label: 'Reject', consequence: '@architect picks alt; +30min' },
    ],
    status: 'pending' as const,
  };

  it('validates a correct inbox item', () => {
    const result = InboxItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('rejects invalid severity', () => {
    const result = InboxItemSchema.safeParse({ ...validItem, severity: 'urgent' });
    expect(result.success).toBe(false);
  });

  it('accepts approved item with decision', () => {
    const result = InboxItemSchema.safeParse({
      ...validItem,
      status: 'approved',
      decidedAt: '2026-05-17T14:00:00Z',
      decision: 'approve',
      decisionReason: 'MIT license, well-maintained',
    });
    expect(result.success).toBe(true);
  });
});

describe('InboxSeverity enum', () => {
  it('accepts all severities', () => {
    for (const s of ['low', 'medium', 'high', 'critical']) {
      expect(InboxSeverity.safeParse(s).success).toBe(true);
    }
  });
});

describe('InboxItemType enum', () => {
  it('accepts architecture_change', () => {
    expect(InboxItemType.safeParse('architecture_change').success).toBe(true);
  });
  it('rejects unknown type', () => {
    expect(InboxItemType.safeParse('random_thing').success).toBe(false);
  });
});
