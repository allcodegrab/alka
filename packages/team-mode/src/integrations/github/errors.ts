export type GitHubErrorCode = 'AUTH_ERROR' | 'NOT_FOUND' | 'API_ERROR' | 'CLI_ERROR';

export class GitHubError extends Error {
  constructor(
    public readonly code: GitHubErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}
