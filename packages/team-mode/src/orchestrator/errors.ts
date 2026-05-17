export type OrchestratorErrorCode =
  | 'DECOMPOSE_FAILED'
  | 'EXECUTION_FAILED'
  | 'SYNTHESIS_FAILED'
  | 'IO_ERROR';

export class OrchestratorError extends Error {
  constructor(
    public readonly code: OrchestratorErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}
