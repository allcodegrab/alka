import type { SmeConsultResponse } from './types.js';

export function validateSmeResponse(response: SmeConsultResponse): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (response.confidence === 'high' && response.citations.length === 0) {
    errors.push('High confidence responses must include at least 1 citation');
  }

  if (!response.answer || response.answer.trim().length === 0) {
    errors.push('Answer must not be empty');
  }

  return { valid: errors.length === 0, errors };
}
