export class SkillLoadError extends Error {
  constructor(
    public readonly code: 'DISCOVERY_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND' | 'IO_ERROR',
    message: string,
  ) {
    super(message);
    this.name = 'SkillLoadError';
  }
}
