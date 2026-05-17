import type { RoleDefinition } from '@forge/protocol';

/**
 * Build the markdown content for a single agent file with YAML frontmatter.
 */
export function generateExpectedContent(role: RoleDefinition): string {
  const tierDescription = `${role.tier}-tier specialist`;
  const lines: string[] = ['---'];

  lines.push(`name: ${role.title}`);
  lines.push(`description: ${tierDescription}. ${role.title} role in the Forge engineering team.`);
  lines.push(`model: ${role.model}`);

  lines.push('tools:');
  for (const tool of role.tools) {
    lines.push(`  - ${tool}`);
  }

  if (role.disallowedTools && role.disallowedTools.length > 0) {
    lines.push('disallowedTools:');
    for (const tool of role.disallowedTools) {
      lines.push(`  - ${tool}`);
    }
  }

  lines.push('skills:');
  for (const skill of role.skills) {
    lines.push(`  - ${skill}`);
  }

  lines.push(`maxTurns: ${role.maxTurns}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${role.title}`);
  lines.push('');
  lines.push(`You are the ${role.title} role in the Forge engineering team.`);
  lines.push(`Tier: ${role.tier}`);
  lines.push(`Reports to: ${role.reportsTo}`);
  lines.push(`Color: ${role.color}`);
  lines.push('');

  return lines.join('\n');
}
