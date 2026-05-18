import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildGraph } from './builder.js';

describe('buildGraph', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'graph-builder-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should index .ts files as file nodes', async () => {
    await writeFile(join(tmpDir, 'index.ts'), 'export const a = 1;', 'utf-8');
    await writeFile(join(tmpDir, 'util.js'), 'module.exports = {};', 'utf-8');
    await writeFile(join(tmpDir, 'ignore.txt'), 'not indexed', 'utf-8');

    const graph = await buildGraph(tmpDir);

    const files = graph.query({ type: 'file' });
    expect(files).toHaveLength(2);

    const paths = files.map((n) => n.data['path'] as string).sort();
    expect(paths).toEqual(['index.ts', 'util.js']);
  });

  it('should exclude node_modules and .git directories', async () => {
    await mkdir(join(tmpDir, 'node_modules', 'pkg'), { recursive: true });
    await writeFile(join(tmpDir, 'node_modules', 'pkg', 'index.js'), '', 'utf-8');
    await mkdir(join(tmpDir, '.git'), { recursive: true });
    await writeFile(join(tmpDir, '.git', 'config'), '', 'utf-8');
    await writeFile(join(tmpDir, 'app.ts'), 'const x = 1;', 'utf-8');

    const graph = await buildGraph(tmpDir);

    const files = graph.query({ type: 'file' });
    expect(files).toHaveLength(1);
    expect(files[0]!.data['path']).toBe('app.ts');
  });

  it('should parse decisions from decisions.md', async () => {
    const memDir = join(tmpDir, '.claude', 'memory');
    await mkdir(memDir, { recursive: true });

    const decisionsContent = [
      '### dec-001 \u2014 2025-06-01T12:00:00.000Z',
      '**Role:** architect  ',
      '**Type:** architecture  ',
      '**Summary:** Use REST API  ',
      '**Why:** Simpler  ',
      '**Status:** active  ',
      '**Scope:** mission',
      '',
      '### dec-002 \u2014 2025-06-02T12:00:00.000Z',
      '**Role:** developer  ',
      '**Type:** implementation  ',
      '**Summary:** Use TypeScript  ',
      '**Why:** Type safety  ',
      '**Status:** active  ',
      '**Scope:** project',
    ].join('\n');

    await writeFile(join(memDir, 'decisions.md'), decisionsContent, 'utf-8');

    const graph = await buildGraph(tmpDir);

    const decisions = graph.query({ type: 'decision' });
    expect(decisions).toHaveLength(2);
    expect(decisions[0]!.data['id']).toBe('dec-001');
    expect(decisions[0]!.data['role']).toBe('architect');
    expect(decisions[1]!.data['summary']).toBe('Use TypeScript');
  });

  it('should parse conventions from conventions.md', async () => {
    const memDir = join(tmpDir, '.claude', 'memory');
    await mkdir(memDir, { recursive: true });

    const conventionsContent = [
      'All files must use kebab-case naming.',
      '---',
      'Use ESM imports with .js extensions.',
      '---',
      'Write tests for all public APIs.',
    ].join('\n');

    await writeFile(join(memDir, 'conventions.md'), conventionsContent, 'utf-8');

    const graph = await buildGraph(tmpDir);

    const conventions = graph.query({ type: 'convention' });
    expect(conventions).toHaveLength(3);
    expect(conventions[0]!.data['content']).toBe('All files must use kebab-case naming.');
  });

  it('should create mission nodes from dashboard.json', async () => {
    const missionDir = join(tmpDir, '.claude', 'missions', 'mission-001');
    await mkdir(missionDir, { recursive: true });

    const dashboard = {
      missionId: 'mission-001',
      name: 'Test Mission',
      mode: 'standard',
      status: 'active',
      startedAt: '2025-06-01T00:00:00.000Z',
      roles: [],
      totalCostUsd: 0,
      slicesTotal: 3,
      slicesCompleted: 1,
    };

    await writeFile(join(missionDir, 'dashboard.json'), JSON.stringify(dashboard), 'utf-8');

    const graph = await buildGraph(tmpDir);

    const missions = graph.query({ type: 'mission' });
    expect(missions).toHaveLength(1);
    expect(missions[0]!.data['name']).toBe('Test Mission');
    expect(missions[0]!.data['status']).toBe('active');
    expect(missions[0]!.data['mode']).toBe('standard');
  });
});
