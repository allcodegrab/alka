import { describe, it, expect } from 'vitest';
import { calculateCost, getModelPricing } from './cost.js';

describe('getModelPricing', () => {
  it('returns pricing for known models', () => {
    const opus = getModelPricing('claude-opus-4-7');
    expect(opus.inputPer1MTokens).toBe(5.0);
    expect(opus.outputPer1MTokens).toBe(25.0);

    const gemini = getModelPricing('gemini-2-5-flash');
    expect(gemini.inputPer1MTokens).toBe(0.15);
    expect(gemini.outputPer1MTokens).toBe(0.6);
  });

  it('returns default pricing for unknown models', () => {
    const unknown = getModelPricing('unknown-model');
    expect(unknown.inputPer1MTokens).toBe(3.0);
    expect(unknown.outputPer1MTokens).toBe(15.0);
  });
});

describe('calculateCost', () => {
  it('calculates cost correctly for Claude Sonnet', () => {
    // 1M input tokens at $3/MTok + 1M output tokens at $15/MTok = $18
    const cost = calculateCost('claude-sonnet-4-6', 1_000_000, 1_000_000);
    expect(cost).toBe(18.0);
  });

  it('calculates cost correctly for Gemini Flash', () => {
    // 1M input at $0.15/MTok + 1M output at $0.6/MTok = $0.75
    const cost = calculateCost('gemini-2-5-flash', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.75, 3);
  });

  it('returns zero for zero tokens', () => {
    expect(calculateCost('claude-sonnet-4-6', 0, 0)).toBe(0);
  });
});
