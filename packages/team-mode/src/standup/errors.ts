export type StandupErrorCode = 'RATE_LIMITED' | 'IO_ERROR';

export class StandupError extends Error {
  constructor(
    public readonly code: StandupErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'StandupError';
  }
}
