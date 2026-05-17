import type { Finding, FindingSeverity } from './types.js';

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

/**
 * Aggregate findings from multiple verifiers into a single flat array.
 */
export function aggregateFindings(perVerifier: Map<string, Finding[]>): Finding[] {
  const all: Finding[] = [];
  for (const findings of perVerifier.values()) {
    all.push(...findings);
  }
  return all;
}

/**
 * Returns true if any finding has critical severity (blocks merge).
 */
export function isBlocked(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === 'critical');
}

/**
 * Returns true if there are more than 5 high-severity findings (storm condition).
 */
export function isStorm(findings: Finding[]): boolean {
  const highCount = findings.filter((f) => f.severity === 'high').length;
  return highCount > 5;
}

/**
 * Sort findings by severity descending (critical first, info last).
 */
export function sortBySeverity(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}
