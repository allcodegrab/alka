export type OrgChartErrorCode =
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'IO_ERROR'
  | 'POLICY_VIOLATION';

export class OrgChartError extends Error {
  constructor(
    public readonly code: OrgChartErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'OrgChartError';
  }
}
