import type { Result } from '@forge/protocol';
import type { RouterError } from '../errors.js';

export interface LLMRequest {
  model: string;
  systemPrompt?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  durationMs: number;
}

export interface LLMProvider {
  id: string;
  models: string[];
  call(request: LLMRequest): Promise<Result<LLMResponse, RouterError>>;
}
