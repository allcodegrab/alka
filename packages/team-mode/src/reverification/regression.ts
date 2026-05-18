import type { TestResult, Regression } from './types.js';

export function detectRegressions(current: TestResult[], baseline: TestResult[]): Regression[] {
  const baselineMap = new Map<string, TestResult>();
  for (const result of baseline) {
    baselineMap.set(result.name, result);
  }

  const regressions: Regression[] = [];
  for (const result of current) {
    const prev = baselineMap.get(result.name);
    if (prev && prev.status === 'pass' && result.status === 'fail') {
      regressions.push({
        testName: result.name,
        previousStatus: 'pass',
        currentStatus: 'fail',
      });
    }
  }

  return regressions;
}
