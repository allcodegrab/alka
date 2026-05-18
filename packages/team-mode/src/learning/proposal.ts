import { ok, err, type Result } from '@forge/protocol';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LearningError } from './errors.js';
import type { CrawlResult, LearningSource } from './types.js';

export async function generateProposal(
  projectRoot: string,
  result: CrawlResult,
  sourceConfig: LearningSource,
): Promise<Result<string, LearningError>> {
  try {
    const dateStr = result.detectedAt.slice(0, 10);
    const proposalDir = join(projectRoot, '.claude', 'learning', 'proposals', dateStr);
    await mkdir(proposalDir, { recursive: true });

    const proposalPath = join(proposalDir, `${sourceConfig.id}.md`);
    const skills = sourceConfig.relevantToSkills?.join(', ') ?? 'general';
    const tags = sourceConfig.tags?.join(', ') ?? 'none';

    const content = [
      `# Learning Proposal: ${sourceConfig.id}`,
      '',
      `**Source:** ${result.url}`,
      `**Detected:** ${result.detectedAt}`,
      `**Confidence:** medium`,
      `**Tier:** ${sourceConfig.tier}`,
      `**Tags:** ${tags}`,
      '',
      '## What Changed',
      '',
      result.summary ?? 'No summary available.',
      '',
      '## Affected Skills',
      '',
      skills,
      '',
      '## CTO Action Options',
      '',
      '- [ ] Apply this proposal',
      '- [ ] Reject with reason',
      '- [ ] Defer to next review cycle',
      '',
    ].join('\n');

    await writeFile(proposalPath, content, 'utf-8');
    return ok(proposalPath);
  } catch (error) {
    return err(
      new LearningError('IO_ERROR', `Failed to generate proposal: ${(error as Error).message}`),
    );
  }
}
