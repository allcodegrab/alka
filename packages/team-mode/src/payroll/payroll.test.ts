import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadPayrollConfig } from './config.js';
import { aggregateMonthlyCosts } from './tracker.js';
import { checkPayrollThresholds } from './alerts.js';
import { generatePayrollReport } from './report.js';
import type { PayrollConfig } from './config.js';

describe('payroll', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'payroll-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const sampleConfig: PayrollConfig = {
    monthlyTotalCapUsd: 200,
    alertThresholdsPct: [50, 80, 100],
    roles: {
      architect: { monthlyBudgetUsd: 80, model: 'claude-opus-4-7' },
      'impl-a': { monthlyBudgetUsd: 60, model: 'claude-sonnet-4-6' },
      'tests-verifier': { monthlyBudgetUsd: 40, model: 'claude-sonnet-4-6' },
    },
  };

  describe('loadPayrollConfig', () => {
    it('should load config from .forge/payroll.yaml', async () => {
      await mkdir(join(tmpDir, '.forge'), { recursive: true });
      await writeFile(
        join(tmpDir, '.forge', 'payroll.yaml'),
        `monthlyTotalCapUsd: 200\nalertThresholdsPct:\n  - 50\n  - 80\n  - 100\nroles:\n  architect:\n    monthlyBudgetUsd: 80\n    model: claude-opus-4-7\n`,
        'utf-8',
      );

      const result = await loadPayrollConfig(tmpDir);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.monthlyTotalCapUsd).toBe(200);
      expect(result.value.alertThresholdsPct).toEqual([50, 80, 100]);
      expect(result.value.roles['architect']).toEqual({
        monthlyBudgetUsd: 80,
        model: 'claude-opus-4-7',
      });
    });

    it('should return IO_ERROR when config file is missing', async () => {
      const result = await loadPayrollConfig(tmpDir);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('IO_ERROR');
    });
  });

  describe('aggregateMonthlyCosts', () => {
    it('should aggregate costs from dashboard.json files for a given month', async () => {
      const missionDir = join(tmpDir, '.claude', 'missions', '2026-05-01-feature');
      await mkdir(missionDir, { recursive: true });
      await writeFile(
        join(missionDir, 'dashboard.json'),
        JSON.stringify({
          missionId: '2026-05-01-feature',
          name: 'Feature',
          mode: 'standard',
          status: 'completed',
          startedAt: '2026-05-01T10:00:00.000Z',
          roles: [
            { id: 'architect', costUsd: 12.5 },
            { id: 'impl-a', costUsd: 8.0 },
          ],
          totalCostUsd: 20.5,
          slicesTotal: 2,
          slicesCompleted: 2,
        }),
        'utf-8',
      );

      const result = await aggregateMonthlyCosts(tmpDir, '2026-05', sampleConfig);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const architectReport = result.value.find((r) => r.roleId === 'architect');
      expect(architectReport).toBeDefined();
      expect(architectReport!.spent).toBe(12.5);
      expect(architectReport!.missionsCount).toBe(1);

      const implReport = result.value.find((r) => r.roleId === 'impl-a');
      expect(implReport).toBeDefined();
      expect(implReport!.spent).toBe(8.0);
    });

    it('should return zero costs when no missions exist', async () => {
      const result = await aggregateMonthlyCosts(tmpDir, '2026-05', sampleConfig);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.every((r) => r.spent === 0)).toBe(true);
    });

    it('should skip missions from other months', async () => {
      const missionDir = join(tmpDir, '.claude', 'missions', '2026-04-15-old');
      await mkdir(missionDir, { recursive: true });
      await writeFile(
        join(missionDir, 'dashboard.json'),
        JSON.stringify({
          missionId: '2026-04-15-old',
          name: 'Old',
          mode: 'standard',
          status: 'completed',
          startedAt: '2026-04-15T10:00:00.000Z',
          roles: [{ id: 'architect', costUsd: 50 }],
          totalCostUsd: 50,
          slicesTotal: 1,
          slicesCompleted: 1,
        }),
        'utf-8',
      );

      const result = await aggregateMonthlyCosts(tmpDir, '2026-05', sampleConfig);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const architectReport = result.value.find((r) => r.roleId === 'architect');
      expect(architectReport!.spent).toBe(0);
    });
  });

  describe('checkPayrollThresholds', () => {
    it('should return no alerts when spending is below all thresholds', () => {
      const alerts = checkPayrollThresholds(40, 200, [50, 80, 100]);
      expect(alerts).toHaveLength(0);
    });

    it('should return medium alert at 50% threshold', () => {
      const alerts = checkPayrollThresholds(110, 200, [50, 80, 100]);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.severity).toBe('medium');
      expect(alerts[0]!.threshold).toBe(50);
    });

    it('should return medium and high alerts at 80% threshold', () => {
      const alerts = checkPayrollThresholds(170, 200, [50, 80, 100]);
      expect(alerts).toHaveLength(2);
      expect(alerts[0]!.severity).toBe('medium');
      expect(alerts[1]!.severity).toBe('high');
    });

    it('should return all alerts at 100% threshold', () => {
      const alerts = checkPayrollThresholds(200, 200, [50, 80, 100]);
      expect(alerts).toHaveLength(3);
      expect(alerts[2]!.severity).toBe('critical');
    });
  });

  describe('generatePayrollReport', () => {
    it('should generate a markdown report', async () => {
      const costs = [
        {
          roleId: 'architect',
          spent: 50,
          budget: 80,
          pct: 62.5,
          roi: 'medium' as const,
          missionsCount: 2,
        },
        {
          roleId: 'impl-a',
          spent: 45,
          budget: 60,
          pct: 75,
          roi: 'high' as const,
          missionsCount: 3,
        },
      ];

      const result = await generatePayrollReport(tmpDir, '2026-05', sampleConfig, costs);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const reportContent = await readFile(result.value, 'utf-8');
      expect(reportContent).toContain('# Payroll Report');
      expect(reportContent).toContain('2026-05');
      expect(reportContent).toContain('architect');
      expect(reportContent).toContain('impl-a');
      expect(reportContent).toContain('Role Breakdown');
    });
  });

  describe('ROI calculation', () => {
    it('should calculate ROI correctly based on utilization', async () => {
      const missionDir = join(tmpDir, '.claude', 'missions', '2026-05-10-roi-test');
      await mkdir(missionDir, { recursive: true });
      await writeFile(
        join(missionDir, 'dashboard.json'),
        JSON.stringify({
          missionId: '2026-05-10-roi-test',
          name: 'ROI Test',
          mode: 'standard',
          status: 'completed',
          startedAt: '2026-05-10T10:00:00.000Z',
          roles: [
            { id: 'architect', costUsd: 60 },
            { id: 'impl-a', costUsd: 15 },
            { id: 'tests-verifier', costUsd: 0 },
          ],
          totalCostUsd: 75,
          slicesTotal: 1,
          slicesCompleted: 1,
        }),
        'utf-8',
      );

      const result = await aggregateMonthlyCosts(tmpDir, '2026-05', sampleConfig);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const architect = result.value.find((r) => r.roleId === 'architect');
      expect(architect!.pct).toBeCloseTo(75, 0);
      expect(architect!.roi).toBe('high'); // 60/80 = 75% > 70% -> high

      const impl = result.value.find((r) => r.roleId === 'impl-a');
      expect(impl!.roi).toBe('low'); // 15/60 = 25% < 30% -> low

      const verifier = result.value.find((r) => r.roleId === 'tests-verifier');
      expect(verifier!.roi).toBe('unclear'); // 0% -> unclear
    });
  });
});
