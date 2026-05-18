export type GeminiErrorCode = 'AUTH_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'NO_API_KEY';

export class GeminiError extends Error {
  constructor(
    public readonly code: GeminiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}
