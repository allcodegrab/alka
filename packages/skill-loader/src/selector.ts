import type { SkillContent } from '@forge/protocol';
import { ok, err, type Result } from '@forge/protocol';
import { SkillLoadError } from './errors.js';

export function selectSkillsForRole(
  allSkills: SkillContent[],
  roleSkillNames: string[],
): Result<SkillContent[], SkillLoadError> {
  const selected: SkillContent[] = [];
  const missing: string[] = [];

  for (const name of roleSkillNames) {
    const found = allSkills.find((s) => s.manifest.name === name);
    if (found) {
      selected.push(found);
    } else {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    return err(new SkillLoadError('NOT_FOUND', `Skills not found: ${missing.join(', ')}`));
  }

  return ok(selected);
}
