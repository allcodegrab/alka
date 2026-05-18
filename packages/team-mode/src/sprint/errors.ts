export type SprintErrorCode = 'CLOCK_ERROR' | 'BUDGET_ERROR' | 'IO_ERROR';

export class SprintError extends Error {
  constructor(
    public readonly code: SprintErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SprintError';
  }
}
