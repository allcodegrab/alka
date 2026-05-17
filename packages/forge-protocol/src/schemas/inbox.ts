import { z } from 'zod';

export const InboxItemId = z.string().brand<'InboxItemId'>();
export type InboxItemId = z.infer<typeof InboxItemId>;

export const InboxSeverity = z.enum(['low', 'medium', 'high', 'critical']);
export type InboxSeverity = z.infer<typeof InboxSeverity>;

export const InboxItemType = z.enum([
  'mission_brief',
  'architecture_change',
  'dependency_addition',
  'schema_change',
  'public_api_change',
  'production_push',
  'scope_expansion',
  'budget_threshold',
  'cross_team_edit',
  'verifier_finding',
  'credential_access',
  'role_change',
  'scope_change',
]);
export type InboxItemType = z.infer<typeof InboxItemType>;

export const InboxItemStatus = z.enum(['pending', 'approved', 'rejected', 'expired']);
export type InboxItemStatus = z.infer<typeof InboxItemStatus>;

export const DecisionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  consequence: z.string(),
});
export type DecisionOption = z.infer<typeof DecisionOptionSchema>;

export const InboxItemSchema = z.object({
  id: InboxItemId,
  createdAt: z.string().datetime(),
  missionId: z.string(),
  severity: InboxSeverity,
  type: InboxItemType,
  proposer: z.string(),
  summary: z.string(),
  proposal: z.object({
    what: z.string(),
    why: z.string(),
    alternativeConsidered: z.string().optional(),
    recommendation: z.string(),
  }),
  evidence: z.array(z.string()),
  timeSensitivity: z.string().optional(),
  decisionOptions: z.array(DecisionOptionSchema),
  status: InboxItemStatus,
  decidedAt: z.string().datetime().optional(),
  decision: z.string().optional(),
  decisionReason: z.string().optional(),
});
export type InboxItem = z.infer<typeof InboxItemSchema>;
