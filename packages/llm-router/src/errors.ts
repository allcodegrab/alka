export type RouterErrorCode =
  | 'PROVIDER_NOT_FOUND'
  | 'API_ERROR'
  | 'AUTH_ERROR'
  | 'TIMEOUT'
  | 'ALL_FAILED';

export class RouterError extends Error {
  constructor(
    public readonly code: RouterErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RouterError';
  }
}
