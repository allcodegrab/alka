import { ok, err, type Result } from '@forge/protocol';
import { JiraClient } from './client.js';
import { JiraError } from './errors.js';

export const JIRA_HIERARCHY = {
  project: 'Epic',
  mission: 'Story',
  slice: 'Sub-task',
  finding: 'Bug',
} as const;

export class JiraMissionMapper {
  constructor(
    private readonly client: JiraClient,
    private readonly projectKey: string,
  ) {}

  async onMissionStart(missionName: string, epicKey?: string): Promise<Result<string, JiraError>> {
    return this.client.createIssue({
      projectKey: this.projectKey,
      issueType: 'Story',
      summary: missionName,
      description: `Mission: ${missionName}`,
      parent: epicKey,
    });
  }

  async onSliceStart(
    missionKey: string,
    sliceId: string,
    description: string,
  ): Promise<Result<string, JiraError>> {
    return this.client.createIssue({
      projectKey: this.projectKey,
      issueType: 'Sub-task',
      summary: `[${sliceId}] ${description}`,
      description,
      parent: missionKey,
    });
  }

  async onSliceComplete(sliceKey: string): Promise<Result<void, JiraError>> {
    return this.client.transitionIssue(sliceKey, 'Done');
  }

  async onMissionComplete(missionKey: string, summary: string): Promise<Result<void, JiraError>> {
    const commentResult = await this.client.addComment(missionKey, summary);
    if (!commentResult.ok) {
      return commentResult;
    }
    return this.client.transitionIssue(missionKey, 'Done');
  }

  async onFinding(
    missionKey: string,
    finding: { severity: string; location: string; evidence: string },
  ): Promise<Result<string, JiraError>> {
    const parentResult = await this.client.getIssue(missionKey);
    if (!parentResult.ok) {
      return err(parentResult.error);
    }

    return this.client.createIssue({
      projectKey: this.projectKey,
      issueType: 'Bug',
      summary: `[${finding.severity.toUpperCase()}] ${finding.location}`,
      description: finding.evidence,
      labels: [`severity-${finding.severity}`],
    });
  }
}
