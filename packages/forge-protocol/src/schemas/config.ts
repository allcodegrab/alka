import { z } from 'zod';

export const ForgeConfigSchema = z.object({
  project: z.object({
    name: z.string(),
    primaryLanguage: z.string(),
    secondaryLanguages: z.array(z.string()).optional(),
  }),
  team: z
    .object({
      orgChart: z.string().default('.forge/org-chart.yaml'),
      defaultMode: z.enum(['standard', '24h']).default('standard'),
    })
    .optional(),
  budgets: z
    .object({
      perMissionDefaultUsd: z.number().positive().default(20),
      perMission24hUsd: z.number().positive().default(50),
      ctoAlertAtPct: z.number().min(0).max(100).default(80),
    })
    .optional(),
});
export type ForgeConfig = z.infer<typeof ForgeConfigSchema>;
