export { HealingError, type HealingErrorCode } from './errors.js';
export type { FailureType, FailureDetection, RecoveryAction } from './types.js';
export {
  detectMissionCrash,
  detectCostRunaway,
  detectFindingStorm,
  detectStuckRole,
  detectWorktreeConflict,
  detectModelOutage,
} from './detectors.js';
export { recover, resetRetryCounters } from './recovery.js';
export { logHealingAction } from './journal-logger.js';
