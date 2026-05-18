#!/usr/bin/env node
import { Command } from 'commander';
import { missionCommand } from './commands/mission.js';
import { orgChartCommand } from './commands/org-chart.js';
import { inboxCommand } from './commands/inbox.js';
import { knowledgeCommand } from './commands/knowledge.js';

const program = new Command();

program.name('forge').description('Forge — AI-native code editor CLI').version('0.0.1');

program.addCommand(missionCommand());
program.addCommand(orgChartCommand());
program.addCommand(inboxCommand());
program.addCommand(knowledgeCommand());

program.parse();
