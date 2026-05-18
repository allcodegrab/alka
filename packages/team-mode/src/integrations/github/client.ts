import { ok, err, type Result } from '@forge/protocol';
import { execFile } from 'node:child_process';
import { GitHubError } from './errors.js';

function exec(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('gh', args, { timeout: 30_000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function classifyError(message: string): GitHubError {
  if (message.includes('authentication') || message.includes('401') || message.includes('login')) {
    return new GitHubError('AUTH_ERROR', message);
  }
  if (
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('Could not resolve')
  ) {
    return new GitHubError('NOT_FOUND', message);
  }
  if (message.includes('ENOENT') || message.includes('not installed')) {
    return new GitHubError('CLI_ERROR', 'GitHub CLI (gh) is not installed or not in PATH');
  }
  return new GitHubError('API_ERROR', message);
}

export async function createBranch(
  repo: string,
  branch: string,
  base?: string,
): Promise<Result<void, GitHubError>> {
  try {
    // Get base SHA
    const baseBranch = base ?? 'main';
    const sha = await exec([
      'api',
      `repos/${repo}/git/ref/heads/${baseBranch}`,
      '--jq',
      '.object.sha',
    ]);

    await exec([
      'api',
      `repos/${repo}/git/refs`,
      '-f',
      `ref=refs/heads/${branch}`,
      '-f',
      `sha=${sha}`,
    ]);

    return ok(undefined);
  } catch (error) {
    return err(classifyError(error instanceof Error ? error.message : String(error)));
  }
}

export async function openPR(
  repo: string,
  title: string,
  body: string,
  head: string,
  base?: string,
): Promise<Result<number, GitHubError>> {
  try {
    const args = ['pr', 'create', '--repo', repo, '--title', title, '--body', body, '--head', head];
    if (base) {
      args.push('--base', base);
    }

    const output = await exec(args);
    // gh pr create outputs the PR URL; extract the number from it
    const match = output.match(/\/pull\/(\d+)/);
    const prNumber = match ? parseInt(match[1]!, 10) : 0;
    return ok(prNumber);
  } catch (error) {
    return err(classifyError(error instanceof Error ? error.message : String(error)));
  }
}

export async function mergePR(repo: string, prNumber: number): Promise<Result<void, GitHubError>> {
  try {
    await exec(['pr', 'merge', String(prNumber), '--repo', repo, '--squash']);
    return ok(undefined);
  } catch (error) {
    return err(classifyError(error instanceof Error ? error.message : String(error)));
  }
}

export async function createIssue(
  repo: string,
  title: string,
  body: string,
  labels?: string[],
): Promise<Result<number, GitHubError>> {
  try {
    const args = ['issue', 'create', '--repo', repo, '--title', title, '--body', body];
    if (labels && labels.length > 0) {
      args.push('--label', labels.join(','));
    }

    const output = await exec(args);
    const match = output.match(/\/issues\/(\d+)/);
    const issueNumber = match ? parseInt(match[1]!, 10) : 0;
    return ok(issueNumber);
  } catch (error) {
    return err(classifyError(error instanceof Error ? error.message : String(error)));
  }
}

export async function addPRComment(
  repo: string,
  prNumber: number,
  body: string,
): Promise<Result<void, GitHubError>> {
  try {
    await exec(['pr', 'comment', String(prNumber), '--repo', repo, '--body', body]);
    return ok(undefined);
  } catch (error) {
    return err(classifyError(error instanceof Error ? error.message : String(error)));
  }
}

export async function getPRDiff(
  repo: string,
  prNumber: number,
): Promise<Result<string, GitHubError>> {
  try {
    const diff = await exec(['pr', 'diff', String(prNumber), '--repo', repo]);
    return ok(diff);
  } catch (error) {
    return err(classifyError(error instanceof Error ? error.message : String(error)));
  }
}
