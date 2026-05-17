import { ok, err, type Result } from '@forge/protocol';
import { readDashboard, updateDashboard, writeArtifact } from '../mission/io.js';
import type { SliceResult } from './types.js';
import { OrchestratorError } from './errors.js';

/**
 * Aggregate slice results and update mission state.
 * - Updates dashboard.json with slicesCompleted, totalCostUsd, and status
 * - Writes a synthesis artifact with a summary of all slice outcomes
 */
export async function synthesizeResults(
  projectRoot: string,
  missionId: string,
  results: SliceResult[],
): Promise<Result<void, OrchestratorError>> {
  // Read current dashboard
  const dashResult = await readDashboard(projectRoot, missionId);
  if (!dashResult.ok) {
    return err(
      new OrchestratorError('IO_ERROR', `Failed to read dashboard: ${dashResult.error.message}`),
    );
  }

  const state = dashResult.value;

  // Compute aggregates
  const completed = results.filter((r) => r.status === 'complete');
  const failed = results.filter((r) => r.status === 'failed');
  const totalCost = results.reduce((sum, r) => sum + r.costUsd, 0);

  // Update state
  state.slicesCompleted = completed.length;
  state.slicesTotal = results.length;
  state.totalCostUsd = (state.totalCostUsd ?? 0) + totalCost;

  if (failed.length === 0) {
    state.status = 'completed' as typeof state.status;
    state.completedAt = new Date().toISOString();
  }
  // If some failed, keep status as active so the orchestrator can retry or escalate

  const dashWriteResult = await updateDashboard(projectRoot, missionId, state);
  if (!dashWriteResult.ok) {
    return err(
      new OrchestratorError(
        'IO_ERROR',
        `Failed to update dashboard: ${dashWriteResult.error.message}`,
      ),
    );
  }

  // Write synthesis artifact
  const summary = buildSynthesisSummary(results);
  const artifactResult = await writeArtifact(
    projectRoot,
    missionId,
    'orchestrator',
    'synthesis.md',
    summary,
  );
  if (!artifactResult.ok) {
    return err(
      new OrchestratorError(
        'IO_ERROR',
        `Failed to write synthesis artifact: ${artifactResult.error.message}`,
      ),
    );
  }

  return ok(undefined);
}

function buildSynthesisSummary(results: SliceResult[]): string {
  const completed = results.filter((r) => r.status === 'complete');
  const failed = results.filter((r) => r.status === 'failed');
  const totalCost = results.reduce((sum, r) => sum + r.costUsd, 0);

  let md = '# Synthesis Report\n\n';
  md += `**Total slices:** ${results.length}\n`;
  md += `**Completed:** ${completed.length}\n`;
  md += `**Failed:** ${failed.length}\n`;
  md += `**Total cost:** $${totalCost.toFixed(4)}\n\n`;

  md += '## Slice Results\n\n';
  for (const r of results) {
    const icon = r.status === 'complete' ? '[DONE]' : '[FAIL]';
    md += `### ${icon} ${r.sliceId} (${r.roleId})\n`;
    md += `- **Status:** ${r.status}\n`;
    md += `- **Cost:** $${r.costUsd.toFixed(4)}\n`;
    if (r.error) {
      md += `- **Error:** ${r.error}\n`;
    }
    md += '\n';
  }

  return md;
}
