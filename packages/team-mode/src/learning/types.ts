export interface LearningSource {
  id: string;
  url: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  tier: 1 | 2;
  tags?: string[];
  relevantToSkills?: string[];
}

export interface CrawlResult {
  sourceId: string;
  url: string;
  changed: boolean;
  summary?: string;
  detectedAt: string;
}

export interface LearningConfig {
  enabled: boolean;
  sources: {
    tier1: LearningSource[];
    tier2: LearningSource[];
  };
  outputDir: string;
}
