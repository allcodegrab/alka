import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { OrgChartSchema, type OrgChart, ok, err, type Result } from '@forge/protocol';
import { OrgChartError } from './errors.js';

/**
 * Parse a .forge/org-chart.yaml file into a validated OrgChart object.
 */
export async function parseOrgChart(filePath: string): Promise<Result<OrgChart, OrgChartError>> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (e) {
    return err(
      new OrgChartError(
        'IO_ERROR',
        `Failed to read org chart file: ${filePath}: ${(e as Error).message}`,
      ),
    );
  }

  let raw: unknown;
  try {
    raw = parseYaml(content);
  } catch (e) {
    return err(new OrgChartError('PARSE_ERROR', `Failed to parse YAML: ${(e as Error).message}`));
  }

  const result = OrgChartSchema.safeParse(raw);
  if (!result.success) {
    return err(
      new OrgChartError('VALIDATION_ERROR', `Schema validation failed: ${result.error.message}`),
    );
  }

  return ok(result.data);
}
