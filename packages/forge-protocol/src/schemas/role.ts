import { z } from 'zod';

export const RoleId = z.string().brand<'RoleId'>();
export type RoleId = z.infer<typeof RoleId>;

export const RoleTier = z.enum([
  'leadership',
  'planning',
  'build',
  'verify',
  'release',
  'knowledge',
]);
export type RoleTier = z.infer<typeof RoleTier>;

export const IsolationMode = z.enum(['none', 'worktree', 'container']);
export type IsolationMode = z.infer<typeof IsolationMode>;

export const ModelId = z.enum([
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'gemini-2-5-pro',
  'gpt-5-4',
]);
export type ModelId = z.infer<typeof ModelId>;

export const ToolName = z.enum([
  'Read',
  'Edit',
  'Write',
  'Bash',
  'Grep',
  'Glob',
  'Agent',
  'Task',
  'AskUserQuestion',
  'WebFetch',
  'WebSearch',
  'LSP',
  'GeminiReview',
]);
export type ToolName = z.infer<typeof ToolName>;

export const RoleDefinitionSchema = z.object({
  id: RoleId,
  title: z.string(),
  tier: RoleTier,
  reportsTo: z.string(),
  model: ModelId,
  tools: z.array(ToolName),
  disallowedTools: z.array(ToolName).optional(),
  skills: z.array(z.string()),
  isolation: IsolationMode,
  maxTurns: z.number().int().positive(),
  color: z.string(),
  canApprove: z.array(z.string()).optional(),
  mustEscalate: z.array(z.string()).optional(),
  produces: z.array(z.string()).optional(),
  schedule: z.string().optional(),
});
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;
