import type { NotificationConfig, NotificationEvent } from './types.js';
import { publishToNotion } from './notion.js';
import { postToSlack } from './slack.js';

export async function notify(config: NotificationConfig, event: NotificationEvent): Promise<void> {
  const isHighSeverity = event.severity === 'high' || event.severity === 'critical';

  if (isHighSeverity && config.slack) {
    const text = `[${event.severity.toUpperCase()}] ${event.title}\n${event.body}`;
    const result = await postToSlack(config.slack.webhookUrl, text, config.slack.channel);
    if (!result.ok) {
      console.error(`Slack notification failed: ${result.error.message}`);
    }
  }

  if (config.notion) {
    const result = await publishToNotion(
      config.notion.apiKey,
      config.notion.pageId,
      event.title,
      event.body,
    );
    if (!result.ok) {
      console.error(`Notion notification failed: ${result.error.message}`);
    }
  }
}
