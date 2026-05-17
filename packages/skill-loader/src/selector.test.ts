import { describe, it, expect } from 'vitest';
import type { SkillContent } from '@forge/protocol';
import { selectSkillsForRole } from './selector.js';

const mockSkills: SkillContent[] = [
  {
    manifest: { name: 'engineering-excellence', description: 'The loop', filePath: '/a' },
    body: '# EE',
  },
  {
    manifest: { name: 'surgical-edits', description: 'Minimal edits', filePath: '/b' },
    body: '# SE',
  },
  {
    manifest: { name: 'testing-discipline', description: 'What to test', filePath: '/c' },
    body: '# TD',
  },
  {
    manifest: { name: 'version-control-craft', description: 'Git craft', filePath: '/d' },
    body: '# VCC',
  },
];

describe('selectSkillsForRole', () => {
  it('selects matching skills by name', () => {
    const result = selectSkillsForRole(mockSkills, ['engineering-excellence', 'surgical-edits']);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(2);
    expect(result.value[0]!.manifest.name).toBe('engineering-excellence');
    expect(result.value[1]!.manifest.name).toBe('surgical-edits');
  });

  it('returns error for missing skills', () => {
    const result = selectSkillsForRole(mockSkills, ['engineering-excellence', 'nonexistent-skill']);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(result.error.message).toContain('nonexistent-skill');
  });

  it('returns empty array for empty skill list', () => {
    const result = selectSkillsForRole(mockSkills, []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(0);
  });
});
