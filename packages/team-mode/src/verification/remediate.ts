import { ok, err, type Result } from '@forge/protocol';
import { spawnAgent, type SpawnOptions } from '@forge/agent-runtime';
import { parseOrgChart } from '../org-chart/parser.js';
import { getSkillsForRole, formatSkillsForPrompt } from '@forge/skill-loader';
import { VerificationError } from './errors.js';
import type { Finding } from './types.js';

function formatFindingsForRemediation(findings: Finding[]): string {
  const actionable = findings.filter((f) => f.severity === 'critical' || f.severity === 'high');

  if (actionable.length === 0) return '';

  const lines = actionable.map(
    (f, i) =>
      `${i + 1}. [${f.severity.toUpperCase()}] ${f.location}\n   Issue: ${f.evidence}\n   Fix: ${f.suggestion}`,
  );

  return lines.join('\n\n');
}

const REMEDIATION_SYSTEM_PROMPT = `You are an implementation agent. You have been given findings from code review that must be fixed.
Fix ALL listed issues in the codebase. Focus on HIGH and CRITICAL severity findings first.
After fixing, briefly summarize what you changed.`;

export async function remediateFindings(
  projectRoot: string,
  missionId: string,
  sliceId: string,
  findings: Finding[],
  implRoleId: string,
  orgChartPath: string,
  maxRetries: number = 2,
): Promise<Result<boolean, VerificationError>> {
  const orgResult = await parseOrgChart(orgChartPath);
  if (!orgResult.ok) {
    return err(
      new VerificationError('IO_ERROR', `Failed to parse org chart: ${orgResult.error.message}`),
    );
  }

  const orgChart = orgResult.value;
  const role = orgChart.roles.find((r) => r.id === implRoleId);
  if (!role) {
    return err(new VerificationError('SPAWN_FAILED', `Implementer role not found: ${implRoleId}`));
  }

  const findingsText = formatFindingsForRemediation(findings);
  if (!findingsText) {
    // No actionable findings
    return ok(true);
  }

  // Load skills for the implementer role
  const skillsDir = `${projectRoot}/.forge/skills`;
  let systemPrompt = REMEDIATION_SYSTEM_PROMPT;

  const skillsResult = await getSkillsForRole(skillsDir, role.skills as string[]);
  if (skillsResult.ok && skillsResult.value.length > 0) {
    const skillsText = formatSkillsForPrompt(skillsResult.value);
    systemPrompt = `${REMEDIATION_SYSTEM_PROMPT}\n\n${skillsText}`;
  }

  const userMessage = [
    `## Mission: ${missionId}`,
    `## Slice: ${sliceId}`,
    '',
    '## Verification Findings to Fix:',
    '',
    findingsText,
    '',
    'Fix all the issues listed above.',
  ].join('\n');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const options: SpawnOptions = {
      role,
      missionId,
      systemPrompt,
      userMessage,
      projectRoot,
    };

    const agentResult = await spawnAgent(options);

    if (!agentResult.ok) {
      if (attempt === maxRetries - 1) {
        return err(
          new VerificationError(
            'SPAWN_FAILED',
            `Remediation agent failed after ${maxRetries} attempts: ${agentResult.error.message}`,
          ),
        );
      }
      continue;
    }

    const agentRun = agentResult.value;
    if (agentRun.status === 'complete') {
      return ok(true);
    }

    if (attempt === maxRetries - 1) {
      return err(
        new VerificationError(
          'SPAWN_FAILED',
          `Remediation agent did not complete after ${maxRetries} attempts`,
        ),
      );
    }
  }

  return err(new VerificationError('SPAWN_FAILED', 'Remediation exhausted all retries'));
}
