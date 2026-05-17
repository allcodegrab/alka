import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { discoverSkillFiles } from './discovery.js';

// Navigate up from packages/skill-loader/ to project root
const PROJECT_ROOT = join(import.meta.dirname, '..', '..', '..');
const SKILLS_DIR = join(PROJECT_ROOT, '.claude', 'skills');

describe('discoverSkillFiles', () => {
  it('discovers real skill files from .claude/skills/', async () => {
    const result = await discoverSkillFiles(SKILLS_DIR);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.length).toBeGreaterThanOrEqual(20);
    expect(result.value.every((p) => p.endsWith('SKILL.md'))).toBe(true);
  });

  it('returns sorted paths', async () => {
    const result = await discoverSkillFiles(SKILLS_DIR);
    if (!result.ok) return;

    const sorted = [...result.value].sort();
    expect(result.value).toEqual(sorted);
  });

  it('returns error for non-existent directory', async () => {
    const result = await discoverSkillFiles('/nonexistent/path');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('DISCOVERY_ERROR');
  });
});
