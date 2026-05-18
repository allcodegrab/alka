import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBranch, openPR, mergePR, createIssue, addPRComment, getPRDiff } from './client.js';

// Mock child_process.execFile
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { execFile } from 'node:child_process';
const mockExecFile = vi.mocked(execFile);

function simulateExec(stdout: string) {
  mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, stdout, '');
    return undefined as never;
  });
}

function simulateExecSequence(outputs: string[]) {
  let callIndex = 0;
  mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    const stdout = outputs[callIndex] ?? '';
    callIndex++;
    (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, stdout, '');
    return undefined as never;
  });
}

function simulateExecError(stderr: string) {
  mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    const error = new Error(stderr);
    (callback as (err: Error | null, stdout: string, stderr: string) => void)(error, '', stderr);
    return undefined as never;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createBranch', () => {
  it('creates a branch from base SHA', async () => {
    simulateExecSequence(['abc123', '']);

    const result = await createBranch('owner/repo', 'feature-branch');
    expect(result.ok).toBe(true);
    expect(mockExecFile).toHaveBeenCalledTimes(2);
  });

  it('returns error on authentication failure', async () => {
    simulateExecError('authentication required');

    const result = await createBranch('owner/repo', 'feature-branch');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AUTH_ERROR');
    }
  });
});

describe('openPR', () => {
  it('creates a PR and returns the PR number', async () => {
    simulateExec('https://github.com/owner/repo/pull/42\n');

    const result = await openPR('owner/repo', 'Test PR', 'Body', 'feature-branch');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('passes base branch when provided', async () => {
    simulateExec('https://github.com/owner/repo/pull/7\n');

    const result = await openPR('owner/repo', 'Test', 'Body', 'head', 'develop');
    expect(result.ok).toBe(true);
    // Verify --base was included
    const callArgs = mockExecFile.mock.calls[0]![1] as string[];
    expect(callArgs).toContain('--base');
    expect(callArgs).toContain('develop');
  });
});

describe('mergePR', () => {
  it('merges a PR with squash', async () => {
    simulateExec('');

    const result = await mergePR('owner/repo', 42);
    expect(result.ok).toBe(true);
    const callArgs = mockExecFile.mock.calls[0]![1] as string[];
    expect(callArgs).toContain('--squash');
  });
});

describe('createIssue', () => {
  it('creates an issue and returns the issue number', async () => {
    simulateExec('https://github.com/owner/repo/issues/99\n');

    const result = await createIssue('owner/repo', 'Bug title', 'Bug body', ['bug']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(99);
    }
  });

  it('handles missing labels gracefully', async () => {
    simulateExec('https://github.com/owner/repo/issues/100\n');

    const result = await createIssue('owner/repo', 'Title', 'Body');
    expect(result.ok).toBe(true);
    const callArgs = mockExecFile.mock.calls[0]![1] as string[];
    expect(callArgs).not.toContain('--label');
  });
});

describe('addPRComment', () => {
  it('adds a comment to a PR', async () => {
    simulateExec('');

    const result = await addPRComment('owner/repo', 42, 'Great work!');
    expect(result.ok).toBe(true);
  });
});

describe('getPRDiff', () => {
  it('returns the diff for a PR', async () => {
    const diffContent = 'diff --git a/file.ts b/file.ts\n+new line';
    simulateExec(diffContent);

    const result = await getPRDiff('owner/repo', 42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('+new line');
    }
  });

  it('returns NOT_FOUND error for missing PR', async () => {
    simulateExecError('Could not resolve to a PullRequest: 404 not found');

    const result = await getPRDiff('owner/repo', 9999);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});
