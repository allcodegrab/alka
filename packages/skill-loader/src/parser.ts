import { readFile, stat as fsStat } from 'node:fs/promises';
import { ok, err, type Result } from '@forge/protocol';
import type { SkillManifest, SkillContent } from '@forge/protocol';
import { SkillLoadError } from './errors.js';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

interface FrontmatterFields {
  name?: string;
  description?: string;
  globs?: string;
  alwaysApply?: boolean;
}

function parseFrontmatter(raw: string): Result<FrontmatterFields, SkillLoadError> {
  const lines = raw.split('\n');
  const fields: FrontmatterFields = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    switch (key) {
      case 'name':
        fields.name = value;
        break;
      case 'description':
        fields.description = value;
        break;
      case 'globs':
        fields.globs = value === '""' || value === "''" ? '' : value;
        break;
      case 'alwaysApply':
        fields.alwaysApply = value === 'true';
        break;
    }
  }

  if (!fields.name) {
    return err(new SkillLoadError('PARSE_ERROR', 'Missing required "name" field in frontmatter'));
  }

  return ok(fields);
}

export async function parseSkillFile(
  filePath: string,
): Promise<Result<SkillContent, SkillLoadError>> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const match = FRONTMATTER_RE.exec(raw);

    if (!match) {
      return err(new SkillLoadError('PARSE_ERROR', `No valid frontmatter found in ${filePath}`));
    }

    const [, frontmatterRaw, body] = match;

    if (!frontmatterRaw) {
      return err(new SkillLoadError('PARSE_ERROR', `Empty frontmatter in ${filePath}`));
    }

    const fieldsResult = parseFrontmatter(frontmatterRaw);
    if (!fieldsResult.ok) return fieldsResult;

    const fields = fieldsResult.value;
    const manifest: SkillManifest = {
      name: fields.name!,
      description: fields.description ?? '',
      globs: fields.globs,
      alwaysApply: fields.alwaysApply,
      filePath,
    };

    return ok({ manifest, body: body?.trim() ?? '' });
  } catch (e) {
    return err(
      new SkillLoadError(
        'IO_ERROR',
        `Failed to read ${filePath}: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export interface CachedSkill {
  content: SkillContent;
  mtime: number;
}

const cache = new Map<string, CachedSkill>();

export async function parseSkillFileCached(
  filePath: string,
): Promise<Result<SkillContent, SkillLoadError>> {
  try {
    const s = await fsStat(filePath);
    const mtimeMs = s.mtimeMs;
    const cached = cache.get(filePath);

    if (cached && cached.mtime === mtimeMs) {
      return ok(cached.content);
    }

    const result = await parseSkillFile(filePath);
    if (result.ok) {
      cache.set(filePath, { content: result.value, mtime: mtimeMs });
    }
    return result;
  } catch (e) {
    return err(
      new SkillLoadError(
        'IO_ERROR',
        `Failed to stat ${filePath}: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

export function clearCache(): void {
  cache.clear();
}
