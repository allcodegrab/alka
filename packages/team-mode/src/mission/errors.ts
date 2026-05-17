export type MissionErrorCode = 'NOT_FOUND' | 'ALREADY_EXISTS' | 'IO_ERROR' | 'INVALID_STATE';

export class MissionError extends Error {
  constructor(
    public readonly code: MissionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MissionError';
  }
}
