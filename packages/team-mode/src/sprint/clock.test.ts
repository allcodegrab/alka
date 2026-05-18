import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SprintClock } from './clock.js';

describe('SprintClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format elapsed as "H+0:00" at start', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00.000Z'));
    const clock = new SprintClock(new Date(), '24h');
    expect(clock.formatElapsed()).toBe('H+0:00');
  });

  it('should format elapsed as "H+12:34"', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    // Advance 12 hours and 34 minutes
    vi.setSystemTime(new Date('2025-06-01T12:34:00.000Z'));
    expect(clock.formatElapsed()).toBe('H+12:34');
  });

  it('should format elapsed as "H+24:00"', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    vi.setSystemTime(new Date('2025-06-02T00:00:00.000Z'));
    expect(clock.formatElapsed()).toBe('H+24:00');
  });

  it('should track elapsed milliseconds and hours', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    vi.setSystemTime(new Date('2025-06-01T06:00:00.000Z'));
    expect(clock.elapsed()).toBe(6 * 60 * 60 * 1000);
    expect(clock.elapsedHours()).toBe(6);
  });

  it('should track phase start and elapsed time', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    clock.startPhase('brief');
    expect(clock.currentPhase()).toBe('brief');

    vi.setSystemTime(new Date('2025-06-01T00:20:00.000Z'));
    expect(clock.phaseElapsed('brief')).toBe(20 * 60 * 1000);
  });

  it('should return null for currentPhase when no phase started', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00.000Z'));
    const clock = new SprintClock(new Date(), '24h');
    expect(clock.currentPhase()).toBeNull();
  });

  it('should return 0 for phaseElapsed when phase not started', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00.000Z'));
    const clock = new SprintClock(new Date(), '24h');
    expect(clock.phaseElapsed('brief')).toBe(0);
  });

  it('should detect soft deadline exceeded', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    clock.startPhase('brief');

    // 25 minutes — under soft deadline (30min)
    vi.setSystemTime(new Date('2025-06-01T00:25:00.000Z'));
    expect(clock.isOverSoftDeadline('brief')).toBe(false);

    // 31 minutes — over soft deadline
    vi.setSystemTime(new Date('2025-06-01T00:31:00.000Z'));
    expect(clock.isOverSoftDeadline('brief')).toBe(true);
  });

  it('should detect hard deadline exceeded', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    clock.startPhase('brief');

    // 40 minutes — under hard deadline (45min)
    vi.setSystemTime(new Date('2025-06-01T00:40:00.000Z'));
    expect(clock.isOverHardDeadline('brief')).toBe(false);

    // 46 minutes — over hard deadline
    vi.setSystemTime(new Date('2025-06-01T00:46:00.000Z'));
    expect(clock.isOverHardDeadline('brief')).toBe(true);
  });

  it('should calculate time remaining in phase', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    clock.startPhase('brief');

    // 20 minutes in — 25 minutes remaining to hard deadline (45min)
    vi.setSystemTime(new Date('2025-06-01T00:20:00.000Z'));
    expect(clock.timeRemainingInPhase('brief')).toBe(25 * 60 * 1000);

    // 50 minutes in — 5 minutes over hard deadline
    vi.setSystemTime(new Date('2025-06-01T00:50:00.000Z'));
    expect(clock.timeRemainingInPhase('brief')).toBe(-5 * 60 * 1000);
  });

  it('should use 24h phases in 24h mode and standard phases in standard mode', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00.000Z'));

    const clock24h = new SprintClock(new Date(), '24h');
    const phases24h = clock24h.getPhases();
    const brief24h = phases24h.find((p) => p.id === 'brief')!;
    expect(brief24h.hardDeadlineMinutes).toBe(45);

    const clockStd = new SprintClock(new Date(), 'standard');
    const phasesStd = clockStd.getPhases();
    const briefStd = phasesStd.find((p) => p.id === 'brief')!;
    expect(briefStd.hardDeadlineMinutes).toBe(Infinity);
  });

  it('should not flag CTO-controlled phases as over deadline', () => {
    const start = new Date('2025-06-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const clock = new SprintClock(start, '24h');

    clock.startPhase('arch_review');

    // Even after a very long time, CTO-controlled phase should not flag
    vi.setSystemTime(new Date('2025-06-02T00:00:00.000Z'));
    expect(clock.isOverSoftDeadline('arch_review')).toBe(false);
    expect(clock.isOverHardDeadline('arch_review')).toBe(false);
    expect(clock.timeRemainingInPhase('arch_review')).toBe(Infinity);
  });
});
