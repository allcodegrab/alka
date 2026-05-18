export type SmeErrorCode = 'DOMAIN_NOT_FOUND' | 'SPAWN_ERROR' | 'CITATION_REQUIRED' | 'IO_ERROR';

export class SmeError extends Error {
  constructor(
    public readonly code: SmeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SmeError';
  }
}
