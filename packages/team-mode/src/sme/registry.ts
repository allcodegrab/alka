import { SME_DOMAINS, type SmeDomain } from './types.js';

export function isValidDomain(domain: string): domain is SmeDomain {
  return (SME_DOMAINS as readonly string[]).includes(domain);
}

export function getSmeRoleId(domain: SmeDomain): string {
  return `sme-${domain}`;
}

export function getSmeModelId(): string {
  return 'claude-sonnet-4-6';
}
