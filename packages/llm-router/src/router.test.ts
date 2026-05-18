import { describe, it, expect, vi, beforeEach } from 'vitest';
import { route, resolveProvider } from './router.js';
import type { LLMRequest } from './providers/types.js';

// Mock the providers so we don't call real APIs
vi.mock('./providers/anthropic.js', () => ({
  AnthropicProvider: class {
    id = 'anthropic';
    models = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'];
    call = vi.fn().mockResolvedValue({
      ok: true,
      value: {
        content: 'Hello from Claude',
        model: 'claude-sonnet-4-6',
        tokensIn: 10,
        tokensOut: 5,
        costUsd: 0.001,
        durationMs: 100,
      },
    });
  },
}));

vi.mock('./providers/gemini.js', () => ({
  GeminiProvider: class {
    id = 'gemini';
    models = ['gemini-2-5-pro', 'gemini-2-5-flash'];
    call = vi.fn().mockResolvedValue({
      ok: true,
      value: {
        content: 'Hello from Gemini',
        model: 'gemini-2-5-pro',
        tokensIn: 10,
        tokensOut: 5,
        costUsd: 0.0005,
        durationMs: 80,
      },
    });
  },
}));

const baseRequest: LLMRequest = {
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Hello' }],
};

describe('resolveProvider', () => {
  it('resolves claude- prefix to anthropic provider', () => {
    const provider = resolveProvider('claude-sonnet-4-6');
    expect(provider).toBeDefined();
    expect(provider!.id).toBe('anthropic');
  });

  it('resolves gemini- prefix to gemini provider', () => {
    const provider = resolveProvider('gemini-2-5-pro');
    expect(provider).toBeDefined();
    expect(provider!.id).toBe('gemini');
  });

  it('returns undefined for unknown model prefix', () => {
    const provider = resolveProvider('gpt-5-4');
    expect(provider).toBeUndefined();
  });
});

describe('route', () => {
  it('routes claude models to anthropic provider', async () => {
    const result = await route(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toBe('Hello from Claude');
    }
  });

  it('routes gemini models to gemini provider', async () => {
    const result = await route({ ...baseRequest, model: 'gemini-2-5-pro' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toBe('Hello from Gemini');
    }
  });

  it('returns error for unknown model', async () => {
    const result = await route({ ...baseRequest, model: 'unknown-model' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_NOT_FOUND');
      expect(result.error.message).toContain('unknown-model');
    }
  });
});
