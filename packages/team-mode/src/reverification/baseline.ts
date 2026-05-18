import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { TestResult } from './types.js';

function baselinePath(projectRoot: string): string {
  return join(projectRoot, '.forge', 'reverification', 'baseline.json');
}

export async function saveBaseline(projectRoot: string, results: TestResult[]): Promise<void> {
  const path = baselinePath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(results, null, 2) + '\n', 'utf-8');
}

export async function loadBaseline(projectRoot: string): Promise<TestResult[]> {
  const path = baselinePath(projectRoot);
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as TestResult[];
  } catch {
    return [];
  }
}
