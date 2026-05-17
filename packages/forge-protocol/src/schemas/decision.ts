import { z } from 'zod';

export const DecisionEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  missionId: z.string().optional(),
  role: z.string(),
  type: z.enum([
    'architecture',
    'dependency',
    'schema',
    'scope',
    'convention',
    'deferral',
    'trade_off',
    'tool_choice',
    'model_choice',
    'team_modification',
  ]),
  summary: z.string(),
  why: z.string(),
  alternativesConsidered: z.array(z.string()).optional(),
  evidence: z.array(z.string()).optional(),
  citations: z.array(z.string()).optional(),
  status: z.enum(['active', 'superseded', 'reverted']),
  scope: z.enum(['mission', 'project']),
});
export type DecisionEntry = z.infer<typeof DecisionEntrySchema>;
