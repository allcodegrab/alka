import { ok, err, type Result } from '@forge/protocol';
import { createHash } from 'node:crypto';
import { LearningError } from './errors.js';
import type { LearningSource, CrawlResult } from './types.js';

export async function crawlSource(
  source: LearningSource,
  lastSnapshot?: string,
): Promise<Result<CrawlResult, LearningError>> {
  try {
    const response = await fetch(source.url);

    if (!response.ok) {
      return err(
        new LearningError('CRAWL_ERROR', `Failed to fetch ${source.url}: ${response.status}`),
      );
    }

    const body = await response.text();
    const currentHash = createHash('sha256').update(body).digest('hex');
    const changed = lastSnapshot !== undefined && currentHash !== lastSnapshot;

    return ok({
      sourceId: source.id,
      url: source.url,
      changed,
      summary: changed ? `Content changed (hash: ${currentHash.slice(0, 12)})` : undefined,
      detectedAt: new Date().toISOString(),
    });
  } catch (error) {
    return err(
      new LearningError(
        'CRAWL_ERROR',
        `Crawl failed for ${source.url}: ${(error as Error).message}`,
      ),
    );
  }
}
