import { type Result } from '@forge/protocol';
import { GitHubError } from './errors.js';
import { createBranch, openPR, mergePR, createIssue } from './client.js';

export interface GitHubMissionMapper {
  onMissionStart(repo: string, missionId: string): Promise<Result<string, GitHubError>>;
  onSliceComplete(
    repo: string,
    branch: string,
    sliceId: string,
    message: string,
  ): Promise<Result<void, GitHubError>>;
  onVerificationPass(
    repo: string,
    missionId: string,
    branch: string,
    brief: string,
  ): Promise<Result<number, GitHubError>>;
  onCTOApprove(repo: string, prNumber: number): Promise<Result<void, GitHubError>>;
  onFinding(
    repo: string,
    finding: { severity: string; location: string; evidence: string },
  ): Promise<Result<number, GitHubError>>;
}

export function createMissionMapper(): GitHubMissionMapper {
  return {
    async onMissionStart(repo, missionId) {
      const branch = `forge/${missionId}`;
      const result = await createBranch(repo, branch);
      if (!result.ok) {
        return result;
      }
      return { ok: true, value: branch };
    },

    async onSliceComplete(_repo, _branch, _sliceId, _message) {
      // Commits are handled by the agent runtime directly.
      // This hook exists for future integrations (e.g., status updates).
      return { ok: true, value: undefined };
    },

    async onVerificationPass(repo, missionId, branch, brief) {
      const title = `[Forge] ${missionId}`;
      const body = [
        `## Mission: ${missionId}`,
        '',
        brief,
        '',
        '---',
        '_Opened automatically by Forge AI Code Editor_',
      ].join('\n');
      return openPR(repo, title, body, branch);
    },

    async onCTOApprove(repo, prNumber) {
      return mergePR(repo, prNumber);
    },

    async onFinding(repo, finding) {
      const title = `[Forge Finding] ${finding.severity}: ${finding.location}`;
      const body = [
        `## Finding`,
        '',
        `**Severity:** ${finding.severity}`,
        `**Location:** ${finding.location}`,
        '',
        '### Evidence',
        '',
        finding.evidence,
        '',
        '---',
        '_Created automatically by Forge verification_',
      ].join('\n');
      const labels = finding.severity === 'critical' ? ['bug', 'priority:high'] : ['bug'];
      return createIssue(repo, title, body, labels);
    },
  };
}
