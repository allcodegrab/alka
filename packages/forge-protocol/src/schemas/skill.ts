import { z } from 'zod';

export const SkillManifestSchema = z.object({
  name: z.string(),
  description: z.string(),
  globs: z.string().optional(),
  alwaysApply: z.boolean().optional(),
  filePath: z.string(),
});
export type SkillManifest = z.infer<typeof SkillManifestSchema>;

export const SkillContentSchema = z.object({
  manifest: SkillManifestSchema,
  body: z.string(),
});
export type SkillContent = z.infer<typeof SkillContentSchema>;
