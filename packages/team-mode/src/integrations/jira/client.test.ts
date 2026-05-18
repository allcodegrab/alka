import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isOk, isErr } from '@forge/protocol';
import { JiraClient } from './client.js';
import type { JiraConfig } from './types.js';

const config: JiraConfig = {
  baseUrl: 'https://test.atlassian.net',
  email: 'user@test.com',
  apiToken: 'test-token',
  projectKey: 'TEST',
};

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    }),
  );
}

describe('JiraClient', () => {
  let client: JiraClient;

  beforeEach(() => {
    client = new JiraClient(config);
    vi.restoreAllMocks();
  });

  describe('getIssue', () => {
    it('should return issue data on success', async () => {
      mockFetch(200, {
        key: 'TEST-1',
        fields: {
          summary: 'Test issue',
          status: { name: 'To Do' },
          issuetype: { name: 'Story' },
          assignee: { displayName: 'Alice' },
          parent: { key: 'TEST-0' },
        },
      });

      const result = await client.getIssue('TEST-1');
      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value.key).toBe('TEST-1');
      expect(result.value.summary).toBe('Test issue');
      expect(result.value.status).toBe('To Do');
      expect(result.value.assignee).toBe('Alice');
      expect(result.value.parent).toBe('TEST-0');
    });

    it('should return NOT_FOUND for 404', async () => {
      mockFetch(404, {});

      const result = await client.getIssue('TEST-999');
      expect(isErr(result)).toBe(true);
      if (result.ok) return;
      expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should return AUTH_ERROR for 401', async () => {
      mockFetch(401, {});

      const result = await client.getIssue('TEST-1');
      expect(isErr(result)).toBe(true);
      if (result.ok) return;
      expect(result.error.code).toBe('AUTH_ERROR');
    });
  });

  describe('createIssue', () => {
    it('should return issue key on success', async () => {
      mockFetch(201, { key: 'TEST-2' });

      const result = await client.createIssue({
        projectKey: 'TEST',
        issueType: 'Story',
        summary: 'New story',
        description: 'A test story',
      });

      expect(isOk(result)).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe('TEST-2');
    });

    it('should return API_ERROR on failure', async () => {
      mockFetch(400, { errors: { summary: 'required' } });

      const result = await client.createIssue({
        projectKey: 'TEST',
        issueType: 'Story',
        summary: '',
        description: '',
      });

      expect(isErr(result)).toBe(true);
      if (result.ok) return;
      expect(result.error.code).toBe('API_ERROR');
    });
  });

  describe('transitionIssue', () => {
    it('should transition issue to target status', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              transitions: [
                { id: '31', name: 'Done' },
                { id: '21', name: 'In Progress' },
              ],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: () => Promise.resolve({}),
        });
      vi.stubGlobal('fetch', fetchMock);

      const result = await client.transitionIssue('TEST-1', 'Done');
      expect(isOk(result)).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('addComment', () => {
    it('should add comment successfully', async () => {
      mockFetch(201, { id: '10001' });

      const result = await client.addComment('TEST-1', 'Mission completed successfully');
      expect(isOk(result)).toBe(true);
    });
  });
});
