import { describe, it, expect } from 'vitest';
import { calculateCost, getModelPricing, mapModelToCliModel } from './models.js';

describe('getModelPricing', () => {
  it('returns pricing for known models', () => {
    const opus = getModelPricing('claude-opus-4-7');
    expect(opus.inputPer1MTokens).toBe(5.0);
    expect(opus.outputPer1MTokens).toBe(25.0);

    const sonnet = getModelPricing('claude-sonnet-4-6');
    expect(sonnet.inputPer1MTokens).toBe(3.0);
  });

  it('returns default pricing for unknown models', () => {
    const unknown = getModelPricing('unknown-model');
    expect(unknown.inputPer1MTokens).toBe(3.0);
    expect(unknown.outputPer1MTokens).toBe(15.0);
  });
});

describe('calculateCost', () => {
  it('calculates cost correctly for Sonnet', () => {
    // 1M input tokens at $3/MTok + 1M output tokens at $15/MTok = $18
    const cost = calculateCost('claude-sonnet-4-6', 1_000_000, 1_000_000);
    expect(cost).toBe(18.0);
  });

  it('calculates cost for small runs', () => {
    // 10k input at $3/MTok = $0.03, 5k output at $15/MTok = $0.075
    const cost = calculateCost('claude-sonnet-4-6', 10_000, 5_000);
    expect(cost).toBeCloseTo(0.105, 3);
  });

  it('returns zero for zero tokens', () => {
    expect(calculateCost('claude-sonnet-4-6', 0, 0)).toBe(0);
  });
});

describe('mapModelToCliModel', () => {
  it('maps known models', () => {
    expect(mapModelToCliModel('claude-opus-4-7')).toBe('opus');
    expect(mapModelToCliModel('claude-sonnet-4-6')).toBe('sonnet');
    expect(mapModelToCliModel('claude-haiku-4-5')).toBe('haiku');
  });

  it('defaults to sonnet for unknown models', () => {
    expect(mapModelToCliModel('gpt-5-4')).toBe('sonnet');
  });
});
