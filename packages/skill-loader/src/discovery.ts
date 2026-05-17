import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { SkillLoadError } from './errors.js';

export async function discoverSkillFiles(
  skillsDir: string,
): Promise<Result<string[], SkillLoadError>> {
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    const paths: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillFile = join(skillsDir, entry.name, 'SKILL.md');
      try {
        const s = await stat(skillFile);
        if (s.isFile()) {
          paths.push(skillFile);
        }
      } catch {
        // No SKILL.md in this directory — skip
      }
    }

    return ok(paths.sort());
  } catch (e) {
    return err(
      new SkillLoadError(
        'DISCOVERY_ERROR',
        `Failed to discover skills in ${skillsDir}: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
