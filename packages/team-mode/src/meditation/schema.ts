const REQUIRED_SECTIONS = [
  '## Concrete metrics',
  '## Concrete observations',
  '## Proposals',
  "## What I'm NOT going to do",
];

const BANNED_PHRASES = ['I felt', 'I think'];

export function validateMeditation(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      errors.push(`Missing required section: "${section}"`);
    }
  }

  // Check max 3 proposals
  const proposalsIdx = content.indexOf('## Proposals');
  if (proposalsIdx !== -1) {
    const nextSectionIdx = content.indexOf('\n## ', proposalsIdx + 1);
    const proposalsSection =
      nextSectionIdx !== -1
        ? content.slice(proposalsIdx, nextSectionIdx)
        : content.slice(proposalsIdx);

    const proposalItems = proposalsSection.split('\n').filter((line) => line.match(/^[-*]\s+\S/));
    if (proposalItems.length > 3) {
      errors.push(`Too many proposals: ${proposalItems.length} (max 3)`);
    }
  }

  // Check observations section for banned phrases
  const observationsIdx = content.indexOf('## Concrete observations');
  if (observationsIdx !== -1) {
    const nextSectionAfterObs = content.indexOf('\n## ', observationsIdx + 1);
    const observationsSection =
      nextSectionAfterObs !== -1
        ? content.slice(observationsIdx, nextSectionAfterObs)
        : content.slice(observationsIdx);

    for (const phrase of BANNED_PHRASES) {
      if (observationsSection.includes(phrase)) {
        errors.push(`Observations must not contain "${phrase}" — cite evidence instead`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
