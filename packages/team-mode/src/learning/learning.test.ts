import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadLearningConfig } from './config.js';
import { crawlSource } from './crawler.js';
import { generateProposal } from './proposal.js';
import { applyProposal, rejectProposal } from './workflow.js';
import type { LearningSource, CrawlResult } from './types.js';

describe('loadLearningConfig', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'learning-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should load a valid learning config', async () => {
    const configDir = join(tmpDir, '.forge');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      join(configDir, 'learning.yaml'),
      `enabled: true\nsources:\n  tier1:\n    - id: ts-docs\n      url: https://example.com\n      cadence: daily\n      tier: 1\n  tier2: []\noutputDir: .claude/learning\n`,
      'utf-8',
    );

    const result = await loadLearningConfig(tmpDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.enabled).toBe(true);
    expect(result.value.sources.tier1).toHaveLength(1);
  });

  it('should return error when config file is missing', async () => {
    const result = await loadLearningConfig(tmpDir);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('IO_ERROR');
  });
});

describe('crawlSource', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const source: LearningSource = {
    id: 'test-source',
    url: 'https://example.com/docs',
    cadence: 'daily',
    tier: 1,
  };

  it('should detect change when hash differs from snapshot', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('new content'),
    });

    const result = await crawlSource(source, 'old-hash');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.changed).toBe(true);
    expect(result.value.summary).toBeDefined();
  });

  it('should detect no change when hash matches', async () => {
    const { createHash } = await import('node:crypto');
    const content = 'same content';
    const hash = createHash('sha256').update(content).digest('hex');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(content),
    });

    const result = await crawlSource(source, hash);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.changed).toBe(false);
  });

  it('should return error on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await crawlSource(source);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('CRAWL_ERROR');
  });
});

describe('generateProposal', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'proposal-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should generate a proposal file with correct structure', async () => {
    const crawlResult: CrawlResult = {
      sourceId: 'ts-docs',
      url: 'https://example.com/docs',
      changed: true,
      summary: 'API updated',
      detectedAt: '2026-01-15T10:00:00.000Z',
    };

    const source: LearningSource = {
      id: 'ts-docs',
      url: 'https://example.com/docs',
      cadence: 'daily',
      tier: 1,
      tags: ['typescript'],
      relevantToSkills: ['frontend'],
    };

    const result = await generateProposal(tmpDir, crawlResult, source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const content = await readFile(result.value, 'utf-8');
    expect(content).toContain('# Learning Proposal: ts-docs');
    expect(content).toContain('**Source:** https://example.com/docs');
    expect(content).toContain('API updated');
    expect(content).toContain('frontend');
  });
});

describe('workflow', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'workflow-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should move proposal to applied directory', async () => {
    const proposalDir = join(tmpDir, '.claude', 'learning', 'proposals', '2026-01-15');
    await mkdir(proposalDir, { recursive: true });
    const proposalPath = join(proposalDir, 'test-source.md');
    await writeFile(proposalPath, '# Test Proposal\n', 'utf-8');

    const result = await applyProposal(tmpDir, proposalPath);
    expect(result.ok).toBe(true);

    const appliedPath = join(tmpDir, '.claude', 'learning', 'applied', 'test-source.md');
    await expect(access(appliedPath)).resolves.toBeUndefined();
  });

  it('should move proposal to rejected directory with reason', async () => {
    const proposalDir = join(tmpDir, '.claude', 'learning', 'proposals', '2026-01-15');
    await mkdir(proposalDir, { recursive: true });
    const proposalPath = join(proposalDir, 'test-source.md');
    await writeFile(proposalPath, '# Test Proposal\n', 'utf-8');

    const result = await rejectProposal(tmpDir, proposalPath, 'Not relevant');
    expect(result.ok).toBe(true);

    const rejectedPath = join(tmpDir, '.claude', 'learning', 'rejected', 'test-source.md');
    const content = await readFile(rejectedPath, 'utf-8');
    expect(content).toContain('Not relevant');
  });
});
