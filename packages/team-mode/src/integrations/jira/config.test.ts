import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isOk, isErr } from '@forge/protocol';
import { loadJiraConfig } from './config.js';

describe('loadJiraConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['JIRA_BASE_URL'] = 'https://test.atlassian.net';
    process.env['JIRA_EMAIL'] = 'user@test.com';
    process.env['JIRA_API_TOKEN'] = 'secret-token';
    process.env['JIRA_PROJECT_KEY'] = 'PROJ';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should load config from environment variables', () => {
    const result = loadJiraConfig();
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.baseUrl).toBe('https://test.atlassian.net');
    expect(result.value.email).toBe('user@test.com');
    expect(result.value.apiToken).toBe('secret-token');
    expect(result.value.projectKey).toBe('PROJ');
  });

  it('should return error when required vars are missing', () => {
    delete process.env['JIRA_API_TOKEN'];
    delete process.env['JIRA_EMAIL'];

    const result = loadJiraConfig();
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('CONFIG_ERROR');
    expect(result.error.message).toContain('JIRA_EMAIL');
    expect(result.error.message).toContain('JIRA_API_TOKEN');
  });

  it('should strip trailing slashes from base URL', () => {
    process.env['JIRA_BASE_URL'] = 'https://test.atlassian.net///';

    const result = loadJiraConfig();
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value.baseUrl).toBe('https://test.atlassian.net');
  });
});
