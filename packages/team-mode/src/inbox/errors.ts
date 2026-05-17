export type InboxErrorCode = 'NOT_FOUND' | 'IO_ERROR' | 'ALREADY_DECIDED' | 'INVALID_ITEM';

export class InboxError extends Error {
  constructor(
    public readonly code: InboxErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InboxError';
  }
}
