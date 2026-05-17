const MODEL_PRICING: Record<string, { inputPerMToken: number; outputPerMToken: number }> = {
  'claude-sonnet-4-20250514': { inputPerMToken: 3.0, outputPerMToken: 15.0 },
  'claude-opus-4-20250514': { inputPerMToken: 15.0, outputPerMToken: 75.0 },
  'gpt-4o': { inputPerMToken: 2.5, outputPerMToken: 10.0 },
  'gpt-4.1': { inputPerMToken: 2.0, outputPerMToken: 8.0 },
};

const DEFAULT_PRICING = { inputPerMToken: 3.0, outputPerMToken: 15.0 };
const DEFAULT_INPUT_TOKENS_PER_TURN = 50_000;
const DEFAULT_OUTPUT_TOKENS_PER_TURN = 10_000;

export function estimateBudgetImpact(modelId: string, estimatedTurns: number): number {
  const pricing = MODEL_PRICING[modelId] ?? DEFAULT_PRICING;
  const inputTokens = DEFAULT_INPUT_TOKENS_PER_TURN * estimatedTurns;
  const outputTokens = DEFAULT_OUTPUT_TOKENS_PER_TURN * estimatedTurns;
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMToken;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMToken;
  return Math.round((inputCost + outputCost) * 100) / 100;
}
