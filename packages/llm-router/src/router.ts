import { err, type Result } from '@forge/protocol';
import { RouterError } from './errors.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GeminiProvider } from './providers/gemini.js';
import type { LLMProvider, LLMRequest, LLMResponse } from './providers/types.js';

const providers: LLMProvider[] = [new AnthropicProvider(), new GeminiProvider()];

function resolveProvider(model: string): LLMProvider | undefined {
  if (model.startsWith('claude-')) {
    return providers.find((p) => p.id === 'anthropic');
  }
  if (model.startsWith('gemini-')) {
    return providers.find((p) => p.id === 'gemini');
  }
  return undefined;
}

export async function route(request: LLMRequest): Promise<Result<LLMResponse, RouterError>> {
  const provider = resolveProvider(request.model);
  if (!provider) {
    return err(
      new RouterError('PROVIDER_NOT_FOUND', `No provider found for model: ${request.model}`),
    );
  }
  return provider.call(request);
}

export { resolveProvider };
