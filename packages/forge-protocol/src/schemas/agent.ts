import { z } from 'zod';

export const AgentId = z.string().brand<'AgentId'>();
export type AgentId = z.infer<typeof AgentId>;

export const AgentStatus = z.enum(['spawning', 'running', 'complete', 'failed', 'cancelled']);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const AgentRunSchema = z.object({
  agentId: AgentId,
  roleId: z.string(),
  missionId: z.string(),
  model: z.string(),
  status: AgentStatus,
  tokensIn: z.number().int().min(0),
  tokensOut: z.number().int().min(0),
  costUsd: z.number().min(0),
  turns: z.number().int().min(0),
  maxTurns: z.number().int().positive(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});
export type AgentRun = z.infer<typeof AgentRunSchema>;
