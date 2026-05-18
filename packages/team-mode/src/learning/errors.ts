export type LearningErrorCode = 'CONFIG_ERROR' | 'CRAWL_ERROR' | 'IO_ERROR';

export class LearningError extends Error {
  constructor(
    public readonly code: LearningErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LearningError';
  }
}
