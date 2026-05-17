import { describe, it, expect } from 'vitest';
import { aggregateFindings, isBlocked, isStorm, sortBySeverity } from './findings.js';
import type { Finding } from './types.js';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    severity: 'info',
    verifier: 'test-verifier',
    location: 'src/index.ts:10',
    evidence: 'Test evidence',
    suggestion: 'Test suggestion',
    ...overrides,
  };
}

describe('aggregateFindings', () => {
  it('should combine findings from multiple verifiers', () => {
    const perVerifier = new Map<string, Finding[]>();
    perVerifier.set('linter', [makeFinding({ verifier: 'linter', severity: 'low' })]);
    perVerifier.set('security', [
      makeFinding({ verifier: 'security', severity: 'high' }),
      makeFinding({ verifier: 'security', severity: 'critical' }),
    ]);

    const result = aggregateFindings(perVerifier);
    expect(result).toHaveLength(3);
  });

  it('should return empty array for empty map', () => {
    const result = aggregateFindings(new Map());
    expect(result).toEqual([]);
  });

  it('should preserve all finding fields', () => {
    const finding = makeFinding({
      verifier: 'audit',
      severity: 'medium',
      location: 'lib/util.ts:5',
    });
    const perVerifier = new Map<string, Finding[]>();
    perVerifier.set('audit', [finding]);

    const result = aggregateFindings(perVerifier);
    expect(result[0]).toEqual(finding);
  });
});

describe('isBlocked', () => {
  it('should return true when any finding is critical', () => {
    const findings = [
      makeFinding({ severity: 'low' }),
      makeFinding({ severity: 'critical' }),
      makeFinding({ severity: 'info' }),
    ];
    expect(isBlocked(findings)).toBe(true);
  });

  it('should return false when no finding is critical', () => {
    const findings = [
      makeFinding({ severity: 'high' }),
      makeFinding({ severity: 'medium' }),
      makeFinding({ severity: 'low' }),
    ];
    expect(isBlocked(findings)).toBe(false);
  });

  it('should return false for empty findings', () => {
    expect(isBlocked([])).toBe(false);
  });
});

describe('isStorm', () => {
  it('should return true when more than 5 high-severity findings exist', () => {
    const findings = Array.from({ length: 6 }, () => makeFinding({ severity: 'high' }));
    expect(isStorm(findings)).toBe(true);
  });

  it('should return false when exactly 5 high-severity findings exist', () => {
    const findings = Array.from({ length: 5 }, () => makeFinding({ severity: 'high' }));
    expect(isStorm(findings)).toBe(false);
  });

  it('should not count critical as high for storm detection', () => {
    const findings = [
      ...Array.from({ length: 4 }, () => makeFinding({ severity: 'high' })),
      ...Array.from({ length: 3 }, () => makeFinding({ severity: 'critical' })),
    ];
    expect(isStorm(findings)).toBe(false);
  });

  it('should return false for empty findings', () => {
    expect(isStorm([])).toBe(false);
  });
});

describe('sortBySeverity', () => {
  it('should sort findings from critical to info', () => {
    const findings = [
      makeFinding({ severity: 'low' }),
      makeFinding({ severity: 'critical' }),
      makeFinding({ severity: 'info' }),
      makeFinding({ severity: 'high' }),
      makeFinding({ severity: 'medium' }),
    ];

    const sorted = sortBySeverity(findings);
    expect(sorted.map((f) => f.severity)).toEqual(['critical', 'high', 'medium', 'low', 'info']);
  });

  it('should not mutate the original array', () => {
    const findings = [makeFinding({ severity: 'info' }), makeFinding({ severity: 'critical' })];
    const original = [...findings];
    sortBySeverity(findings);
    expect(findings).toEqual(original);
  });

  it('should handle empty array', () => {
    expect(sortBySeverity([])).toEqual([]);
  });
});
