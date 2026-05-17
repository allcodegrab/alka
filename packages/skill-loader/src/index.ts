import { ok, err, type Result } from '@forge/protocol';
import type { SkillManifest, SkillContent } from '@forge/protocol';
import { discoverSkillFiles } from './discovery.js';
import { parseSkillFileCached, clearCache } from './parser.js';
import { selectSkillsForRole } from './selector.js';
import { formatSkillsForPrompt, estimateTokenCount } from './injector.js';
import { SkillLoadError } from './errors.js';

export { SkillLoadError } from './errors.js';
export { discoverSkillFiles } from './discovery.js';
export { parseSkillFile, parseSkillFileCached, clearCache } from './parser.js';
export { selectSkillsForRole } from './selector.js';
export { formatSkillsForPrompt, estimateTokenCount } from './injector.js';

export async function loadSkills(
  skillsDir: string,
): Promise<Result<SkillContent[], SkillLoadError>> {
  const pathsResult = await discoverSkillFiles(skillsDir);
  if (!pathsResult.ok) return pathsResult;

  const skills: SkillContent[] = [];
  const errors: string[] = [];

  for (const filePath of pathsResult.value) {
    const result = await parseSkillFileCached(filePath);
    if (result.ok) {
      skills.push(result.value);
    } else {
      errors.push(`${filePath}: ${result.error.message}`);
    }
  }

  if (errors.length > 0 && skills.length === 0) {
    return err(
      new SkillLoadError('PARSE_ERROR', `All skills failed to parse:\n${errors.join('\n')}`),
    );
  }

  return ok(skills);
}

export async function getSkillsForRole(
  skillsDir: string,
  roleSkillNames: string[],
): Promise<Result<SkillContent[], SkillLoadError>> {
  const allResult = await loadSkills(skillsDir);
  if (!allResult.ok) return allResult;

  return selectSkillsForRole(allResult.value, roleSkillNames);
}
