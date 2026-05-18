import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadScheduleConfig, type ScheduleConfig } from './config.js';
import { isWithinBusinessHours, canAcceptMission } from './enforcer.js';
import { setRoleState, getRoleState, listRoleStates } from './lifecycle.js';

describe('schedule', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'schedule-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const sampleConfig: ScheduleConfig = {
    timezone: 'UTC',
    businessHours: {
      monday: '09:00-22:00',
      tuesday: '09:00-22:00',
      wednesday: '09:00-22:00',
      thursday: '09:00-22:00',
      friday: '09:00-22:00',
      saturday: '10:00-18:00',
      sunday: '10:00-18:00',
    },
    twentyFourHourModeOverride: true,
    dreamModeWindow: { weekday: '02:00-06:00', weekend: '02:00-06:00' },
  };

  describe('loadScheduleConfig', () => {
    it('should load config from .forge/schedule.yaml', async () => {
      await mkdir(join(tmpDir, '.forge'), { recursive: true });
      await writeFile(
        join(tmpDir, '.forge', 'schedule.yaml'),
        `timezone: UTC\nbusinessHours:\n  monday: "09:00-22:00"\ntwentyFourHourModeOverride: false\ndreamModeWindow:\n  weekday: "02:00-06:00"\n  weekend: "02:00-06:00"\n`,
        'utf-8',
      );

      const result = await loadScheduleConfig(tmpDir);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.timezone).toBe('UTC');
      expect(result.value.businessHours['monday']).toBe('09:00-22:00');
      expect(result.value.twentyFourHourModeOverride).toBe(false);
    });
  });

  describe('isWithinBusinessHours', () => {
    function makeLocalDate(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
    ): Date {
      return new Date(year, month - 1, day, hour, minute, 0, 0);
    }

    // Find the next Wednesday from a known date
    function nextDayOfWeek(dayOfWeek: number): Date {
      const now = new Date(2026, 4, 18, 14, 0, 0, 0); // Start from a known date
      const diff = (dayOfWeek - now.getDay() + 7) % 7;
      const target = new Date(now);
      target.setDate(target.getDate() + (diff === 0 ? 7 : diff));
      return target;
    }

    it('should return true during business hours on a weekday', () => {
      // Create a Wednesday at 14:00 local time
      const wed = nextDayOfWeek(3); // Wednesday
      wed.setHours(14, 0, 0, 0);
      expect(isWithinBusinessHours(sampleConfig, wed)).toBe(true);
    });

    it('should return false outside business hours on a weekday', () => {
      // Create a Wednesday at 23:00 local time
      const wed = nextDayOfWeek(3);
      wed.setHours(23, 0, 0, 0);
      expect(isWithinBusinessHours(sampleConfig, wed)).toBe(false);
    });

    it('should handle weekend hours correctly', () => {
      // Saturday at 14:00 local time (within 10:00-18:00)
      const sat = nextDayOfWeek(6); // Saturday
      sat.setHours(14, 0, 0, 0);
      expect(isWithinBusinessHours(sampleConfig, sat)).toBe(true);

      // Saturday at 08:00 local time (before 10:00 start)
      const satEarly = nextDayOfWeek(6);
      satEarly.setHours(8, 0, 0, 0);
      expect(isWithinBusinessHours(sampleConfig, satEarly)).toBe(false);
    });
  });

  describe('canAcceptMission', () => {
    function nextDayOfWeek(dayOfWeek: number): Date {
      const now = new Date(2026, 4, 18, 14, 0, 0, 0);
      const diff = (dayOfWeek - now.getDay() + 7) % 7;
      const target = new Date(now);
      target.setDate(target.getDate() + (diff === 0 ? 7 : diff));
      return target;
    }

    it('should always accept 24h missions when override is enabled', () => {
      // Wednesday at 03:00 local (outside business hours)
      const lateNight = nextDayOfWeek(3);
      lateNight.setHours(3, 0, 0, 0);
      expect(canAcceptMission(sampleConfig, '24h', lateNight)).toBe(true);
    });

    it('should reject standard missions outside business hours', () => {
      // Wednesday at 03:00 local (outside business hours)
      const lateNight = nextDayOfWeek(3);
      lateNight.setHours(3, 0, 0, 0);
      expect(canAcceptMission(sampleConfig, 'standard', lateNight)).toBe(false);
    });

    it('should accept standard missions during business hours', () => {
      // Wednesday at 14:00 local
      const workTime = nextDayOfWeek(3);
      workTime.setHours(14, 0, 0, 0);
      expect(canAcceptMission(sampleConfig, 'standard', workTime)).toBe(true);
    });
  });

  describe('role lifecycle', () => {
    it('should set and get role state', async () => {
      await setRoleState(tmpDir, 'architect', 'paused');
      const result = await getRoleState(tmpDir, 'architect');
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe('paused');
    });

    it('should return active for unknown roles', async () => {
      const result = await getRoleState(tmpDir, 'unknown-role');
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe('active');
    });

    it('should list all role states', async () => {
      await setRoleState(tmpDir, 'architect', 'on-leave');
      await setRoleState(tmpDir, 'impl-a', 'dreaming');

      const result = await listRoleStates(tmpDir);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value['architect']).toBe('on-leave');
      expect(result.value['impl-a']).toBe('dreaming');
    });
  });
});
