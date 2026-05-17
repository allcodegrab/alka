import { z } from 'zod';
import { RoleDefinitionSchema } from './role.js';

export const OrgChartPolicySchema = z.object({
  id: z.string(),
  appliesTo: z.array(z.string()),
  rule: z.string(),
});
export type OrgChartPolicy = z.infer<typeof OrgChartPolicySchema>;

export const OrgChartSchema = z.object({
  version: z.number().int().positive(),
  name: z.string(),
  cto: z.string(),
  roles: z.array(RoleDefinitionSchema),
  policies: z.array(OrgChartPolicySchema).optional(),
});
export type OrgChart = z.infer<typeof OrgChartSchema>;
