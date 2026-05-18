export interface PayrollAlert {
  threshold: number;
  currentPct: number;
  totalSpent: number;
  totalBudget: number;
  severity: 'medium' | 'high' | 'critical';
}

function severityFromThreshold(threshold: number): 'medium' | 'high' | 'critical' {
  if (threshold >= 100) return 'critical';
  if (threshold >= 80) return 'high';
  return 'medium';
}

export function checkPayrollThresholds(
  totalSpent: number,
  totalBudget: number,
  thresholds: number[],
): PayrollAlert[] {
  if (totalBudget <= 0) return [];

  const currentPct = (totalSpent / totalBudget) * 100;
  const alerts: PayrollAlert[] = [];

  const sorted = [...thresholds].sort((a, b) => a - b);
  for (const threshold of sorted) {
    if (currentPct >= threshold) {
      alerts.push({
        threshold,
        currentPct,
        totalSpent,
        totalBudget,
        severity: severityFromThreshold(threshold),
      });
    }
  }

  return alerts;
}
