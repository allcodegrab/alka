#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program.name('forge').description('Forge — AI-native code editor CLI').version('0.0.1');

program.parse();
