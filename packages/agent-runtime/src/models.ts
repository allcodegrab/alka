export interface ModelPricing {
  inputPer1MTokens: number;
  outputPer1MTokens: number;
}

const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-7': { inputPer1MTokens: 5.0, outputPer1MTokens: 25.0 },
  'claude-sonnet-4-6': { inputPer1MTokens: 3.0, outputPer1MTokens: 15.0 },
  'claude-haiku-4-5': { inputPer1MTokens: 1.0, outputPer1MTokens: 5.0 },
  'gemini-2-5-pro': { inputPer1MTokens: 1.25, outputPer1MTokens: 10.0 },
  'gpt-5-4': { inputPer1MTokens: 5.0, outputPer1MTokens: 15.0 },
};

export function getModelPricing(modelId: string): ModelPricing {
  return PRICING[modelId] ?? { inputPer1MTokens: 3.0, outputPer1MTokens: 15.0 };
}

export function calculateCost(modelId: string, tokensIn: number, tokensOut: number): number {
  const pricing = getModelPricing(modelId);
  return (
    (tokensIn / 1_000_000) * pricing.inputPer1MTokens +
    (tokensOut / 1_000_000) * pricing.outputPer1MTokens
  );
}

export function mapModelToCliModel(modelId: string): string {
  switch (modelId) {
    case 'claude-opus-4-7':
      return 'opus';
    case 'claude-sonnet-4-6':
      return 'sonnet';
    case 'claude-haiku-4-5':
      return 'haiku';
    default:
      return 'sonnet';
  }
}
