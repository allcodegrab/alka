import { describe, it, expect } from 'vitest';
import type { SkillContent } from '@forge/protocol';
import { formatSkillsForPrompt, estimateTokenCount } from './injector.js';

describe('formatSkillsForPrompt', () => {
  it('formats skills with XML-style tags', () => {
    const skills: SkillContent[] = [
      {
        manifest: { name: 'test-skill', description: 'A test', filePath: '/a' },
        body: '# Test\nSome content.',
      },
    ];

    const result = formatSkillsForPrompt(skills);
    expect(result).toContain('# Loaded Skills');
    expect(result).toContain('<skill name="test-skill">');
    expect(result).toContain('# Test\nSome content.');
    expect(result).toContain('</skill>');
  });

  it('formats multiple skills', () => {
    const skills: SkillContent[] = [
      { manifest: { name: 'a', description: '', filePath: '/a' }, body: 'Body A' },
      { manifest: { name: 'b', description: '', filePath: '/b' }, body: 'Body B' },
    ];

    const result = formatSkillsForPrompt(skills);
    expect(result).toContain('<skill name="a">');
    expect(result).toContain('<skill name="b">');
  });

  it('returns empty string for no skills', () => {
    expect(formatSkillsForPrompt([])).toBe('');
  });
});

describe('estimateTokenCount', () => {
  it('estimates ~4 chars per token', () => {
    const text = 'a'.repeat(400);
    expect(estimateTokenCount(text)).toBe(100);
  });

  it('handles empty string', () => {
    expect(estimateTokenCount('')).toBe(0);
  });
});
