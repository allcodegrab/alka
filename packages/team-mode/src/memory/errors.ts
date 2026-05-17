export type MemoryErrorCode = 'IO_ERROR' | 'NOT_FOUND';

export class MemoryError extends Error {
  constructor(
    public readonly code: MemoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MemoryError';
  }
}
