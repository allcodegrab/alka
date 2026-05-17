export type VerificationErrorCode = 'SPAWN_FAILED' | 'TIMEOUT' | 'STORM_DETECTED' | 'IO_ERROR';

export class VerificationError extends Error {
  constructor(
    public readonly code: VerificationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}
