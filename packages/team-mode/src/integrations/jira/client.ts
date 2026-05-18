import { ok, err, type Result } from '@forge/protocol';
import type { JiraConfig, JiraIssue, CreateIssueParams } from './types.js';
import { JiraError } from './errors.js';

export class JiraClient {
  private readonly authHeader: string;

  constructor(private readonly config: JiraConfig) {
    this.authHeader =
      'Basic ' + Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  }

  async getIssue(key: string): Promise<Result<JiraIssue, JiraError>> {
    const response = await this.request('GET', `/rest/api/3/issue/${key}`);

    if (response.status === 401) {
      return err(new JiraError('AUTH_ERROR', 'Invalid JIRA credentials'));
    }
    if (response.status === 404) {
      return err(new JiraError('NOT_FOUND', `Issue not found: ${key}`));
    }
    if (!response.ok) {
      return err(new JiraError('API_ERROR', `Failed to get issue: ${response.status}`));
    }

    const data = (await response.json()) as Record<string, unknown>;
    const fields = data['fields'] as Record<string, unknown> | undefined;
    const status = fields?.['status'] as Record<string, unknown> | undefined;
    const issueType = fields?.['issuetype'] as Record<string, unknown> | undefined;
    const assignee = fields?.['assignee'] as Record<string, unknown> | undefined;
    const parent = fields?.['parent'] as Record<string, unknown> | undefined;
    return ok({
      key: String(data['key'] ?? ''),
      summary: String(fields?.['summary'] ?? ''),
      status: String(status?.['name'] ?? ''),
      issueType: String(issueType?.['name'] ?? ''),
      assignee: assignee ? String(assignee['displayName'] ?? '') : undefined,
      parent: parent ? String(parent['key'] ?? '') : undefined,
    });
  }

  async createIssue(params: CreateIssueParams): Promise<Result<string, JiraError>> {
    const body: Record<string, unknown> = {
      fields: {
        project: { key: params.projectKey },
        issuetype: { name: params.issueType },
        summary: params.summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: params.description }],
            },
          ],
        },
        ...(params.labels && { labels: params.labels }),
        ...(params.parent && { parent: { key: params.parent } }),
      },
    };

    const response = await this.request('POST', '/rest/api/3/issue', body);

    if (response.status === 401) {
      return err(new JiraError('AUTH_ERROR', 'Invalid JIRA credentials'));
    }
    if (!response.ok) {
      const text = await response.text();
      return err(new JiraError('API_ERROR', `Failed to create issue: ${response.status} ${text}`));
    }

    const data = (await response.json()) as Record<string, unknown>;
    return ok(data['key'] as string);
  }

  async transitionIssue(key: string, transitionName: string): Promise<Result<void, JiraError>> {
    const transResponse = await this.request('GET', `/rest/api/3/issue/${key}/transitions`);

    if (!transResponse.ok) {
      return err(new JiraError('API_ERROR', `Failed to get transitions: ${transResponse.status}`));
    }

    const transData = (await transResponse.json()) as Record<string, unknown>;
    const transitions = transData['transitions'] as Array<{ id: string; name: string }>;
    const transition = transitions.find(
      (t: { name: string }) => t.name.toLowerCase() === transitionName.toLowerCase(),
    );

    if (!transition) {
      return err(new JiraError('NOT_FOUND', `Transition not found: ${transitionName}`));
    }

    const response = await this.request('POST', `/rest/api/3/issue/${key}/transitions`, {
      transition: { id: transition.id },
    });

    if (!response.ok) {
      return err(new JiraError('API_ERROR', `Failed to transition issue: ${response.status}`));
    }

    return ok(undefined);
  }

  async addComment(key: string, body: string): Promise<Result<void, JiraError>> {
    const response = await this.request('POST', `/rest/api/3/issue/${key}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: body }],
          },
        ],
      },
    });

    if (!response.ok) {
      return err(new JiraError('API_ERROR', `Failed to add comment: ${response.status}`));
    }

    return ok(undefined);
  }

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    return fetch(url, {
      method,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
