import { ok, err, type Result } from '@forge/protocol';
import { NotificationError } from './errors.js';

export async function postToSlack(
  webhookUrl: string,
  text: string,
  channel?: string,
): Promise<Result<void, NotificationError>> {
  try {
    const payload: Record<string, string> = { text };
    if (channel) {
      payload['channel'] = channel;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      return err(
        new NotificationError('API_ERROR', `Slack webhook error ${response.status}: ${body}`),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new NotificationError('API_ERROR', `Slack request failed: ${(error as Error).message}`),
    );
  }
}
