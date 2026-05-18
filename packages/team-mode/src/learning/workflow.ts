import { ok, err, type Result } from '@forge/protocol';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LearningError } from './errors.js';

export async function applyProposal(
  projectRoot: string,
  proposalPath: string,
): Promise<Result<void, LearningError>> {
  try {
    const appliedDir = join(projectRoot, '.claude', 'learning', 'applied');
    await mkdir(appliedDir, { recursive: true });

    const fileName = proposalPath.split('/').pop() ?? 'unknown.md';
    const destPath = join(appliedDir, fileName);

    await rename(proposalPath, destPath);
    return ok(undefined);
  } catch (error) {
    return err(
      new LearningError('IO_ERROR', `Failed to apply proposal: ${(error as Error).message}`),
    );
  }
}

export async function rejectProposal(
  projectRoot: string,
  proposalPath: string,
  reason: string,
): Promise<Result<void, LearningError>> {
  try {
    const rejectedDir = join(projectRoot, '.claude', 'learning', 'rejected');
    await mkdir(rejectedDir, { recursive: true });

    const content = await readFile(proposalPath, 'utf-8');
    const withReason = content + `\n## Rejection Reason\n\n${reason}\n`;

    const fileName = proposalPath.split('/').pop() ?? 'unknown.md';
    const destPath = join(rejectedDir, fileName);

    await writeFile(destPath, withReason, 'utf-8');

    await unlink(proposalPath);

    return ok(undefined);
  } catch (error) {
    return err(
      new LearningError('IO_ERROR', `Failed to reject proposal: ${(error as Error).message}`),
    );
  }
}
