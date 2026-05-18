export type ReverificationErrorCode = 'IO_ERROR' | 'EXECUTION_ERROR';

export class ReverificationError extends Error {
  constructor(
    public readonly code: ReverificationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReverificationError';
  }
}
