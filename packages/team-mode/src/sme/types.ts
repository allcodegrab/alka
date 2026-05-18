export const SME_DOMAINS = [
  'java-spring',
  'typescript-frontend',
  'mongodb-firestore',
  'aws-cloud',
  'voice-ai',
] as const;

export type SmeDomain = (typeof SME_DOMAINS)[number];

export interface SmeConsultRequest {
  domain: SmeDomain;
  question: string;
  context?: string;
}

export interface SmeConsultResponse {
  answer: string;
  citations: string[];
  confidence: 'high' | 'medium' | 'low';
  domain: SmeDomain;
  respondedAt: string;
}
