import { ok, err, type Result } from '@forge/protocol';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'yaml';
import { LearningError } from './errors.js';
import type { LearningConfig } from './types.js';

export async function loadLearningConfig(
  projectRoot: string,
): Promise<Result<LearningConfig, LearningError>> {
  const configPath = join(projectRoot, '.forge', 'learning.yaml');

  try {
    const content = await readFile(configPath, 'utf-8');
    const parsed = yaml.parse(content) as LearningConfig;

    if (typeof parsed.enabled !== 'boolean') {
      return err(new LearningError('CONFIG_ERROR', 'learning.yaml: "enabled" must be a boolean'));
    }

    if (!parsed.sources) {
      return err(new LearningError('CONFIG_ERROR', 'learning.yaml: "sources" is required'));
    }

    return ok({
      enabled: parsed.enabled,
      sources: {
        tier1: parsed.sources.tier1 ?? [],
        tier2: parsed.sources.tier2 ?? [],
      },
      outputDir: parsed.outputDir ?? '.claude/learning',
    });
  } catch (error) {
    return err(
      new LearningError('IO_ERROR', `Failed to load learning config: ${(error as Error).message}`),
    );
  }
}
