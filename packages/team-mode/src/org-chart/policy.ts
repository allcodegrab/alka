import type { RoleDefinition, OrgChartPolicy } from '@forge/protocol';

/**
 * Simple glob match: `*` matches any sequence of characters.
 * E.g. `*-verifier` matches `security-verifier`, `tests-verifier`.
 */
export function globMatch(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
  return regex.test(value);
}

/**
 * Parse a policy rule string and apply it to a role definition.
 * Supported rule formats:
 *   - "disallowedTools: [Edit, Write, Bash]"
 *   - "model: gemini-2-5-pro"
 */
function parseAndApplyRule(role: RoleDefinition, rule: string): RoleDefinition {
  const colonIndex = rule.indexOf(':');
  if (colonIndex === -1) return role;

  const key = rule.slice(0, colonIndex).trim();
  const rawValue = rule.slice(colonIndex + 1).trim();

  switch (key) {
    case 'disallowedTools': {
      const items = rawValue
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return { ...role, disallowedTools: items as RoleDefinition['disallowedTools'] };
    }
    case 'model': {
      return { ...role, model: rawValue as RoleDefinition['model'] };
    }
    case 'tools': {
      const items = rawValue
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return { ...role, tools: items as RoleDefinition['tools'] };
    }
    case 'maxTurns': {
      return { ...role, maxTurns: parseInt(rawValue, 10) };
    }
    default:
      return role;
  }
}

/**
 * Apply all matching policies to a role definition.
 * For each policy, check if the role ID matches any pattern in `appliesTo`.
 */
export function applyPolicies(role: RoleDefinition, policies: OrgChartPolicy[]): RoleDefinition {
  let result = { ...role };
  for (const policy of policies) {
    const matches = policy.appliesTo.some((pattern) => globMatch(pattern, role.id));
    if (matches) {
      result = parseAndApplyRule(result, policy.rule);
    }
  }
  return result;
}
