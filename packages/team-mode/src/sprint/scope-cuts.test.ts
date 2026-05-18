import { describe, it, expect } from 'vitest';
import { calculateScopeCuts } from './scope-cuts.js';

describe('calculateScopeCuts', () => {
  const baseSlices = [
    { id: 'slice-1', priority: 'critical' as const, status: 'in-progress' },
    { id: 'slice-2', priority: 'important' as const, status: 'pending' },
    { id: 'slice-3', priority: 'nice-to-have' as const, status: 'pending' },
    { id: 'slice-4', priority: 'nice-to-have' as const, status: 'pending' },
  ];

  it('should make no cuts when time is sufficient', () => {
    const result = calculateScopeCuts(baseSlices, 100, []);
    expect(result.cutSlices).toEqual([]);
    expect(result.cutVerifiers).toEqual([]);
    expect(result.docsMode).toBe('full');
    expect(result.releaseMode).toBe('full');
    expect(result.reason).toContain('No cuts needed');
  });

  it('should cut nice-to-have slices first', () => {
    // Deficit of 50 minutes — one nice-to-have slice (60min) should cover it
    const result = calculateScopeCuts(baseSlices, -50, []);
    expect(result.cutSlices).toContain('slice-3');
    expect(result.cutVerifiers).toEqual([]);
    expect(result.docsMode).toBe('full');
    expect(result.releaseMode).toBe('full');
  });

  it('should not cut completed nice-to-have slices', () => {
    const slices = [
      { id: 'slice-1', priority: 'critical' as const, status: 'in-progress' },
      { id: 'slice-3', priority: 'nice-to-have' as const, status: 'complete' },
      { id: 'slice-4', priority: 'nice-to-have' as const, status: 'pending' },
    ];
    // Deficit of 110 — need 2 nice-to-have but only 1 is incomplete
    const result = calculateScopeCuts(slices, -110, []);
    expect(result.cutSlices).toEqual(['slice-4']);
    // Should move to next level since 1 slice (60min) < 110min deficit
    expect(result.cutVerifiers.length).toBeGreaterThan(0);
  });

  it('should cut secondary verifiers after nice-to-have slices', () => {
    // Deficit that exceeds nice-to-have savings (120min) but fits with verifier cuts
    const result = calculateScopeCuts(baseSlices, -150, []);
    expect(result.cutSlices).toContain('slice-3');
    expect(result.cutSlices).toContain('slice-4');
    expect(result.cutVerifiers).toContain('performance-verifier');
  });

  it('should never cut tests-verifier or security-verifier when sensitive paths are touched', () => {
    const slicesWithFiles = [
      {
        id: 'slice-1',
        priority: 'critical' as const,
        status: 'in-progress',
        files: ['src/auth/login.ts'],
      },
    ];
    // Large deficit requiring all possible cuts
    const result = calculateScopeCuts(slicesWithFiles, -500, ['src/auth/']);
    expect(result.cutVerifiers).not.toContain('tests-verifier');
    expect(result.cutVerifiers).not.toContain('security-verifier');
  });

  it('should cut protected verifiers when no sensitive paths are touched', () => {
    const slices = [
      {
        id: 'slice-1',
        priority: 'critical' as const,
        status: 'in-progress',
        files: ['src/utils/helper.ts'],
      },
    ];
    // Large deficit — no nice-to-haves, needs all verifier cuts
    const result = calculateScopeCuts(slices, -200, []);
    expect(result.cutVerifiers).toContain('performance-verifier');
    expect(result.cutVerifiers).toContain('reliability-verifier');
    expect(result.cutVerifiers).toContain('tests-verifier');
    expect(result.cutVerifiers).toContain('security-verifier');
  });

  it('should stop cutting when time deficit is covered', () => {
    // Deficit of 55 — one nice-to-have (60min) should be enough
    const result = calculateScopeCuts(baseSlices, -55, []);
    expect(result.cutSlices).toHaveLength(1);
    expect(result.cutVerifiers).toEqual([]);
    expect(result.docsMode).toBe('full');
    expect(result.releaseMode).toBe('full');
  });

  it('should transition docsMode and releaseMode as last resorts', () => {
    const slices = [{ id: 'slice-1', priority: 'critical' as const, status: 'in-progress' }];
    // No nice-to-haves to cut, huge deficit
    const result = calculateScopeCuts(slices, -500, []);
    expect(result.docsMode).toBe('draft');
    expect(result.releaseMode).toBe('draft-pr');
    expect(result.reason).toContain('draft');
  });

  it('should handle zero slices gracefully', () => {
    const result = calculateScopeCuts([], -100, []);
    expect(result.cutSlices).toEqual([]);
    // Should still attempt verifier cuts and mode downgrades
    expect(result.cutVerifiers.length).toBeGreaterThan(0);
  });
});
