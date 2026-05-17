import type { SkillContent } from '@forge/protocol';

export function formatSkillsForPrompt(skills: SkillContent[]): string {
  if (skills.length === 0) return '';

  const sections = skills.map((skill) => {
    return `<skill name="${skill.manifest.name}">\n${skill.body}\n</skill>`;
  });

  return `# Loaded Skills\n\n${sections.join('\n\n')}`;
}

export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}
