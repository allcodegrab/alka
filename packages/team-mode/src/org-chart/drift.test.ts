import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { detectDrift } from './drift.js';
import { generateAgentFiles } from './generator.js';
import { parseOrgChart } from './parser.js';

const PROJECT_ROOT = join(import.meta.dirname, '..', '..', '..', '..');

describe('detectDrift', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `org-chart-drift-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should report all roles as missing when no .md files exist', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const result = await detectDrift(tmpDir, parseResult.value);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.inSync).toBe(false);
    expect(result.value.missing).toHaveLength(16);
    expect(result.value.missing).toContain('vp-engineering');
    expect(result.value.extra).toHaveLength(0);
    expect(result.value.modified).toHaveLength(0);
  });

  it('should report in sync after generating files', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    await generateAgentFiles(tmpDir, parseResult.value);

    const result = await detectDrift(tmpDir, parseResult.value);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.inSync).toBe(true);
    expect(result.value.missing).toHaveLength(0);
    expect(result.value.extra).toHaveLength(0);
    expect(result.value.modified).toHaveLength(0);
  });

  it('should detect extra .md files', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    await generateAgentFiles(tmpDir, parseResult.value);

    // Add an extra file
    const agentsDir = join(tmpDir, '.claude', 'agents');
    await writeFile(join(agentsDir, 'extra-role.md'), '# Extra', 'utf-8');

    const result = await detectDrift(tmpDir, parseResult.value);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.inSync).toBe(false);
    expect(result.value.extra).toContain('extra-role');
  });

  it('should detect modified .md files', async () => {
    const parseResult = await parseOrgChart(join(PROJECT_ROOT, '.forge', 'org-chart.yaml'));
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    await generateAgentFiles(tmpDir, parseResult.value);

    // Modify a file
    const filePath = join(tmpDir, '.claude', 'agents', 'architect.md');
    await writeFile(filePath, '# Modified content', 'utf-8');

    const result = await detectDrift(tmpDir, parseResult.value);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.inSync).toBe(false);
    expect(result.value.modified).toContain('architect');
  });
});
