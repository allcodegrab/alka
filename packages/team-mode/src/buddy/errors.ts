export type BuddyErrorCode = 'SKIPPED' | 'INTAKE_FAILED' | 'DEBRIEF_FAILED';

export class BuddyError extends Error {
  constructor(
    public readonly code: BuddyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BuddyError';
  }
}
