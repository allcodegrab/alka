export type PayrollErrorCode = 'CONFIG_ERROR' | 'IO_ERROR' | 'PARSE_ERROR';

export class PayrollError extends Error {
  constructor(
    public readonly code: PayrollErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PayrollError';
  }
}
