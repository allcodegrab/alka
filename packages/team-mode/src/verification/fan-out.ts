import { ok, err, type Result } from '@forge/protocol';
import type { RoleDefinition, AgentRun } from '@forge/protocol';
import { spawnAgent, type SpawnOptions } from '@forge/agent-runtime';
import { parseOrgChart } from '../org-chart/parser.js';
import { getSkillsForRole, formatSkillsForPrompt } from '@forge/skill-loader';
import { VerificationError } from './errors.js';
import { aggregateFindings, isBlocked, isStorm, sortBySeverity } from './findings.js';
import type { Finding, VerificationReport } from './types.js';

const VERIFIER_PROMPT = `You are a code verification agent. Analyze the provided diff and report any issues you find.

Respond ONLY with a JSON object in this exact format:
{ "findings": [{ "severity": "info|low|medium|high|critical", "location": "<file:line or description>", "evidence": "<what you found>", "suggestion": "<how to fix>" }] }

If you find no issues, respond with: { "findings": [] }`;

function buildUserMessage(missionId: string, sliceId: string, diffContent: string): string {
  return [
    `## Mission: ${missionId}`,
    `## Slice: ${sliceId}`,
    '',
    '## Diff to verify:',
    '```diff',
    diffContent,
    '```',
    '',
    'Analyze this diff and report findings as JSON.',
  ].join('\n');
}

function parseFindings(output: string, verifierRoleId: string): Finding[] {
  // Try to extract JSON from the output, handling cases where the agent
  // wraps it in markdown code blocks or adds extra text.
  const jsonMatch = output.match(/\{[\s\S]*"findings"[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { findings?: unknown[] };
    if (!Array.isArray(parsed.findings)) return [];

    return parsed.findings
      .filter(
        (f): f is Record<string, string> =>
          typeof f === 'object' &&
          f !== null &&
          typeof (f as Record<string, unknown>)['severity'] === 'string' &&
          typeof (f as Record<string, unknown>)['location'] === 'string' &&
          typeof (f as Record<string, unknown>)['evidence'] === 'string' &&
          typeof (f as Record<string, unknown>)['suggestion'] === 'string',
      )
      .map((f) => ({
        severity: normalizeSeverity(f['severity'] ?? ''),
        verifier: verifierRoleId,
        location: f['location'] ?? '',
        evidence: f['evidence'] ?? '',
        suggestion: f['suggestion'] ?? '',
      }));
  } catch {
    return [];
  }
}

function normalizeSeverity(s: string): Finding['severity'] {
  const lower = s.toLowerCase();
  if (
    lower === 'critical' ||
    lower === 'high' ||
    lower === 'medium' ||
    lower === 'low' ||
    lower === 'info'
  ) {
    return lower;
  }
  return 'info';
}

function findRole(roles: RoleDefinition[], roleId: string): RoleDefinition | undefined {
  return roles.find((r) => r.id === roleId);
}

export async function runVerification(
  projectRoot: string,
  missionId: string,
  sliceId: string,
  diffContent: string,
  verifierRoleIds: string[],
  orgChartPath: string,
): Promise<Result<VerificationReport, VerificationError>> {
  // Parse org chart
  const orgResult = await parseOrgChart(orgChartPath);
  if (!orgResult.ok) {
    return err(
      new VerificationError('IO_ERROR', `Failed to parse org chart: ${orgResult.error.message}`),
    );
  }

  const orgChart = orgResult.value;
  const userMessage = buildUserMessage(missionId, sliceId, diffContent);

  // Build spawn tasks for each verifier
  const spawnTasks = verifierRoleIds.map(async (roleId) => {
    const role = findRole(orgChart.roles, roleId);
    if (!role) {
      throw new VerificationError('SPAWN_FAILED', `Role not found in org chart: ${roleId}`);
    }

    // Load skills for the verifier role
    const skillsDir = `${projectRoot}/.forge/skills`;
    let systemPrompt = VERIFIER_PROMPT;

    const skillsResult = await getSkillsForRole(skillsDir, role.skills as string[]);
    if (skillsResult.ok && skillsResult.value.length > 0) {
      const skillsText = formatSkillsForPrompt(skillsResult.value);
      systemPrompt = `${VERIFIER_PROMPT}\n\n${skillsText}`;
    }

    const options: SpawnOptions = {
      role,
      missionId,
      systemPrompt,
      userMessage,
      projectRoot,
    };

    const agentResult = await spawnAgent(options);
    return { roleId, agentResult };
  });

  // Run all verifiers concurrently
  const results = await Promise.allSettled(spawnTasks);

  // Collect results
  const perVerifier = new Map<string, Finding[]>();
  const passedVerifiers: string[] = [];
  const failedVerifiers: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const roleId = verifierRoleIds[i]!;
    const settled = results[i]!;

    if (settled.status === 'rejected') {
      failedVerifiers.push(roleId);
      continue;
    }

    const { agentResult } = settled.value;

    if (!agentResult.ok) {
      failedVerifiers.push(roleId);
      continue;
    }

    const agentRun: AgentRun = agentResult.value;
    if (agentRun.status === 'failed') {
      failedVerifiers.push(roleId);
      continue;
    }

    // Parse the agent output — the result field contains the agent's response
    const output = (agentRun as AgentRun & { result?: string }).result ?? '';
    const findings = parseFindings(output, roleId);
    perVerifier.set(roleId, findings);
    passedVerifiers.push(roleId);
  }

  const allFindings = sortBySeverity(aggregateFindings(perVerifier));
  const blocked = isBlocked(allFindings);
  const storm = isStorm(allFindings);

  const report: VerificationReport = {
    sliceId,
    findings: allFindings,
    passedVerifiers,
    failedVerifiers,
    isBlocked: blocked,
    isStorm: storm,
  };

  if (storm) {
    return err(
      new VerificationError(
        'STORM_DETECTED',
        `Storm detected: ${allFindings.filter((f) => f.severity === 'high').length} high-severity findings`,
      ),
    );
  }

  return ok(report);
}
