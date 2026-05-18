export interface ReviewResult {
  findings: Array<{
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    location: string;
    message: string;
  }>;
  summary: string;
  approved: boolean;
}

export interface Disagreement {
  topic: string;
  claudeView: string;
  geminiView: string;
  severity: string;
}
