import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { publishToNotion } from './notion.js';
import { postToSlack } from './slack.js';
import { notify } from './hub.js';
import type { NotificationConfig, NotificationEvent } from './types.js';

describe('publishToNotion', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should publish successfully to Notion', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{}'),
    });

    const result = await publishToNotion('api-key', 'page-id', 'Test Title', 'Test content');
    expect(result.ok).toBe(true);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.notion.com/v1/pages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Notion-Version': '2022-06-28',
        }),
      }),
    );
  });

  it('should return error on Notion API failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad request'),
    });

    const result = await publishToNotion('api-key', 'page-id', 'Title', 'Content');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('API_ERROR');
    }
  });

  it('should return AUTH_ERROR on 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    const result = await publishToNotion('bad-key', 'page-id', 'Title', 'Content');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AUTH_ERROR');
    }
  });
});

describe('postToSlack', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should post successfully to Slack', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('ok'),
    });

    const result = await postToSlack('https://hooks.slack.com/test', 'Hello');
    expect(result.ok).toBe(true);
  });

  it('should return error on Slack webhook failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server error'),
    });

    const result = await postToSlack('https://hooks.slack.com/test', 'Hello');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('API_ERROR');
    }
  });
});

describe('notify hub', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('ok'),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should post to slack when severity is high and slack is configured', async () => {
    const config: NotificationConfig = {
      slack: { webhookUrl: 'https://hooks.slack.com/test' },
    };
    const event: NotificationEvent = {
      type: 'mission_failed',
      severity: 'high',
      title: 'Mission Failed',
      body: 'Something went wrong',
    };

    await notify(config, event);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.anything(),
    );
  });

  it('should not post when no config is provided', async () => {
    const config: NotificationConfig = {};
    const event: NotificationEvent = {
      type: 'inbox_item',
      severity: 'low',
      title: 'New Item',
      body: 'Details',
    };

    await notify(config, event);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('should publish to notion when notion is configured', async () => {
    const config: NotificationConfig = {
      notion: { apiKey: 'key', pageId: 'page' },
    };
    const event: NotificationEvent = {
      type: 'mission_complete',
      severity: 'low',
      title: 'Done',
      body: 'Completed successfully',
    };

    await notify(config, event);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.notion.com/v1/pages',
      expect.anything(),
    );
  });
});
