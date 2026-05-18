import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { PayrollError } from './errors.js';
import type { PayrollConfig } from './config.js';

export interface RoleCostReport {
  roleId: string;
  spent: number;
  budget: number;
  pct: number;
  roi: 'high' | 'medium' | 'low' | 'unclear';
  missionsCount: number;
}

function computeRoi(pct: number): 'high' | 'medium' | 'low' | 'unclear' {
  if (pct > 70) return 'high';
  if (pct >= 30) return 'medium';
  if (pct > 0) return 'low';
  return 'unclear';
}

interface DashboardJson {
  startedAt?: string;
  roles?: Array<{ id?: string; costUsd?: number }>;
  totalCostUsd?: number;
}

export async function aggregateMonthlyCosts(
  projectRoot: string,
  month: string,
  config: PayrollConfig,
): Promise<Result<RoleCostReport[], PayrollError>> {
  const missionsDir = join(projectRoot, '.claude', 'missions');

  let missionDirs: string[];
  try {
    const entries = await readdir(missionsDir, { withFileTypes: true });
    missionDirs = entries.filter((d) => d.isDirectory()).map((d) => d.name);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      // No missions directory — return zero costs for all configured roles
      const reports: RoleCostReport[] = Object.entries(config.roles).map(([roleId, roleDef]) => ({
        roleId,
        spent: 0,
        budget: roleDef.monthlyBudgetUsd,
        pct: 0,
        roi: 'unclear' as const,
        missionsCount: 0,
      }));
      return ok(reports);
    }
    return err(new PayrollError('IO_ERROR', `Failed to list missions: ${msg}`));
  }

  // Accumulate costs per role
  const costsByRole = new Map<string, { spent: number; missionsCount: number }>();

  for (const dir of missionDirs) {
    const dashboardPath = join(missionsDir, dir, 'dashboard.json');
    let dashboard: DashboardJson;
    try {
      const raw = await readFile(dashboardPath, 'utf-8');
      dashboard = JSON.parse(raw) as DashboardJson;
    } catch {
      continue; // Skip unreadable dashboards
    }

    // Check if mission falls within the given month
    const startedAt = dashboard.startedAt ?? '';
    if (!startedAt.startsWith(month)) continue;

    const roles = dashboard.roles ?? [];
    const seenRoles = new Set<string>();

    for (const role of roles) {
      const roleId = role.id ?? '';
      const costUsd = role.costUsd ?? 0;

      if (!roleId) continue;

      const existing = costsByRole.get(roleId) ?? { spent: 0, missionsCount: 0 };
      existing.spent += costUsd;
      if (!seenRoles.has(roleId)) {
        existing.missionsCount += 1;
        seenRoles.add(roleId);
      }
      costsByRole.set(roleId, existing);
    }
  }

  // Build reports for all configured roles
  const reports: RoleCostReport[] = [];
  for (const [roleId, roleDef] of Object.entries(config.roles)) {
    const data = costsByRole.get(roleId) ?? { spent: 0, missionsCount: 0 };
    const budget = roleDef.monthlyBudgetUsd;
    const pct = budget > 0 ? (data.spent / budget) * 100 : 0;
    reports.push({
      roleId,
      spent: data.spent,
      budget,
      pct,
      roi: computeRoi(pct),
      missionsCount: data.missionsCount,
    });
  }

  return ok(reports);
}
