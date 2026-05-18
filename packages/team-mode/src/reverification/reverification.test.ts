import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { saveBaseline, loadBaseline } from './baseline.js';
import { detectRegressions } from './regression.js';
import type { TestResult, ReverificationReport } from './types.js';

describe('reverification', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'reverification-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('detectRegressions', () => {
    it('should detect pass-to-fail as regression', () => {
      const baseline: TestResult[] = [
        { name: 'test-a', status: 'pass' },
        { name: 'test-b', status: 'pass' },
      ];
      const current: TestResult[] = [
        { name: 'test-a', status: 'pass' },
        { name: 'test-b', status: 'fail' },
      ];

      const regressions = detectRegressions(current, baseline);
      expect(regressions).toHaveLength(1);
      expect(regressions[0]!.testName).toBe('test-b');
      expect(regressions[0]!.previousStatus).toBe('pass');
      expect(regressions[0]!.currentStatus).toBe('fail');
    });

    it('should not count fail-to-fail as regression', () => {
      const baseline: TestResult[] = [{ name: 'test-a', status: 'fail' }];
      const current: TestResult[] = [{ name: 'test-a', status: 'fail' }];

      const regressions = detectRegressions(current, baseline);
      expect(regressions).toHaveLength(0);
    });

    it('should not count new tests as regression', () => {
      const baseline: TestResult[] = [{ name: 'test-a', status: 'pass' }];
      const current: TestResult[] = [
        { name: 'test-a', status: 'pass' },
        { name: 'test-new', status: 'fail' },
      ];

      const regressions = detectRegressions(current, baseline);
      expect(regressions).toHaveLength(0);
    });

    it('should handle empty baseline', () => {
      const current: TestResult[] = [{ name: 'test-a', status: 'fail' }];
      const regressions = detectRegressions(current, []);
      expect(regressions).toHaveLength(0);
    });
  });

  describe('baseline save/load', () => {
    it('should round-trip baseline data', async () => {
      const results: TestResult[] = [
        { name: 'test-a', status: 'pass', duration: 100 },
        { name: 'test-b', status: 'fail', duration: 200 },
        { name: 'test-c', status: 'skip' },
      ];

      await saveBaseline(tmpDir, results);
      const loaded = await loadBaseline(tmpDir);

      expect(loaded).toEqual(results);
    });

    it('should return empty array when no baseline exists', async () => {
      const loaded = await loadBaseline(tmpDir);
      expect(loaded).toEqual([]);
    });
  });

  describe('report structure', () => {
    it('should produce a valid report from test results and regressions', () => {
      const current: TestResult[] = [
        { name: 'test-a', status: 'pass' },
        { name: 'test-b', status: 'fail' },
        { name: 'test-c', status: 'pass' },
      ];
      const baseline: TestResult[] = [
        { name: 'test-a', status: 'pass' },
        { name: 'test-b', status: 'pass' },
        { name: 'test-c', status: 'pass' },
      ];

      const regressions = detectRegressions(current, baseline);
      const report: ReverificationReport = {
        total: current.length,
        passed: current.filter((t) => t.status === 'pass').length,
        failed: current.filter((t) => t.status === 'fail').length,
        regressions,
        timestamp: new Date().toISOString(),
      };

      expect(report.total).toBe(3);
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(1);
      expect(report.regressions).toHaveLength(1);
      expect(report.regressions[0]!.testName).toBe('test-b');
    });
  });
});
