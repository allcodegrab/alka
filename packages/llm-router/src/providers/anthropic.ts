import { ok, err, type Result } from '@forge/protocol';
import { execFile } from 'node:child_process';
import { RouterError } from '../errors.js';
import { calculateCost } from '../cost.js';
import type { LLMProvider, LLMRequest, LLMResponse } from './types.js';

export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';
  models = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'];

  async call(request: LLMRequest): Promise<Result<LLMResponse, RouterError>> {
    const start = Date.now();

    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) {
      return err(new RouterError('API_ERROR', 'No user message provided'));
    }

    const args = ['--print', '--model', request.model];
    if (request.systemPrompt) {
      args.push('--system-prompt', request.systemPrompt);
    }
    if (request.maxTokens) {
      args.push('--max-tokens', String(request.maxTokens));
    }
    args.push(lastUserMessage.content);

    try {
      const output = await this.exec('claude', args);
      const durationMs = Date.now() - start;

      // Estimate tokens from character count when precise counts unavailable
      const tokensIn = Math.ceil(lastUserMessage.content.length / 4);
      const tokensOut = Math.ceil(output.length / 4);
      const costUsd = calculateCost(request.model, tokensIn, tokensOut);

      return ok({
        content: output,
        model: request.model,
        tokensIn,
        tokensOut,
        costUsd,
        durationMs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not found') || message.includes('ENOENT')) {
        return err(
          new RouterError(
            'AUTH_ERROR',
            'Claude CLI not found. Install with: npm i -g @anthropic-ai/claude-cli',
          ),
        );
      }
      return err(new RouterError('API_ERROR', `Anthropic call failed: ${message}`));
    }
  }

  private exec(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(command, args, { timeout: 120_000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout.trim());
      });
    });
  }
}
