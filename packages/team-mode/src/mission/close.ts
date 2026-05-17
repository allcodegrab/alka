import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ok, err, type Result } from '@forge/protocol';
import { MissionError } from './errors.js';
import { readDashboard, updateDashboard } from './io.js';

function missionDir(projectRoot: string, missionId: string): string {
  return join(projectRoot, '.claude', 'missions', missionId);
}

export async function closeMission(
  projectRoot: string,
  missionId: string,
): Promise<Result<void, MissionError>> {
  // Read current dashboard
  const dashResult = await readDashboard(projectRoot, missionId);
  if (!dashResult.ok) return dashResult;

  const dashboard = dashResult.value;
  if (dashboard.status === 'completed') {
    return err(new MissionError('INVALID_STATE', 'Mission is already completed'));
  }

  // Read mission decisions
  const decisionsPath = join(missionDir(projectRoot, missionId), 'decisions.md');
  let decisionsContent: string;
  try {
    decisionsContent = await readFile(decisionsPath, 'utf-8');
  } catch (e) {
    return err(
      new MissionError(
        'IO_ERROR',
        `Failed to read decisions: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  // Extract decision entries (everything after the header)
  const lines = decisionsContent.split('\n');
  const headerEnd = lines.findIndex((l) => l.startsWith('### '));
  const decisionEntries = headerEnd >= 0 ? lines.slice(headerEnd).join('\n').trim() : '';

  // Append to project-level decisions.md if there are entries
  if (decisionEntries) {
    const projectDecisionsPath = join(projectRoot, '.claude', 'memory', 'decisions.md');
    try {
      await mkdir(dirname(projectDecisionsPath), { recursive: true });
      let existing = '';
      try {
        existing = await readFile(projectDecisionsPath, 'utf-8');
      } catch {
        existing = '# Project Decisions\n';
      }
      const updated = existing.trimEnd() + '\n\n' + decisionEntries + '\n';
      await writeFile(projectDecisionsPath, updated, 'utf-8');
    } catch (e) {
      return err(
        new MissionError(
          'IO_ERROR',
          `Failed to merge decisions: ${e instanceof Error ? e.message : String(e)}`,
        ),
      );
    }
  }

  // Update dashboard status
  const updatedDashboard = {
    ...dashboard,
    status: 'completed' as const,
    completedAt: new Date().toISOString(),
  };
  const updateResult = await updateDashboard(projectRoot, missionId, updatedDashboard);
  if (!updateResult.ok) return updateResult;

  // Update status.md
  const statusPath = join(missionDir(projectRoot, missionId), 'status.md');
  try {
    await writeFile(statusPath, '# Mission Status\n\nMission completed.\n', 'utf-8');
  } catch (e) {
    return err(
      new MissionError(
        'IO_ERROR',
        `Failed to update status: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  return ok(undefined);
}
