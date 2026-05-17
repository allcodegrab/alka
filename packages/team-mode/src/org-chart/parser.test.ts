import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parseOrgChart } from './parser.js';

const PROJECT_ROOT = join(import.meta.dirname, '..', '..', '..', '..');

describe('parseOrgChart', () => {
  it('should parse the real .forge/org-chart.yaml successfully', async () => {
    const filePath = join(PROJECT_ROOT, '.forge', 'org-chart.yaml');
    const result = await parseOrgChart(filePath);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.version).toBe(1);
    expect(result.value.name).toBe('Forge In-House Team');
    expect(result.value.cto).toBe('shashank');
    expect(result.value.roles).toHaveLength(3);
    expect(result.value.policies).toHaveLength(2);
  });

  it('should validate role fields correctly', async () => {
    const filePath = join(PROJECT_ROOT, '.forge', 'org-chart.yaml');
    const result = await parseOrgChart(filePath);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const vp = result.value.roles.find((r) => r.id === 'vp-engineering');
    expect(vp).toBeDefined();
    expect(vp!.title).toBe('VP Engineering');
    expect(vp!.tier).toBe('leadership');
    expect(vp!.model).toBe('claude-opus-4-7');
    expect(vp!.tools).toContain('Read');
    expect(vp!.maxTurns).toBe(80);
    expect(vp!.mustEscalate).toContain('mission_brief');
  });

  it('should return IO_ERROR for missing file', async () => {
    const result = await parseOrgChart('/nonexistent/path/org-chart.yaml');

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe('IO_ERROR');
  });

  it('should return PARSE_ERROR for invalid YAML', async () => {
    const tmpDir = join(tmpdir(), `org-chart-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    const filePath = join(tmpDir, 'bad.yaml');
    await writeFile(filePath, '{{{{invalid yaml: [[[', 'utf-8');

    try {
      const result = await parseOrgChart(filePath);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('PARSE_ERROR');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should return VALIDATION_ERROR for valid YAML with wrong schema', async () => {
    const tmpDir = join(tmpdir(), `org-chart-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    const filePath = join(tmpDir, 'bad-schema.yaml');
    await writeFile(filePath, 'version: "not-a-number"\nname: test\n', 'utf-8');

    try {
      const result = await parseOrgChart(filePath);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
