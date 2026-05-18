export interface ModelPricing {
  inputPer1MTokens: number;
  outputPer1MTokens: number;
}

const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-7': { inputPer1MTokens: 5.0, outputPer1MTokens: 25.0 },
  'claude-sonnet-4-6': { inputPer1MTokens: 3.0, outputPer1MTokens: 15.0 },
  'claude-haiku-4-5': { inputPer1MTokens: 1.0, outputPer1MTokens: 5.0 },
  'gemini-2-5-pro': { inputPer1MTokens: 1.25, outputPer1MTokens: 10.0 },
  'gemini-2-5-flash': { inputPer1MTokens: 0.15, outputPer1MTokens: 0.6 },
  'gpt-5-4': { inputPer1MTokens: 5.0, outputPer1MTokens: 15.0 },
};

export function getModelPricing(modelId: string): ModelPricing {
  return PRICING[modelId] ?? { inputPer1MTokens: 3.0, outputPer1MTokens: 15.0 };
}

export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = getModelPricing(model);
  return (
    (tokensIn / 1_000_000) * pricing.inputPer1MTokens +
    (tokensOut / 1_000_000) * pricing.outputPer1MTokens
  );
}
