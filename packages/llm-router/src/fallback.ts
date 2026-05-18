import { err, type Result } from '@forge/protocol';
import { RouterError } from './errors.js';
import { route } from './router.js';
import type { LLMRequest, LLMResponse } from './providers/types.js';

export async function routeWithFallback(
  request: LLMRequest,
  fallbackModels: string[],
): Promise<Result<LLMResponse, RouterError>> {
  const models = [request.model, ...fallbackModels];
  let lastError: RouterError | undefined;

  for (const model of models) {
    const result = await route({ ...request, model });
    if (result.ok) {
      return result;
    }
    lastError = result.error;
  }

  return err(lastError ?? new RouterError('ALL_FAILED', 'All models failed'));
}
