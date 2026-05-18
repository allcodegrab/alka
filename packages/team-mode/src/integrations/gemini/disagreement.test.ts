import { describe, it, expect } from 'vitest';
import { detectDisagreements } from './disagreement.js';
import type { ReviewResult } from './types.js';

function makeGeminiResult(overrides: Partial<ReviewResult> = {}): ReviewResult {
  return {
    findings: [],
    summary: 'All good',
    approved: true,
    ...overrides,
  };
}

describe('detectDisagreements', () => {
  it('should detect when Gemini flags HIGH but Claude has no finding', () => {
    const claudeFindings: Array<{ severity: string; location: string; evidence: string }> = [];
    const geminiResult = makeGeminiResult({
      findings: [{ severity: 'high', location: 'src/auth.ts:10', message: 'SQL injection risk' }],
      approved: false,
    });

    const disagreements = detectDisagreements(claudeFindings, geminiResult);
    expect(disagreements).toHaveLength(1);
    expect(disagreements[0]!.topic).toContain('src/auth.ts:10');
    expect(disagreements[0]!.claudeView).toContain('No issue found');
    expect(disagreements[0]!.severity).toBe('high');
  });

  it('should detect when Claude flags HIGH but Gemini approves', () => {
    const claudeFindings = [
      { severity: 'high', location: 'src/db.ts:20', evidence: 'Unvalidated input' },
    ];
    const geminiResult = makeGeminiResult({
      findings: [],
      approved: true,
    });

    const disagreements = detectDisagreements(claudeFindings, geminiResult);
    expect(disagreements).toHaveLength(1);
    expect(disagreements[0]!.topic).toContain('src/db.ts:20');
    expect(disagreements[0]!.geminiView).toContain('approved');
    expect(disagreements[0]!.severity).toBe('high');
  });

  it('should return empty when both agree (no findings)', () => {
    const claudeFindings: Array<{ severity: string; location: string; evidence: string }> = [];
    const geminiResult = makeGeminiResult({
      findings: [],
      approved: true,
    });

    const disagreements = detectDisagreements(claudeFindings, geminiResult);
    expect(disagreements).toHaveLength(0);
  });

  it('should not flag low-severity disagreements', () => {
    const claudeFindings = [
      { severity: 'low', location: 'src/utils.ts:5', evidence: 'Unused variable' },
    ];
    const geminiResult = makeGeminiResult({
      findings: [{ severity: 'low', location: 'src/other.ts:3', message: 'Style issue' }],
      approved: true,
    });

    const disagreements = detectDisagreements(claudeFindings, geminiResult);
    expect(disagreements).toHaveLength(0);
  });
});
