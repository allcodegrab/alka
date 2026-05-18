import { describe, it, expect } from 'vitest';
import { operationsCommand } from './operations.js';

describe('operationsCommand', () => {
  const cmd = operationsCommand();

  it('should have the correct command name', () => {
    expect(cmd.name()).toBe('ops');
  });

  it('should have a description', () => {
    expect(cmd.description()).toBeTruthy();
  });

  it('should have all expected subcommands', () => {
    const subcommandNames = cmd.commands.map((c) => c.name());
    expect(subcommandNames).toContain('payroll');
    expect(subcommandNames).toContain('schedule');
    expect(subcommandNames).toContain('dream');
    expect(subcommandNames).toContain('meditate');
    expect(subcommandNames).toContain('sme');
  });

  it('should have learning and healing-log subcommands', () => {
    const subcommandNames = cmd.commands.map((c) => c.name());
    expect(subcommandNames).toContain('learning');
    expect(subcommandNames).toContain('healing-log');
  });

  it('should have 7 subcommands total', () => {
    expect(cmd.commands).toHaveLength(7);
  });
});
