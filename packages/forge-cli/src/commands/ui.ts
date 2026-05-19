import { Command } from 'commander';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

export function uiCommand(): Command {
  const cmd = new Command('ui').description('Launch the Forge Dashboard in your browser');

  cmd
    .option('-p, --port <port>', 'Port number', '3141')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (opts: { port: string; open: boolean }) => {
      const port = parseInt(opts.port, 10);
      const projectRoot = resolve(process.cwd());

      console.log(`Starting Forge Dashboard at http://localhost:${port}`);
      console.log(`Project: ${projectRoot}`);
      console.log('');

      // Start the server
      const serverPath = resolve(
        import.meta.dirname,
        '..',
        '..',
        '..',
        'forge-server',
        'dist',
        'server.js',
      );

      const child = spawn('node', [serverPath], {
        cwd: projectRoot,
        env: { ...process.env, PORT: String(port), FORGE_PROJECT_ROOT: projectRoot },
        stdio: 'inherit',
      });

      // Open browser after a short delay
      if (opts.open) {
        setTimeout(() => {
          const url = `http://localhost:${port}`;
          const openCmd =
            process.platform === 'darwin'
              ? 'open'
              : process.platform === 'win32'
                ? 'start'
                : 'xdg-open';
          spawn(openCmd, [url], { stdio: 'ignore', detached: true }).unref();
        }, 1000);
      }

      // Handle shutdown
      process.on('SIGINT', () => {
        child.kill('SIGTERM');
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        child.kill('SIGTERM');
        process.exit(0);
      });
    });

  return cmd;
}
