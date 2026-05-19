import Fastify from 'fastify';
import cors from '@fastify/cors';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { registerRoutes } from './routes/index.js';

const PORT = parseInt(process.env['PORT'] ?? '3141', 10);

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });

// Serve dashboard HTML
app.get('/', async (_req, reply) => {
  const htmlPath = join(import.meta.dirname, 'public', 'index.html');
  const html = await readFile(htmlPath, 'utf-8');
  return reply.type('text/html').send(html);
});

// Register all API routes
await app.register(registerRoutes);

// Start server
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`\n  Forge Dashboard running at ${address}\n`);
});

export { app };
