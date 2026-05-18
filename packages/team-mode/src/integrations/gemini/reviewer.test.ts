import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isOk, isErr } from '@forge/protocol';
import { reviewPR } from './reviewer.js';

const reviewParams = {
  diff: '--- a/index.ts\n+++ b/index.ts\n@@ -1 +1 @@\n-old\n+new',
  brief: 'Add feature X',
  verifierFindings: 'No issues found',
  decisions: 'Decided to use approach A',
};

describe('reviewPR', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return NO_API_KEY when env var is missing', async () => {
    delete process.env['GEMINI_API_KEY'];

    const result = await reviewPR(reviewParams);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('NO_API_KEY');
  });

  it('should return parsed review on success', async () => {
    const geminiResponse = {
      findings: [{ severity: 'low', location: 'index.ts:1', message: 'Minor style issue' }],
      summary: 'Looks good overall',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(geminiResponse) }],
                },
              },
            ],
          }),
      }),
    );

    const result = await reviewPR(reviewParams);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.findings).toHaveLength(1);
    expect(result.value.summary).toBe('Looks good overall');
    expect(result.value.approved).toBe(true);
  });

  it('should set approved to false when high severity findings exist', async () => {
    const geminiResponse = {
      findings: [{ severity: 'high', location: 'auth.ts:5', message: 'Security issue' }],
      summary: 'Issues found',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(geminiResponse) }],
                },
              },
            ],
          }),
      }),
    );

    const result = await reviewPR(reviewParams);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.approved).toBe(false);
  });

  it('should return AUTH_ERROR for 401 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      }),
    );

    const result = await reviewPR(reviewParams);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('AUTH_ERROR');
  });

  it('should return PARSE_ERROR for invalid JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'not valid json at all' }],
                },
              },
            ],
          }),
      }),
    );

    const result = await reviewPR(reviewParams);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('PARSE_ERROR');
  });
});
