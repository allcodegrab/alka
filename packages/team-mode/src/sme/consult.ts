import { ok, err, type Result } from '@forge/protocol';
import { SmeError } from './errors.js';
import type { SmeConsultRequest, SmeConsultResponse } from './types.js';
import { isValidDomain } from './registry.js';
import { validateSmeResponse } from './validator.js';

export async function consultSme(
  _projectRoot: string,
  request: SmeConsultRequest,
): Promise<Result<SmeConsultResponse, SmeError>> {
  if (!isValidDomain(request.domain)) {
    return err(new SmeError('DOMAIN_NOT_FOUND', `Unknown SME domain: ${request.domain}`));
  }

  // Stub response — actual agent spawn will be added in integration phase
  const response: SmeConsultResponse = {
    answer: `[Stub] SME response for domain "${request.domain}": ${request.question}`,
    citations: [`https://docs.example.com/${request.domain}/reference`],
    confidence: 'medium',
    domain: request.domain,
    respondedAt: new Date().toISOString(),
  };

  const validation = validateSmeResponse(response);
  if (!validation.valid) {
    return err(new SmeError('CITATION_REQUIRED', validation.errors.join('; ')));
  }

  return ok(response);
}
