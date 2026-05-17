export interface IntakeResult {
  restatedIntent: string;
  inferredScope: string[];
  predictedConcerns: string[];
  suggestedMode: 'standard' | '24h';
  suggestedTeam: string[];
}

const SCOPE_KEYWORDS: Record<string, string[]> = {
  frontend: [
    'ui',
    'component',
    'page',
    'button',
    'form',
    'css',
    'style',
    'layout',
    'responsive',
    'react',
    'vue',
    'angular',
  ],
  backend: [
    'api',
    'endpoint',
    'server',
    'database',
    'query',
    'rest',
    'graphql',
    'middleware',
    'route',
  ],
  infrastructure: [
    'deploy',
    'ci',
    'cd',
    'docker',
    'kubernetes',
    'pipeline',
    'terraform',
    'aws',
    'cloud',
  ],
  testing: ['test', 'spec', 'coverage', 'e2e', 'unit', 'integration', 'mock'],
  security: [
    'auth',
    'authentication',
    'authorization',
    'permission',
    'token',
    'oauth',
    'jwt',
    'encrypt',
  ],
  documentation: ['doc', 'readme', 'guide', 'tutorial', 'comment'],
  performance: ['performance', 'optimize', 'cache', 'speed', 'latency', 'memory', 'profil'],
};

const URGENCY_KEYWORDS = [
  'urgent',
  'asap',
  'critical',
  'hotfix',
  'emergency',
  'broken',
  'down',
  'outage',
];

const CONCERN_PATTERNS: Array<{ pattern: RegExp; concern: string }> = [
  { pattern: /breaking\s*change/i, concern: 'May introduce breaking changes' },
  { pattern: /migrat/i, concern: 'Data migration may be required' },
  { pattern: /security|auth/i, concern: 'Security implications need review' },
  { pattern: /performance|optimi/i, concern: 'Performance impact should be benchmarked' },
  { pattern: /refactor/i, concern: 'Refactoring scope may expand beyond initial estimate' },
  { pattern: /third.?party|external|vendor/i, concern: 'External dependency risk' },
  { pattern: /database|schema|model/i, concern: 'Database schema changes may require migration' },
];

const TEAM_MAPPING: Record<string, string> = {
  frontend: 'frontend-dev',
  backend: 'backend-dev',
  infrastructure: 'devops',
  testing: 'qa-engineer',
  security: 'security-reviewer',
  documentation: 'tech-writer',
  performance: 'performance-engineer',
};

export function generateIntake(userPrompt: string, memoryContext: string): IntakeResult {
  const combined = `${userPrompt} ${memoryContext}`.toLowerCase();

  // Extract intent: use the first sentence or the full prompt
  const firstSentence = userPrompt.split(/[.!?\n]/)[0]?.trim() ?? userPrompt.trim();
  const restatedIntent = firstSentence;

  // Infer scope by matching keywords
  const inferredScope: string[] = [];
  for (const [scope, keywords] of Object.entries(SCOPE_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      inferredScope.push(scope);
    }
  }
  if (inferredScope.length === 0) {
    inferredScope.push('general');
  }

  // Predict concerns
  const predictedConcerns: string[] = [];
  for (const { pattern, concern } of CONCERN_PATTERNS) {
    if (pattern.test(combined)) {
      predictedConcerns.push(concern);
    }
  }

  // Suggest mode based on urgency
  const isUrgent = URGENCY_KEYWORDS.some((kw) => combined.includes(kw));
  const suggestedMode: 'standard' | '24h' = isUrgent ? '24h' : 'standard';

  // Suggest team based on inferred scope
  const suggestedTeam: string[] = [];
  for (const scope of inferredScope) {
    const role = TEAM_MAPPING[scope];
    if (role && !suggestedTeam.includes(role)) {
      suggestedTeam.push(role);
    }
  }
  if (suggestedTeam.length === 0) {
    suggestedTeam.push('backend-dev');
  }

  return {
    restatedIntent,
    inferredScope,
    predictedConcerns,
    suggestedMode,
    suggestedTeam,
  };
}
