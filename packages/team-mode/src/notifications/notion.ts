import { ok, err, type Result } from '@forge/protocol';
import { NotificationError } from './errors.js';

export async function publishToNotion(
  apiKey: string,
  pageId: string,
  title: string,
  content: string,
): Promise<Result<void, NotificationError>> {
  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { page_id: pageId },
        properties: {
          title: {
            title: [{ text: { content: title } }],
          },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content } }],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const code = response.status === 401 ? 'AUTH_ERROR' : 'API_ERROR';
      return err(
        new NotificationError(
          code as 'AUTH_ERROR' | 'API_ERROR',
          `Notion API error ${response.status}: ${body}`,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new NotificationError('API_ERROR', `Notion request failed: ${(error as Error).message}`),
    );
  }
}
