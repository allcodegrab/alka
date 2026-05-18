import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok } from '@forge/protocol';
import { isOk, isErr } from '@forge/protocol';
import { JiraMissionMapper } from './mapper.js';
import { JiraClient } from './client.js';
import type { JiraConfig } from './types.js';
import { JiraError } from './errors.js';

const config: JiraConfig = {
  baseUrl: 'https://test.atlassian.net',
  email: 'user@test.com',
  apiToken: 'test-token',
  projectKey: 'TEST',
};

describe('JiraMissionMapper', () => {
  let mapper: JiraMissionMapper;
  let client: JiraClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    client = new JiraClient(config);
    mapper = new JiraMissionMapper(client, 'TEST');
  });

  it('should create a Story on mission start', async () => {
    vi.spyOn(client, 'createIssue').mockResolvedValue(ok('TEST-10'));

    const result = await mapper.onMissionStart('Build Auth Module', 'TEST-1');
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe('TEST-10');

    expect(client.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        issueType: 'Story',
        summary: 'Build Auth Module',
        parent: 'TEST-1',
      }),
    );
  });

  it('should create a Sub-task on slice start', async () => {
    vi.spyOn(client, 'createIssue').mockResolvedValue(ok('TEST-11'));

    const result = await mapper.onSliceStart('TEST-10', 'slice-1', 'Implement login form');
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe('TEST-11');

    expect(client.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        issueType: 'Sub-task',
        parent: 'TEST-10',
      }),
    );
  });

  it('should transition slice to Done on complete', async () => {
    vi.spyOn(client, 'transitionIssue').mockResolvedValue(ok(undefined));

    const result = await mapper.onSliceComplete('TEST-11');
    expect(isOk(result)).toBe(true);
    expect(client.transitionIssue).toHaveBeenCalledWith('TEST-11', 'Done');
  });

  it('should add comment and transition on mission complete', async () => {
    vi.spyOn(client, 'addComment').mockResolvedValue(ok(undefined));
    vi.spyOn(client, 'transitionIssue').mockResolvedValue(ok(undefined));

    const result = await mapper.onMissionComplete('TEST-10', 'All slices done');
    expect(isOk(result)).toBe(true);
    expect(client.addComment).toHaveBeenCalledWith('TEST-10', 'All slices done');
    expect(client.transitionIssue).toHaveBeenCalledWith('TEST-10', 'Done');
  });

  it('should create a Bug on finding', async () => {
    vi.spyOn(client, 'getIssue').mockResolvedValue(
      ok({
        key: 'TEST-10',
        summary: 'Mission',
        status: 'In Progress',
        issueType: 'Story',
      }),
    );
    vi.spyOn(client, 'createIssue').mockResolvedValue(ok('TEST-12'));

    const result = await mapper.onFinding('TEST-10', {
      severity: 'high',
      location: 'src/auth.ts:42',
      evidence: 'SQL injection vulnerability',
    });

    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe('TEST-12');

    expect(client.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        issueType: 'Bug',
        labels: ['severity-high'],
      }),
    );
  });
});
