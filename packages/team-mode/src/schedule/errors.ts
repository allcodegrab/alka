export type ScheduleErrorCode = 'CONFIG_ERROR' | 'IO_ERROR' | 'INVALID_STATE';

export class ScheduleError extends Error {
  constructor(
    public readonly code: ScheduleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ScheduleError';
  }
}
