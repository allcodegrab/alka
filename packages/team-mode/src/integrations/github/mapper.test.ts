import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMissionMapper } from './mapper.js';

// Mock the client module
vi.mock('./client.js', () => ({
  createBranch: vi.fn(),
  openPR: vi.fn(),
  mergePR: vi.fn(),
  createIssue: vi.fn(),
}));

import { createBranch, openPR, mergePR, createIssue } from './client.js';
const mockCreateBranch = vi.mocked(createBranch);
const mockOpenPR = vi.mocked(openPR);
const mockMergePR = vi.mocked(mergePR);
const mockCreateIssue = vi.mocked(createIssue);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GitHubMissionMapper', () => {
  const mapper = createMissionMapper();

  it('onMissionStart creates a forge-prefixed branch', async () => {
    mockCreateBranch.mockResolvedValue({ ok: true, value: undefined });

    const result = await mapper.onMissionStart('owner/repo', 'add-auth-endpoints');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('forge/add-auth-endpoints');
    }
    expect(mockCreateBranch).toHaveBeenCalledWith('owner/repo', 'forge/add-auth-endpoints');
  });

  it('onSliceComplete returns success (commits handled by agent)', async () => {
    const result = await mapper.onSliceComplete('owner/repo', 'forge/m1', 'slice-1', 'done');
    expect(result.ok).toBe(true);
  });

  it('onVerificationPass opens a PR with mission details', async () => {
    mockOpenPR.mockResolvedValue({ ok: true, value: 55 });

    const result = await mapper.onVerificationPass(
      'owner/repo',
      'add-auth',
      'forge/add-auth',
      'Added OAuth2 endpoints',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(55);
    }
    expect(mockOpenPR).toHaveBeenCalledWith(
      'owner/repo',
      '[Forge] add-auth',
      expect.stringContaining('Added OAuth2 endpoints'),
      'forge/add-auth',
    );
  });

  it('onCTOApprove merges the PR', async () => {
    mockMergePR.mockResolvedValue({ ok: true, value: undefined });

    const result = await mapper.onCTOApprove('owner/repo', 55);
    expect(result.ok).toBe(true);
    expect(mockMergePR).toHaveBeenCalledWith('owner/repo', 55);
  });

  it('onFinding creates an issue with severity label', async () => {
    mockCreateIssue.mockResolvedValue({ ok: true, value: 101 });

    const result = await mapper.onFinding('owner/repo', {
      severity: 'critical',
      location: 'src/auth.ts:42',
      evidence: 'SQL injection vulnerability',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(101);
    }
    expect(mockCreateIssue).toHaveBeenCalledWith(
      'owner/repo',
      expect.stringContaining('critical'),
      expect.stringContaining('SQL injection vulnerability'),
      ['bug', 'priority:high'],
    );
  });
});
