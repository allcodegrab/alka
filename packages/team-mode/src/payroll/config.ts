import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ok, err, type Result } from '@forge/protocol';
import { PayrollError } from './errors.js';

export interface PayrollConfig {
  monthlyTotalCapUsd: number;
  alertThresholdsPct: number[];
  roles: Record<string, { monthlyBudgetUsd: number; model: string }>;
}

export async function loadPayrollConfig(
  projectRoot: string,
): Promise<Result<PayrollConfig, PayrollError>> {
  const configPath = join(projectRoot, '.forge', 'payroll.yaml');

  let content: string;
  try {
    content = await readFile(configPath, 'utf-8');
  } catch (e) {
    return err(
      new PayrollError(
        'IO_ERROR',
        `Failed to read payroll config: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  let raw: unknown;
  try {
    raw = parseYaml(content);
  } catch (e) {
    return err(
      new PayrollError(
        'PARSE_ERROR',
        `Failed to parse payroll YAML: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  if (!raw || typeof raw !== 'object') {
    return err(new PayrollError('PARSE_ERROR', 'Payroll config is not a valid object'));
  }

  const data = raw as Record<string, unknown>;
  const monthlyTotalCapUsd = Number(data['monthlyTotalCapUsd'] ?? 0);
  const alertThresholdsPct = Array.isArray(data['alertThresholdsPct'])
    ? (data['alertThresholdsPct'] as number[])
    : [50, 80, 100];

  const rawRoles = (data['roles'] ?? {}) as Record<string, Record<string, unknown>>;
  const roles: Record<string, { monthlyBudgetUsd: number; model: string }> = {};

  for (const [roleId, roleDef] of Object.entries(rawRoles)) {
    roles[roleId] = {
      monthlyBudgetUsd: Number(roleDef['monthlyBudgetUsd'] ?? 0),
      model: String(roleDef['model'] ?? 'unknown'),
    };
  }

  return ok({ monthlyTotalCapUsd, alertThresholdsPct, roles });
}
