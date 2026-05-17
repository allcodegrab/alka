export type LedgerErrorCode = 'IO_ERROR' | 'PARSE_ERROR';

export class LedgerError extends Error {
  constructor(
    public readonly code: LedgerErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LedgerError';
  }
}
