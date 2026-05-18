export type MeditationErrorCode = 'INVALID_SCHEMA' | 'IO_ERROR' | 'TRIGGER_ERROR';

export class MeditationError extends Error {
  constructor(
    public readonly code: MeditationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MeditationError';
  }
}
