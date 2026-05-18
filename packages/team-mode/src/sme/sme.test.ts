import { describe, it, expect } from 'vitest';
import { isValidDomain, getSmeRoleId } from './registry.js';
import { validateSmeResponse } from './validator.js';
import { consultSme } from './consult.js';
import type { SmeConsultResponse } from './types.js';

describe('isValidDomain', () => {
  it('should return true for valid domains', () => {
    expect(isValidDomain('java-spring')).toBe(true);
    expect(isValidDomain('typescript-frontend')).toBe(true);
    expect(isValidDomain('aws-cloud')).toBe(true);
  });

  it('should return false for invalid domains', () => {
    expect(isValidDomain('python-django')).toBe(false);
    expect(isValidDomain('')).toBe(false);
  });
});

describe('getSmeRoleId', () => {
  it('should return sme-<domain> format', () => {
    expect(getSmeRoleId('java-spring')).toBe('sme-java-spring');
    expect(getSmeRoleId('voice-ai')).toBe('sme-voice-ai');
  });
});

describe('validateSmeResponse', () => {
  it('should reject high confidence without citations', () => {
    const response: SmeConsultResponse = {
      answer: 'Use Spring Boot',
      citations: [],
      confidence: 'high',
      domain: 'java-spring',
      respondedAt: new Date().toISOString(),
    };

    const result = validateSmeResponse(response);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('citation'))).toBe(true);
  });

  it('should accept medium confidence without citations', () => {
    const response: SmeConsultResponse = {
      answer: 'Consider using React hooks',
      citations: [],
      confidence: 'medium',
      domain: 'typescript-frontend',
      respondedAt: new Date().toISOString(),
    };

    const result = validateSmeResponse(response);
    expect(result.valid).toBe(true);
  });

  it('should accept high confidence with citations', () => {
    const response: SmeConsultResponse = {
      answer: 'Use DynamoDB for this case',
      citations: ['https://docs.aws.amazon.com/dynamodb'],
      confidence: 'high',
      domain: 'aws-cloud',
      respondedAt: new Date().toISOString(),
    };

    const result = validateSmeResponse(response);
    expect(result.valid).toBe(true);
  });
});

describe('consultSme', () => {
  it('should return a stub response for a valid domain', async () => {
    const result = await consultSme('/tmp/test', {
      domain: 'typescript-frontend',
      question: 'How to optimize React rendering?',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.domain).toBe('typescript-frontend');
    expect(result.value.answer).toBeTruthy();
    expect(result.value.respondedAt).toBeTruthy();
  });

  it('should return error for invalid domain', async () => {
    const result = await consultSme('/tmp/test', {
      domain: 'invalid-domain' as never,
      question: 'test',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('DOMAIN_NOT_FOUND');
  });
});
