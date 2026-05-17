import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { generateAgentFiles } from './generator.js';
import { parseOrgChart } from './parser.js';

const PROJECT_ROOT = join(import.meta.dirname, '..', '..', '..', '..');

describe('generateAgentFiles', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `org-chart-gen-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should generate .md files for all roles', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const result = await generateAgentFiles(tmpDir, parseResult.value);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(16);
    expect(result.value).toContain(join(tmpDir, '.claude', 'agents', 'vp-engineering.md'));
    expect(result.value).toContain(join(tmpDir, '.claude', 'agents', 'architect.md'));
    expect(result.value).toContain(join(tmpDir, '.claude', 'agents', 'impl-a.md'));
  });

  it('should generate valid YAML frontmatter', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    await generateAgentFiles(tmpDir, parseResult.value);

    const vpContent = await readFile(
      join(tmpDir, '.claude', 'agents', 'vp-engineering.md'),
      'utf-8',
    );

    expect(vpContent).toMatch(/^---\n/);
    expect(vpContent).toContain('name: VP Engineering');
    expect(vpContent).toContain('model: claude-opus-4-7');
    expect(vpContent).toContain('maxTurns: 80');
    expect(vpContent).toContain('# VP Engineering');
    expect(vpContent).toContain('Tier: leadership');
    expect(vpContent).toContain('Reports to: cto');
    expect(vpContent).toContain('Color: blue');
  });

  it('should include tools and skills in frontmatter', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    await generateAgentFiles(tmpDir, parseResult.value);

    const implContent = await readFile(join(tmpDir, '.claude', 'agents', 'impl-a.md'), 'utf-8');

    expect(implContent).toContain('  - Read');
    expect(implContent).toContain('  - Edit');
    expect(implContent).toContain('  - engineering-excellence');
    expect(implContent).toContain('  - surgical-edits');
  });

  it('should create .claude/agents/ directory if it does not exist', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const result = await generateAgentFiles(tmpDir, parseResult.value);
    expect(result.ok).toBe(true);
  });
});
