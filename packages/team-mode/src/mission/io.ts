import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import type { MissionState, DecisionEntry } from '@forge/protocol';
import { MissionStateSchema } from '@forge/protocol';
import { MissionError } from './errors.js';

function missionDir(projectRoot: string, missionId: string): string {
  return join(projectRoot, '.claude', 'missions', missionId);
}

async function readFileSafe(path: string): Promise<Result<string, MissionError>> {
  try {
    const content = await readFile(path, 'utf-8');
    return ok(content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      return err(new MissionError('NOT_FOUND', `File not found: ${path}`));
    }
    return err(new MissionError('IO_ERROR', `Failed to read file: ${msg}`));
  }
}

async function writeFileSafe(path: string, content: string): Promise<Result<void, MissionError>> {
  try {
    await writeFile(path, content, 'utf-8');
    return ok(undefined);
  } catch (e) {
    return err(
      new MissionError(
        'IO_ERROR',
        `Failed to write file: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}

function formatDecisionEntry(entry: DecisionEntry): string {
  let md = `### ${entry.id} — ${entry.timestamp}\n`;
  md += `**Role:** ${entry.role}\n`;
  md += `**Type:** ${entry.type}\n`;
  md += `**Summary:** ${entry.summary}\n`;
  md += `**Why:** ${entry.why}\n`;
  return md;
}

export async function appendDecision(
  projectRoot: string,
  missionId: string,
  entry: DecisionEntry,
): Promise<Result<void, MissionError>> {
  const path = join(missionDir(projectRoot, missionId), 'decisions.md');
  const existing = await readFileSafe(path);
  if (!existing.ok) return existing;

  const formatted = formatDecisionEntry(entry);
  const updated = existing.value.trimEnd() + '\n\n' + formatted;
  return writeFileSafe(path, updated);
}

export async function updateWhiteboard(
  projectRoot: string,
  missionId: string,
  roleId: string,
  content: string,
): Promise<Result<void, MissionError>> {
  const path = join(missionDir(projectRoot, missionId), 'whiteboard.md');
  const existing = await readFileSafe(path);
  if (!existing.ok) return existing;

  const sectionHeader = `## @${roleId}`;
  const lines = existing.value.split('\n');
  const sectionStart = lines.findIndex((l) => l.trim() === sectionHeader);

  if (sectionStart === -1) {
    // Append new section
    const updated = existing.value.trimEnd() + '\n\n' + sectionHeader + '\n' + content + '\n';
    return writeFileSafe(path, updated);
  }

  // Find the end of this section (next ## or end of file)
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (lines[i]!.startsWith('## ')) {
      sectionEnd = i;
      break;
    }
  }

  const before = lines.slice(0, sectionStart + 1);
  const after = lines.slice(sectionEnd);
  const updated = [...before, content, '', ...after].join('\n');
  return writeFileSafe(path, updated);
}

export async function updateDashboard(
  projectRoot: string,
  missionId: string,
  state: MissionState,
): Promise<Result<void, MissionError>> {
  const path = join(missionDir(projectRoot, missionId), 'dashboard.json');
  return writeFileSafe(path, JSON.stringify(state, null, 2) + '\n');
}

export async function writeArtifact(
  projectRoot: string,
  missionId: string,
  roleId: string,
  filename: string,
  content: string,
): Promise<Result<void, MissionError>> {
  const artifactPath = join(missionDir(projectRoot, missionId), 'artifacts', roleId, filename);
  try {
    await mkdir(dirname(artifactPath), { recursive: true });
  } catch (e) {
    return err(
      new MissionError(
        'IO_ERROR',
        `Failed to create artifact directory: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
  return writeFileSafe(artifactPath, content);
}

export async function readContext(
  projectRoot: string,
  missionId: string,
): Promise<Result<string, MissionError>> {
  return readFileSafe(join(missionDir(projectRoot, missionId), 'context.md'));
}

export async function readWhiteboard(
  projectRoot: string,
  missionId: string,
): Promise<Result<string, MissionError>> {
  return readFileSafe(join(missionDir(projectRoot, missionId), 'whiteboard.md'));
}

export async function readDashboard(
  projectRoot: string,
  missionId: string,
): Promise<Result<MissionState, MissionError>> {
  const path = join(missionDir(projectRoot, missionId), 'dashboard.json');
  const raw = await readFileSafe(path);
  if (!raw.ok) return raw;

  try {
    const parsed = JSON.parse(raw.value);
    const validated = MissionStateSchema.parse(parsed);
    return ok(validated);
  } catch (e) {
    return err(
      new MissionError(
        'INVALID_STATE',
        `Invalid dashboard data: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }
}
