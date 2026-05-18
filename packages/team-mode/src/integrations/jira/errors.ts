export type JiraErrorCode = 'AUTH_ERROR' | 'NOT_FOUND' | 'API_ERROR' | 'CONFIG_ERROR';

export class JiraError extends Error {
  constructor(
    public readonly code: JiraErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'JiraError';
  }
}
