import type { InboxItem, InboxItemId, InboxSeverity, InboxItemType } from '@forge/protocol';

function randomChars(n: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < n; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function createInboxItem(params: {
  missionId: string;
  severity: InboxSeverity;
  type: InboxItemType;
  proposer: string;
  summary: string;
  what: string;
  why: string;
  recommendation: string;
  evidence: string[];
  decisionOptions: Array<{ id: string; label: string; consequence: string }>;
  timeSensitivity?: string;
}): InboxItem {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const id = `cto-inbox-${dateStr}-${randomChars(3)}` as InboxItemId;

  return {
    id,
    createdAt: now.toISOString(),
    missionId: params.missionId,
    severity: params.severity,
    type: params.type,
    proposer: params.proposer,
    summary: params.summary,
    proposal: {
      what: params.what,
      why: params.why,
      recommendation: params.recommendation,
    },
    evidence: params.evidence,
    timeSensitivity: params.timeSensitivity,
    decisionOptions: params.decisionOptions,
    status: 'pending',
  };
}
