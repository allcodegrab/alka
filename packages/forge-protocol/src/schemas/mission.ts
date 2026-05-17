import { z } from 'zod';

export const MissionId = z.string().brand<'MissionId'>();
export type MissionId = z.infer<typeof MissionId>;

export const MissionMode = z.enum(['standard', '24h']);
export type MissionMode = z.infer<typeof MissionMode>;

export const MissionStatus = z.enum(['active', 'paused', 'completed', 'aborted']);
export type MissionStatus = z.infer<typeof MissionStatus>;

export const MissionBriefSchema = z.object({
  id: MissionId,
  name: z.string(),
  mode: MissionMode,
  problemStatement: z.string(),
  successCriteria: z.array(z.string()),
  outOfScope: z.array(z.string()),
  constraints: z.array(z.string()),
  risks: z.array(z.string()),
  teamAssembled: z.array(z.string()),
  phaseBudgets: z.record(z.string(), z.number()).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});
export type MissionBrief = z.infer<typeof MissionBriefSchema>;

export const RoleStateSchema = z.object({
  roleId: z.string(),
  status: z.enum(['idle', 'planning', 'running', 'blocked', 'complete', 'failed']),
  currentAction: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  costUsd: z.number().min(0),
  lastUpdated: z.string().datetime(),
});
export type RoleState = z.infer<typeof RoleStateSchema>;

export const MissionStateSchema = z.object({
  missionId: MissionId,
  name: z.string(),
  mode: MissionMode,
  status: MissionStatus,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  roles: z.array(RoleStateSchema),
  totalCostUsd: z.number().min(0),
  slicesTotal: z.number().int().min(0),
  slicesCompleted: z.number().int().min(0),
});
export type MissionState = z.infer<typeof MissionStateSchema>;
