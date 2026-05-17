import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parseSkillFile, parseSkillFileCached, clearCache } from './parser.js';

const PROJECT_ROOT = join(import.meta.dirname, '..', '..', '..');
const SKILLS_DIR = join(PROJECT_ROOT, '.claude', 'skills');

describe('parseSkillFile', () => {
  it('parses a real SKILL.md file', async () => {
    const filePath = join(SKILLS_DIR, 'surgical-edits', 'SKILL.md');
    const result = await parseSkillFile(filePath);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.manifest.name).toBe('surgical-edits');
    expect(result.value.manifest.description).toContain('smallest correct change');
    expect(result.value.body).toContain('# Surgical Edits');
  });

  it('parses engineering-excellence SKILL.md', async () => {
    const filePath = join(SKILLS_DIR, 'engineering-excellence', 'SKILL.md');
    const result = await parseSkillFile(filePath);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.manifest.name).toBe('engineering-excellence');
    expect(result.value.body.length).toBeGreaterThan(1000);
  });

  it('returns error for file without frontmatter', async () => {
    const tempDir = join(tmpdir(), `skill-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = join(tempDir, 'SKILL.md');
    await writeFile(filePath, '# No frontmatter\nJust content.');

    const result = await parseSkillFile(filePath);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('PARSE_ERROR');

    await rm(tempDir, { recursive: true });
  });

  it('returns error for non-existent file', async () => {
    const result = await parseSkillFile('/nonexistent/SKILL.md');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('IO_ERROR');
  });
});

describe('parseSkillFileCached', () => {
  afterEach(() => clearCache());

  it('returns cached result on second call', async () => {
    const filePath = join(SKILLS_DIR, 'surgical-edits', 'SKILL.md');

    const result1 = await parseSkillFileCached(filePath);
    const result2 = await parseSkillFileCached(filePath);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    if (result1.ok && result2.ok) {
      expect(result1.value.manifest.name).toBe(result2.value.manifest.name);
      // Same object reference from cache
      expect(result1.value).toBe(result2.value);
    }
  });
});
