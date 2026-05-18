export { SmeError, type SmeErrorCode } from './errors.js';
export {
  SME_DOMAINS,
  type SmeDomain,
  type SmeConsultRequest,
  type SmeConsultResponse,
} from './types.js';
export { isValidDomain, getSmeRoleId, getSmeModelId } from './registry.js';
export { consultSme } from './consult.js';
export { validateSmeResponse } from './validator.js';
