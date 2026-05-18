import { describe, it, expect, vi } from 'vitest';
import { routeWithFallback } from './fallback.js';
import type { LLMRequest } from './providers/types.js';

const successResponse = {
  ok: true as const,
  value: {
    content: 'Success',
    model: 'claude-sonnet-4-6',
    tokensIn: 10,
    tokensOut: 5,
    costUsd: 0.001,
    durationMs: 100,
  },
};

const failResponse = {
  ok: false as const,
  error: { code: 'API_ERROR' as const, message: 'Provider failed', name: 'RouterError' },
};

// We mock the route function from router.ts
vi.mock('./router.js', () => ({
  route: vi.fn(),
}));

import { route } from './router.js';
const mockRoute = vi.mocked(route);

const baseRequest: LLMRequest = {
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Hello' }],
};

describe('routeWithFallback', () => {
  it('returns success from primary model', async () => {
    mockRoute.mockResolvedValueOnce(successResponse);

    const result = await routeWithFallback(baseRequest, ['gemini-2-5-pro']);
    expect(result.ok).toBe(true);
    expect(mockRoute).toHaveBeenCalledTimes(1);
  });

  it('falls back to next model on primary failure', async () => {
    mockRoute.mockResolvedValueOnce(failResponse);
    mockRoute.mockResolvedValueOnce(successResponse);

    const result = await routeWithFallback(baseRequest, ['gemini-2-5-pro']);
    expect(result.ok).toBe(true);
    expect(mockRoute).toHaveBeenCalled();
    expect(mockRoute).toHaveBeenLastCalledWith(
      expect.objectContaining({ model: 'gemini-2-5-pro' }),
    );
  });

  it('tries all models in order before failing', async () => {
    mockRoute.mockResolvedValue(failResponse);

    const result = await routeWithFallback(baseRequest, ['gemini-2-5-pro', 'claude-haiku-4-5']);
    expect(result.ok).toBe(false);
    expect(mockRoute).toHaveBeenCalled();
  });

  it('returns last error when all models fail', async () => {
    const lastError = {
      ok: false as const,
      error: { code: 'TIMEOUT' as const, message: 'Timed out', name: 'RouterError' },
    };
    mockRoute.mockResolvedValueOnce(failResponse);
    mockRoute.mockResolvedValueOnce(lastError);

    const result = await routeWithFallback(baseRequest, ['gemini-2-5-pro']);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
    }
  });
});
