import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { PayrollError } from './errors.js';
import type { PayrollConfig } from './config.js';
import type { RoleCostReport } from './tracker.js';
import { checkPayrollThresholds } from './alerts.js';

export async function generatePayrollReport(
  projectRoot: string,
  month: string,
  config: PayrollConfig,
  costs: RoleCostReport[],
): Promise<Result<string, PayrollError>> {
  const totalSpent = costs.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = config.monthlyTotalCapUsd;
  const alerts = checkPayrollThresholds(totalSpent, totalBudget, config.alertThresholdsPct);

  let md = `# Payroll Report — ${month}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Budget | $${totalBudget.toFixed(2)} |\n`;
  md += `| Total Spent | $${totalSpent.toFixed(2)} |\n`;
  md += `| Utilization | ${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0'}% |\n`;
  md += `\n`;

  if (alerts.length > 0) {
    md += `## Alerts\n\n`;
    for (const alert of alerts) {
      md += `- **${alert.severity.toUpperCase()}**: Spending at ${alert.currentPct.toFixed(1)}% (threshold: ${alert.threshold}%)\n`;
    }
    md += `\n`;
  }

  md += `## Role Breakdown\n\n`;
  md += `| Role | Budget | Spent | Utilization | ROI | Missions |\n`;
  md += `|------|--------|-------|-------------|-----|----------|\n`;
  for (const cost of costs) {
    md += `| ${cost.roleId} | $${cost.budget.toFixed(2)} | $${cost.spent.toFixed(2)} | ${cost.pct.toFixed(1)}% | ${cost.roi} | ${cost.missionsCount} |\n`;
  }
  md += `\n`;

  const reportPath = join(projectRoot, '.claude', 'reports', `payroll-${month}.md`);
  try {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, md, 'utf-8');
  } catch (e) {
    return err(
      new PayrollError(
        'IO_ERROR',
        `Failed to write payroll report: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  return ok(reportPath);
}
