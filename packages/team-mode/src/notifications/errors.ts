export type NotificationErrorCode = 'CONFIG_ERROR' | 'API_ERROR' | 'AUTH_ERROR';

export class NotificationError extends Error {
  constructor(
    public readonly code: NotificationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}
