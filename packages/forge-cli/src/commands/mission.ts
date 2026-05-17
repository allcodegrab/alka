import { Command } from 'commander';
import { resolve } from 'node:path';
import { createMission, listMissions, closeMission } from '@forge/team-mode';

function getProjectRoot(): string {
  return resolve(process.cwd());
}

export function missionCommand(): Command {
  const cmd = new Command('mission').description('Manage missions');

  cmd
    .command('start')
    .description('Start a new mission')
    .requiredOption('--name <name>', 'Mission name')
    .option('--mode <mode>', 'Mission mode (standard or 24h)', 'standard')
    .option('--brief <brief>', 'Mission brief text', 'Mission started via CLI.')
    .action(async (opts: { name: string; mode: string; brief: string }) => {
      const root = getProjectRoot();
      const mode = opts.mode === '24h' ? '24h' : 'standard';
      const result = await createMission(root, opts.name, mode, opts.brief);

      if (result.ok) {
        console.log(`Mission created: ${result.value}`);
        console.log(`Directory: .claude/missions/${result.value}/`);
      } else {
        console.error(`Failed to create mission: ${result.error.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List all missions')
    .action(async () => {
      const root = getProjectRoot();
      const result = await listMissions(root);

      if (!result.ok) {
        console.error(`Failed to list missions: ${result.error.message}`);
        process.exit(1);
      }

      if (result.value.length === 0) {
        console.log('No missions found.');
        return;
      }

      console.log('Missions:');
      for (const m of result.value) {
        const status = m.status.toUpperCase().padEnd(10);
        console.log(`  ${status} ${m.id}  ${m.name}`);
      }
    });

  cmd
    .command('status')
    .description('Show current mission status')
    .option('--id <id>', 'Mission ID (defaults to most recent)')
    .action(async (opts: { id?: string }) => {
      const root = getProjectRoot();
      const missions = await listMissions(root);

      if (!missions.ok) {
        console.error(`Failed: ${missions.error.message}`);
        process.exit(1);
      }

      if (missions.value.length === 0) {
        console.log('No missions found.');
        return;
      }

      const target = opts.id ? missions.value.find((m) => m.id === opts.id) : missions.value[0];

      if (!target) {
        console.error(`Mission not found: ${opts.id}`);
        process.exit(1);
      }

      console.log(`Mission: ${target.name}`);
      console.log(`ID:      ${target.id}`);
      console.log(`Status:  ${target.status}`);
      console.log(`Mode:    ${target.mode}`);
    });

  cmd
    .command('close')
    .description('Close a mission')
    .requiredOption('--id <id>', 'Mission ID to close')
    .action(async (opts: { id: string }) => {
      const root = getProjectRoot();
      const result = await closeMission(root, opts.id);

      if (result.ok) {
        console.log(`Mission ${opts.id} closed.`);
      } else {
        console.error(`Failed to close mission: ${result.error.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
