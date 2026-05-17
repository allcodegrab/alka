import { ok, err, type Result } from '@forge/protocol';
import type { OrgChart } from '@forge/protocol';
import { spawnAgent, type SpawnOptions } from '@forge/agent-runtime';
import { getSkillsForRole, formatSkillsForPrompt } from '@forge/skill-loader';
import { parseOrgChart } from '../org-chart/parser.js';
import { updateWhiteboard } from '../mission/io.js';
import type { SliceAssignment, SliceResult } from './types.js';
import { OrchestratorError } from './errors.js';

/**
 * Async semaphore for bounding concurrency.
 * Does not depend on any third-party library.
 */
class Semaphore {
  private waiting: Array<() => void> = [];
  private active = 0;

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waiting.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  release(): void {
    this.active--;
    const next = this.waiting.shift();
    if (next) next();
  }
}

/**
 * Execute slices in parallel with bounded concurrency.
 * Each slice spawns an agent in a worktree, tracks progress on the whiteboard,
 * and collects results. Failed slices do not block other slices.
 */
export async function executeSlicesParallel(
  projectRoot: string,
  missionId: string,
  slices: SliceAssignment[],
  orgChartPath: string,
  skillsDir: string,
  concurrency: number,
): Promise<Result<SliceResult[], OrchestratorError>> {
  // Load org chart
  const orgResult = await parseOrgChart(orgChartPath);
  if (!orgResult.ok) {
    return err(
      new OrchestratorError(
        'EXECUTION_FAILED',
        `Failed to load org chart: ${orgResult.error.message}`,
      ),
    );
  }
  const orgChart: OrgChart = orgResult.value;

  const sem = new Semaphore(concurrency);

  const promises = slices.map(async (slice): Promise<SliceResult> => {
    await sem.acquire();
    try {
      return await executeSlice(projectRoot, missionId, slice, orgChart, skillsDir);
    } finally {
      sem.release();
    }
  });

  const settled = await Promise.allSettled(promises);

  const results: SliceResult[] = settled.map((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      return outcome.value;
    }
    // Should not happen since executeSlice catches its own errors,
    // but handle defensively.
    const slice = slices[i]!;
    return {
      sliceId: slice.sliceId,
      roleId: slice.roleId,
      status: 'failed' as const,
      costUsd: 0,
      error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
    };
  });

  return ok(results);
}

async function executeSlice(
  projectRoot: string,
  missionId: string,
  slice: SliceAssignment,
  orgChart: OrgChart,
  skillsDir: string,
): Promise<SliceResult> {
  // Look up role in org chart
  const role = orgChart.roles.find((r) => r.id === slice.roleId);
  if (!role) {
    return {
      sliceId: slice.sliceId,
      roleId: slice.roleId,
      status: 'failed',
      costUsd: 0,
      error: `Role '${slice.roleId}' not found in org chart`,
    };
  }

  // Load skills for role
  let skillsPrompt = '';
  if (role.skills.length > 0) {
    const skillsResult = await getSkillsForRole(skillsDir, role.skills as string[]);
    if (skillsResult.ok) {
      skillsPrompt = formatSkillsForPrompt(skillsResult.value);
    }
  }

  // Update whiteboard: slice started
  await updateWhiteboard(
    projectRoot,
    missionId,
    slice.roleId,
    `Slice ${slice.sliceId}: RUNNING - ${slice.description}`,
  );

  // Build prompts
  const systemPrompt = buildSystemPrompt(slice, skillsPrompt);
  const userMessage = buildUserMessage(slice);

  const spawnOpts: SpawnOptions = {
    role,
    missionId,
    systemPrompt,
    userMessage,
    projectRoot,
  };

  const agentResult = await spawnAgent(spawnOpts);

  if (!agentResult.ok) {
    // Update whiteboard: slice failed
    await updateWhiteboard(
      projectRoot,
      missionId,
      slice.roleId,
      `Slice ${slice.sliceId}: FAILED - ${agentResult.error.message}`,
    );
    return {
      sliceId: slice.sliceId,
      roleId: slice.roleId,
      status: 'failed',
      costUsd: 0,
      error: agentResult.error.message,
    };
  }

  const run = agentResult.value;

  // Update whiteboard: slice complete or failed
  const status = run.status === 'complete' ? 'complete' : 'failed';
  await updateWhiteboard(
    projectRoot,
    missionId,
    slice.roleId,
    `Slice ${slice.sliceId}: ${status === 'complete' ? 'DONE' : 'FAILED'} - ${slice.description}`,
  );

  return {
    sliceId: slice.sliceId,
    roleId: slice.roleId,
    status,
    costUsd: run.costUsd,
    output: run.error ?? undefined,
    error: run.status === 'failed' ? (run.error ?? 'Agent failed') : undefined,
  };
}

function buildSystemPrompt(slice: SliceAssignment, skillsPrompt: string): string {
  let prompt = `You are an implementer working on slice "${slice.sliceId}".
Your task: ${slice.description}
Files you should focus on: ${slice.files.join(', ')}`;

  if (slice.dependencies.length > 0) {
    prompt += `\nThis slice depends on: ${slice.dependencies.join(', ')}`;
  }

  if (skillsPrompt) {
    prompt += `\n\n${skillsPrompt}`;
  }

  return prompt;
}

function buildUserMessage(slice: SliceAssignment): string {
  return `Implement the following slice:\n\nDescription: ${slice.description}\nFiles: ${slice.files.join(', ')}\n\nWrite production-quality code. Follow existing patterns in the codebase.`;
}
