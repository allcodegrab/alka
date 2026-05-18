import { Command } from 'commander';
import { resolve } from 'node:path';
import {
  runDreamCycle,
  isDreamWindow,
  shouldMeditate,
  generateMeditation,
  consultSme,
  isValidDomain,
  type SmeDomain,
} from '@forge/team-mode';

function getProjectRoot(): string {
  return resolve(process.cwd());
}

export function operationsCommand(): Command {
  const cmd = new Command('ops').description('Advanced operations');

  cmd
    .command('payroll')
    .description('Generate payroll report')
    .option('--month <month>', 'Month in YYYY-MM format')
    .action(async (opts: { month?: string }) => {
      const month = opts.month ?? new Date().toISOString().slice(0, 7);
      console.log(`Payroll report for ${month}`);
      console.log('  (Payroll generation not yet integrated — stub output)');
    });

  cmd
    .command('schedule')
    .description('Show current schedule status')
    .action(() => {
      const dreamConfig = { weekday: '02:00-06:00', weekend: '01:00-07:00' };
      const inWindow = isDreamWindow(dreamConfig);
      console.log('Schedule Status:');
      console.log(`  Dream window active: ${inWindow ? 'yes' : 'no'}`);
      console.log(`  Weekday window: ${dreamConfig.weekday}`);
      console.log(`  Weekend window: ${dreamConfig.weekend}`);
    });

  cmd
    .command('dream')
    .description('Run dream cycle manually')
    .action(async () => {
      const root = getProjectRoot();
      console.log('Starting dream cycle...');
      const result = await runDreamCycle(root);

      if (result.ok) {
        console.log(`Dream cycle completed in ${result.value.durationMs}ms`);
        console.log(`  Operations: ${result.value.operations.length}`);
        console.log(`  Proposals generated: ${result.value.proposalsGenerated}`);
        for (const op of result.value.operations) {
          const icon = op.status === 'success' ? '[OK]' : '[FAIL]';
          console.log(`  ${icon} ${op.name}${op.detail ? `: ${op.detail}` : ''}`);
        }
      } else {
        console.error(`Dream cycle failed: ${result.error.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('meditate <mission-id>')
    .description('Trigger meditation for a mission')
    .action(async (missionId: string) => {
      const root = getProjectRoot();

      if (!shouldMeditate('completed', true)) {
        console.log('Meditation not triggered.');
        return;
      }

      const metrics = {
        slicesAssigned: 0,
        slicesCompleted: 0,
        slicesRetried: 0,
        findingsAgainst: 0,
        escalations: 0,
        avgWallTimeMinutes: 0,
        budgetMinutes: 0,
        costUsd: 0,
        missionSharePct: 0,
        retries: 0,
      };

      const result = await generateMeditation(root, missionId, 'cli-user', metrics);

      if (result.ok) {
        console.log(`Meditation generated: ${result.value}`);
      } else {
        console.error(`Meditation failed: ${result.error.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('sme <domain> <question>')
    .description('Consult an SME in a domain')
    .action(async (domain: string, question: string) => {
      const root = getProjectRoot();

      if (!isValidDomain(domain)) {
        console.error(`Unknown domain: ${domain}`);
        console.error(
          'Valid domains: java-spring, typescript-frontend, mongodb-firestore, aws-cloud, voice-ai',
        );
        process.exit(1);
      }

      const result = await consultSme(root, { domain: domain as SmeDomain, question });

      if (result.ok) {
        console.log(`SME Response (${result.value.confidence} confidence):`);
        console.log(`  ${result.value.answer}`);
        if (result.value.citations.length > 0) {
          console.log('  Citations:');
          for (const citation of result.value.citations) {
            console.log(`    - ${citation}`);
          }
        }
      } else {
        console.error(`SME consult failed: ${result.error.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('learning')
    .description('List learning proposals')
    .action(async () => {
      console.log('Learning proposals:');
      console.log('  (No proposals found — run learning crawl first)');
    });

  cmd
    .command('healing-log')
    .description('Show recent self-healing events')
    .action(() => {
      console.log('Recent healing events:');
      console.log('  (No healing events recorded)');
    });

  return cmd;
}
