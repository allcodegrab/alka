import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseOrgChart, generateAgentFiles, detectDrift, applyPolicies } from '@forge/team-mode';

const REAL_ORG_CHART_PATH = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '.forge',
  'org-chart.yaml',
);

describe('org-chart lifecycle (e2e)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'org-chart-e2e-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should parse the real org-chart.yaml and find 16 roles', async () => {
    const result = await parseOrgChart(REAL_ORG_CHART_PATH);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.roles).toHaveLength(16);
    expect(result.value.roles.map((r) => r.id)).toContain('vp-engineering');
    expect(result.value.roles.map((r) => r.id)).toContain('architect');
    expect(result.value.roles.map((r) => r.id)).toContain('pr-reviewer');
  });

  it('should generate 16 agent .md files', async () => {
    const parseResult = await parseOrgChart(REAL_ORG_CHART_PATH);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const genResult = await generateAgentFiles(tmpDir, parseResult.value);
    expect(genResult.ok).toBe(true);
    if (!genResult.ok) return;

    expect(genResult.value).toHaveLength(16);
    for (const filePath of genResult.value) {
      await expect(access(filePath)).resolves.toBeUndefined();
    }
  });

  it('should detect inSync: true after generation', async () => {
    const parseResult = await parseOrgChart(REAL_ORG_CHART_PATH);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    await generateAgentFiles(tmpDir, parseResult.value);

    const driftResult = await detectDrift(tmpDir, parseResult.value);
    expect(driftResult.ok).toBe(true);
    if (!driftResult.ok) return;

    expect(driftResult.value.inSync).toBe(true);
    expect(driftResult.value.missing).toHaveLength(0);
    expect(driftResult.value.extra).toHaveLength(0);
    expect(driftResult.value.modified).toHaveLength(0);
  });

  it('should detect drift after modifying a generated file', async () => {
    const parseResult = await parseOrgChart(REAL_ORG_CHART_PATH);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    await generateAgentFiles(tmpDir, parseResult.value);

    // Modify a generated file
    const architectFile = join(tmpDir, '.claude', 'agents', 'architect.md');
    const original = await readFile(architectFile, 'utf-8');
    await writeFile(architectFile, original + '\n# Modified!', 'utf-8');

    const driftResult = await detectDrift(tmpDir, parseResult.value);
    expect(driftResult.ok).toBe(true);
    if (!driftResult.ok) return;

    expect(driftResult.value.inSync).toBe(false);
    expect(driftResult.value.modified).toContain('architect');
  });

  it('should apply verifier policy with disallowed tools', async () => {
    const parseResult = await parseOrgChart(REAL_ORG_CHART_PATH);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const securityVerifier = parseResult.value.roles.find((r) => r.id === 'security-verifier');
    expect(securityVerifier).toBeDefined();

    const policies = parseResult.value.policies ?? [];
    const effective = applyPolicies(securityVerifier!, policies);

    expect(effective.disallowedTools).toBeDefined();
    expect(effective.disallowedTools).toContain('Edit');
    expect(effective.disallowedTools).toContain('Write');
  });
});
