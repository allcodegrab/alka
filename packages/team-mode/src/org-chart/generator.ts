import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { OrgChart } from '@forge/protocol';
import { ok, err, type Result } from '@forge/protocol';
import { OrgChartError } from './errors.js';
import { applyPolicies } from './policy.js';
import { generateExpectedContent } from './generator-utils.js';

/**
 * Generate .claude/agents/<role-id>.md files for each role in the org chart.
 * Returns the list of generated file paths.
 */
export async function generateAgentFiles(
  projectRoot: string,
  orgChart: OrgChart,
): Promise<Result<string[], OrgChartError>> {
  const agentsDir = join(projectRoot, '.claude', 'agents');

  try {
    await mkdir(agentsDir, { recursive: true });
  } catch (e) {
    return err(
      new OrgChartError('IO_ERROR', `Failed to create agents directory: ${(e as Error).message}`),
    );
  }

  const policies = orgChart.policies ?? [];
  const generatedPaths: string[] = [];

  for (const role of orgChart.roles) {
    const effectiveRole = applyPolicies(role, policies);
    const filePath = join(agentsDir, `${role.id}.md`);
    const content = generateExpectedContent(effectiveRole);

    try {
      await writeFile(filePath, content, 'utf-8');
      generatedPaths.push(filePath);
    } catch (e) {
      return err(
        new OrgChartError(
          'IO_ERROR',
          `Failed to write agent file ${filePath}: ${(e as Error).message}`,
        ),
      );
    }
  }

  return ok(generatedPaths);
}
