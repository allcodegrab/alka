export class AgentSpawnError extends Error {
  constructor(
    public readonly code:
      | 'SPAWN_FAILED'
      | 'TOOL_VIOLATION'
      | 'MAX_TURNS_EXCEEDED'
      | 'TIMEOUT'
      | 'WORKTREE_ERROR'
      | 'CANCELLED',
    message: string,
  ) {
    super(message);
    this.name = 'AgentSpawnError';
  }
}
