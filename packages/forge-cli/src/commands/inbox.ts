import { Command } from 'commander';
import { resolve } from 'node:path';

// Inbox module will be available once Slice 9 completes.
// For now, use direct file operations as a minimal implementation.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

function getProjectRoot(): string {
  return resolve(process.cwd());
}

interface InboxItemFile {
  id: string;
  createdAt: string;
  missionId: string;
  severity: string;
  type: string;
  proposer: string;
  summary: string;
  status: string;
  decidedAt?: string;
  decision?: string;
  decisionReason?: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function inboxCommand(): Command {
  const cmd = new Command('inbox').description('Manage the CTO Inbox');

  cmd
    .command('list')
    .description('List pending inbox items')
    .option('--all', 'Show all items including decided ones')
    .action(async (opts: { all?: boolean }) => {
      const root = getProjectRoot();
      const inboxDir = join(root, '.forge', 'inbox');

      try {
        await mkdir(inboxDir, { recursive: true });
        const files = await readdir(inboxDir);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
          console.log('CTO Inbox is empty.');
          return;
        }

        const items: InboxItemFile[] = [];
        for (const f of jsonFiles) {
          const content = await readFile(join(inboxDir, f), 'utf-8');
          items.push(JSON.parse(content) as InboxItemFile);
        }

        const filtered = opts.all ? items : items.filter((i) => i.status === 'pending');

        filtered.sort((a, b) => {
          const sevDiff = (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
          if (sevDiff !== 0) return sevDiff;
          return a.createdAt.localeCompare(b.createdAt);
        });

        if (filtered.length === 0) {
          console.log('No pending inbox items.');
          return;
        }

        console.log(`CTO Inbox (${filtered.length} items):\n`);
        for (const item of filtered) {
          const sev = item.severity.toUpperCase().padEnd(8);
          const status = item.status.toUpperCase().padEnd(8);
          console.log(`  [${sev}] ${status} ${item.id}`);
          console.log(`    ${item.summary}`);
          console.log(`    Proposer: ${item.proposer}  Mission: ${item.missionId}`);
          console.log('');
        }
      } catch {
        console.log('CTO Inbox is empty.');
      }
    });

  cmd
    .command('approve <id>')
    .description('Approve an inbox item')
    .option('--reason <reason>', 'Reason for approval')
    .action(async (id: string, opts: { reason?: string }) => {
      const root = getProjectRoot();
      const filePath = join(root, '.forge', 'inbox', `${id}.json`);

      try {
        const content = await readFile(filePath, 'utf-8');
        const item = JSON.parse(content) as InboxItemFile;

        if (item.status !== 'pending') {
          console.error(`Item ${id} is already ${item.status}.`);
          process.exit(1);
        }

        item.status = 'approved';
        item.decidedAt = new Date().toISOString();
        item.decision = 'approve';
        item.decisionReason = opts.reason ?? 'Approved by CTO';

        await writeFile(filePath, JSON.stringify(item, null, 2) + '\n');
        console.log(`Approved: ${id}`);
      } catch {
        console.error(`Inbox item not found: ${id}`);
        process.exit(1);
      }
    });

  cmd
    .command('reject <id>')
    .description('Reject an inbox item')
    .requiredOption('--reason <reason>', 'Reason for rejection')
    .action(async (id: string, opts: { reason: string }) => {
      const root = getProjectRoot();
      const filePath = join(root, '.forge', 'inbox', `${id}.json`);

      try {
        const content = await readFile(filePath, 'utf-8');
        const item = JSON.parse(content) as InboxItemFile;

        if (item.status !== 'pending') {
          console.error(`Item ${id} is already ${item.status}.`);
          process.exit(1);
        }

        item.status = 'rejected';
        item.decidedAt = new Date().toISOString();
        item.decision = 'reject';
        item.decisionReason = opts.reason;

        await writeFile(filePath, JSON.stringify(item, null, 2) + '\n');
        console.log(`Rejected: ${id} — ${opts.reason}`);
      } catch {
        console.error(`Inbox item not found: ${id}`);
        process.exit(1);
      }
    });

  return cmd;
}
