export type DreamErrorCode = 'SCHEDULE_ERROR' | 'OPERATION_ERROR' | 'GUARD_VIOLATION';

export class DreamError extends Error {
  constructor(
    public readonly code: DreamErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DreamError';
  }
}
