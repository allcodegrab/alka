import { spawn as cpSpawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { ok, err, type Result } from '@forge/protocol';
import type { RoleDefinition, AgentRun } from '@forge/protocol';
import { AgentSpawnError } from './errors.js';
import { calculateCost, mapModelToCliModel } from './models.js';
import { createWorktree, removeWorktree } from './worktree.js';

export interface SpawnOptions {
  role: RoleDefinition;
  missionId: string;
  systemPrompt: string;
  userMessage: string;
  projectRoot: string;
  maxTurns?: number;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

interface ClaudeOutput {
  result?: string;
  cost_usd?: number;
  tokens_in?: number;
  tokens_out?: number;
  turns?: number;
}

export async function spawnAgent(
  options: SpawnOptions,
): Promise<Result<AgentRun, AgentSpawnError>> {
  const {
    role,
    missionId,
    systemPrompt,
    userMessage,
    projectRoot,
    maxTurns,
    timeoutMs = 300_000,
  } = options;

  const agentId = `agent-${role.id}-${randomUUID().slice(0, 8)}`;
  const startedAt = new Date().toISOString();
  const effectiveMaxTurns = maxTurns ?? role.maxTurns;

  // Determine working directory
  let workDir = projectRoot;
  let worktreePath: string | undefined;
  let branchName: string | undefined;

  if (role.isolation === 'worktree') {
    branchName = `mission/${missionId}/${role.id}-${agentId.slice(-8)}`;
    const wtResult = await createWorktree(projectRoot, branchName);
    if (!wtResult.ok) return wtResult;
    worktreePath = wtResult.value;
    workDir = worktreePath;
  }

  try {
    const cliModel = mapModelToCliModel(role.model);
    const result = await runClaudeCli({
      model: cliModel,
      systemPrompt,
      userMessage,
      workDir,
      maxTurns: effectiveMaxTurns,
      timeoutMs,
      allowedTools: role.tools as string[],
      disallowedTools: role.disallowedTools as string[] | undefined,
      abortSignal: options.abortSignal,
    });

    const tokensIn = result.tokens_in ?? 0;
    const tokensOut = result.tokens_out ?? 0;
    const costUsd = result.cost_usd ?? calculateCost(role.model, tokensIn, tokensOut);

    const agentRun: AgentRun = {
      agentId: agentId as AgentRun['agentId'],
      roleId: role.id as string,
      missionId,
      model: role.model,
      status: 'complete',
      tokensIn,
      tokensOut,
      costUsd,
      turns: result.turns ?? 0,
      maxTurns: effectiveMaxTurns,
      startedAt,
      completedAt: new Date().toISOString(),
    };

    return ok(agentRun);
  } catch (e) {
    if (e instanceof AgentSpawnError) return err(e);

    const agentRun: AgentRun = {
      agentId: agentId as AgentRun['agentId'],
      roleId: role.id as string,
      missionId,
      model: role.model,
      status: 'failed',
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      turns: 0,
      maxTurns: effectiveMaxTurns,
      startedAt,
      completedAt: new Date().toISOString(),
      error: e instanceof Error ? e.message : String(e),
    };

    return ok(agentRun);
  } finally {
    if (worktreePath && branchName) {
      await removeWorktree(projectRoot, worktreePath, branchName);
    }
  }
}

interface CliOptions {
  model: string;
  systemPrompt: string;
  userMessage: string;
  workDir: string;
  maxTurns: number;
  timeoutMs: number;
  allowedTools: string[];
  disallowedTools?: string[];
  abortSignal?: AbortSignal;
}

function runClaudeCli(options: CliOptions): Promise<ClaudeOutput> {
  return new Promise((resolve, reject) => {
    const args = [
      '--print',
      '--output-format',
      'json',
      '--model',
      options.model,
      '--max-turns',
      String(options.maxTurns),
      '--system-prompt',
      options.systemPrompt,
    ];

    if (options.allowedTools.length > 0) {
      args.push('--allowedTools', options.allowedTools.join(','));
    }

    if (options.disallowedTools && options.disallowedTools.length > 0) {
      args.push('--disallowedTools', options.disallowedTools.join(','));
    }

    args.push(options.userMessage);

    const child = cpSpawn('claude', args, {
      cwd: options.workDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new AgentSpawnError('TIMEOUT', `Agent timed out after ${options.timeoutMs}ms`));
    }, options.timeoutMs);

    if (options.abortSignal) {
      options.abortSignal.addEventListener('abort', () => {
        child.kill('SIGTERM');
        reject(new AgentSpawnError('CANCELLED', 'Agent was cancelled'));
      });
    }

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0 && code !== null) {
        reject(
          new AgentSpawnError(
            'SPAWN_FAILED',
            `claude CLI exited with code ${code}: ${stderr.slice(0, 500)}`,
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as ClaudeOutput;
        resolve(parsed);
      } catch {
        // If JSON parsing fails, return basic result
        resolve({ result: stdout, turns: 1 });
      }
    });

    child.on('error', (e) => {
      clearTimeout(timeout);
      reject(new AgentSpawnError('SPAWN_FAILED', `Failed to spawn claude CLI: ${e.message}`));
    });
  });
}
