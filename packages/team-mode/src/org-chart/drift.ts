import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { OrgChart } from '@forge/protocol';
import { ok, err, type Result } from '@forge/protocol';
import { OrgChartError } from './errors.js';
import { applyPolicies } from './policy.js';
import { generateExpectedContent } from './generator-utils.js';

export interface DriftReport {
  inSync: boolean;
  missing: string[];
  extra: string[];
  modified: string[];
}

/**
 * Detect drift between the YAML org chart and the generated .claude/agents/*.md files.
 */
export async function detectDrift(
  projectRoot: string,
  orgChart: OrgChart,
): Promise<Result<DriftReport, OrgChartError>> {
  const agentsDir = join(projectRoot, '.claude', 'agents');
  const policies = orgChart.policies ?? [];

  // Get existing .md files in agents dir
  let existingFiles: string[];
  try {
    const entries = await readdir(agentsDir);
    existingFiles = entries.filter((f) => f.endsWith('.md'));
  } catch {
    // Directory doesn't exist — all roles are missing
    return ok({
      inSync: orgChart.roles.length === 0,
      missing: orgChart.roles.map((r) => r.id),
      extra: [],
      modified: [],
    });
  }

  const roleIdSet = new Set<string>(orgChart.roles.map((r) => r.id));
  const existingIdSet = new Set<string>(existingFiles.map((f) => f.replace(/\.md$/, '')));

  const missing: string[] = [];
  const extra: string[] = [];
  const modified: string[] = [];

  // Find missing roles (in YAML but no .md file)
  for (const roleId of roleIdSet) {
    if (!existingIdSet.has(roleId)) {
      missing.push(roleId);
    }
  }

  // Find extra files (.md files with no role in YAML)
  for (const fileId of existingIdSet) {
    if (!roleIdSet.has(fileId)) {
      extra.push(fileId);
    }
  }

  // Check for modified files (content doesn't match expected)
  for (const role of orgChart.roles) {
    if (!existingIdSet.has(role.id)) continue;

    const filePath = join(agentsDir, `${role.id}.md`);
    try {
      const actual = await readFile(filePath, 'utf-8');
      const effectiveRole = applyPolicies(role, policies);
      const expected = generateExpectedContent(effectiveRole);

      if (actual !== expected) {
        modified.push(role.id);
      }
    } catch (e) {
      return err(
        new OrgChartError(
          'IO_ERROR',
          `Failed to read agent file ${filePath}: ${(e as Error).message}`,
        ),
      );
    }
  }

  return ok({
    inSync: missing.length === 0 && extra.length === 0 && modified.length === 0,
    missing,
    extra,
    modified,
  });
}
