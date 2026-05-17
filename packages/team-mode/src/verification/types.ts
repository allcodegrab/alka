export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface Finding {
  severity: FindingSeverity;
  verifier: string;
  location: string;
  evidence: string;
  suggestion: string;
}

export interface VerificationReport {
  sliceId: string;
  findings: Finding[];
  passedVerifiers: string[];
  failedVerifiers: string[];
  isBlocked: boolean;
  isStorm: boolean;
}
