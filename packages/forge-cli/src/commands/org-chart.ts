import { Command } from 'commander';
import { resolve, join } from 'node:path';
import { parseOrgChart, generateAgentFiles, detectDrift } from '@forge/team-mode';

function getProjectRoot(): string {
  return resolve(process.cwd());
}

export function orgChartCommand(): Command {
  const cmd = new Command('org-chart').description('Manage the engineering team org chart');

  cmd
    .command('sync')
    .description('Generate .claude/agents/*.md files from .forge/org-chart.yaml')
    .action(async () => {
      const root = getProjectRoot();
      const yamlPath = join(root, '.forge', 'org-chart.yaml');

      const parseResult = await parseOrgChart(yamlPath);
      if (!parseResult.ok) {
        console.error(`Failed to parse org chart: ${parseResult.error.message}`);
        process.exit(1);
      }

      const genResult = await generateAgentFiles(root, parseResult.value);
      if (!genResult.ok) {
        console.error(`Failed to generate agent files: ${genResult.error.message}`);
        process.exit(1);
      }

      console.log(`Generated ${genResult.value.length} agent file(s):`);
      for (const path of genResult.value) {
        console.log(`  ${path}`);
      }
    });

  cmd
    .command('verify')
    .description('Check for drift between org-chart.yaml and agent .md files')
    .action(async () => {
      const root = getProjectRoot();
      const yamlPath = join(root, '.forge', 'org-chart.yaml');

      const parseResult = await parseOrgChart(yamlPath);
      if (!parseResult.ok) {
        console.error(`Failed to parse org chart: ${parseResult.error.message}`);
        process.exit(1);
      }

      const driftResult = await detectDrift(root, parseResult.value);
      if (!driftResult.ok) {
        console.error(`Failed to detect drift: ${driftResult.error.message}`);
        process.exit(1);
      }

      const report = driftResult.value;
      if (report.inSync) {
        console.log('Org chart and agent files are in sync.');
      } else {
        console.log('Drift detected:');
        if (report.missing.length > 0) {
          console.log(`  Missing agent files: ${report.missing.join(', ')}`);
        }
        if (report.extra.length > 0) {
          console.log(`  Extra agent files (not in YAML): ${report.extra.join(', ')}`);
        }
        if (report.modified.length > 0) {
          console.log(`  Modified (out of sync): ${report.modified.join(', ')}`);
        }
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List all roles in the org chart')
    .action(async () => {
      const root = getProjectRoot();
      const yamlPath = join(root, '.forge', 'org-chart.yaml');

      const parseResult = await parseOrgChart(yamlPath);
      if (!parseResult.ok) {
        console.error(`Failed to parse org chart: ${parseResult.error.message}`);
        process.exit(1);
      }

      const { roles } = parseResult.value;
      console.log(`Team: ${parseResult.value.name} (${roles.length} roles)`);
      console.log(`CTO: ${parseResult.value.cto}\n`);

      for (const role of roles) {
        const tools = (role.tools as string[]).join(', ');
        console.log(`  @${role.id} [${role.tier}] ${role.model}`);
        console.log(`    Tools: ${tools}`);
        console.log(`    Skills: ${role.skills.join(', ')}`);
        console.log('');
      }
    });

  return cmd;
}
