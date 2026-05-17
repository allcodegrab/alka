export type TeamModErrorCode = 'NOT_FOUND' | 'ALREADY_EXISTS' | 'IO_ERROR' | 'INVALID_STATE';

export class TeamModError extends Error {
  constructor(
    public readonly code: TeamModErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'TeamModError';
  }
}
