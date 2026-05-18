import { ok, err, type Result } from '@forge/protocol';
import { RouterError } from '../errors.js';
import { calculateCost } from '../cost.js';
import type { LLMProvider, LLMRequest, LLMResponse } from './types.js';

interface GeminiContent {
  parts: Array<{ text: string }>;
  role: string;
}

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: GeminiUsageMetadata;
}

export class GeminiProvider implements LLMProvider {
  id = 'gemini';
  models = ['gemini-2-5-pro', 'gemini-2-5-flash'];

  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  async call(request: LLMRequest): Promise<Result<LLMResponse, RouterError>> {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return err(new RouterError('AUTH_ERROR', 'GEMINI_API_KEY environment variable is not set'));
    }

    const start = Date.now();
    const url = `${this.baseUrl}/${request.model}:generateContent?key=${apiKey}`;

    const contents: GeminiContent[] = request.messages.map((m) => ({
      parts: [{ text: m.content }],
      role: m.role === 'assistant' ? 'model' : 'user',
    }));

    const body: Record<string, unknown> = { contents };

    if (request.systemPrompt) {
      body['systemInstruction'] = { parts: [{ text: request.systemPrompt }] };
    }

    const generationConfig: Record<string, unknown> = {};
    if (request.maxTokens) {
      generationConfig['maxOutputTokens'] = request.maxTokens;
    }
    if (request.temperature !== undefined) {
      generationConfig['temperature'] = request.temperature;
    }
    if (Object.keys(generationConfig).length > 0) {
      body['generationConfig'] = generationConfig;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || response.status === 403) {
          return err(new RouterError('AUTH_ERROR', `Gemini authentication failed: ${errorText}`));
        }
        return err(
          new RouterError('API_ERROR', `Gemini API error (${response.status}): ${errorText}`),
        );
      }

      const data = (await response.json()) as GeminiResponse;
      const durationMs = Date.now() - start;

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const tokensIn =
        data.usageMetadata?.promptTokenCount ?? Math.ceil(JSON.stringify(contents).length / 4);
      const tokensOut = data.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
      const costUsd = calculateCost(request.model, tokensIn, tokensOut);

      return ok({
        content: text,
        model: request.model,
        tokensIn,
        tokensOut,
        costUsd,
        durationMs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return err(new RouterError('TIMEOUT', `Gemini request timed out: ${message}`));
      }
      return err(new RouterError('API_ERROR', `Gemini call failed: ${message}`));
    }
  }
}
