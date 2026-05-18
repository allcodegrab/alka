import { ok, err, type Result } from '@forge/protocol';
import type { JiraConfig } from './types.js';
import { JiraError } from './errors.js';

export function loadJiraConfig(): Result<JiraConfig, JiraError> {
  const baseUrl = process.env['JIRA_BASE_URL'];
  const email = process.env['JIRA_EMAIL'];
  const apiToken = process.env['JIRA_API_TOKEN'];
  const projectKey = process.env['JIRA_PROJECT_KEY'];

  const missing: string[] = [];
  if (!baseUrl) missing.push('JIRA_BASE_URL');
  if (!email) missing.push('JIRA_EMAIL');
  if (!apiToken) missing.push('JIRA_API_TOKEN');
  if (!projectKey) missing.push('JIRA_PROJECT_KEY');

  if (missing.length > 0) {
    return err(
      new JiraError(
        'CONFIG_ERROR',
        `Missing required environment variables: ${missing.join(', ')}`,
      ),
    );
  }

  return ok({
    baseUrl: baseUrl!.replace(/\/+$/, ''),
    email: email!,
    apiToken: apiToken!,
    projectKey: projectKey!,
  });
}
