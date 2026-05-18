export type HealingErrorCode = 'DETECTION_ERROR' | 'RECOVERY_FAILED' | 'MAX_RETRIES';

export class HealingError extends Error {
  constructor(
    public readonly code: HealingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'HealingError';
  }
}
