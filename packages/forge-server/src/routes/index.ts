import type { FastifyInstance } from 'fastify';
import { loadDashboardState, watchDashboard } from '@forge/dashboard';
import {
  createMission,
  listMissions,
  closeMission,
  parseOrgChart,
  generateAgentFiles,
  detectDrift,
  listInboxItems,
  approveInboxItem,
  rejectInboxItem,
  readMemoryFiles,
} from '@forge/team-mode';
import { ensureIndex, clearCache, query } from '@forge/knowledge';
import { join } from 'node:path';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  const root = process.cwd();
  const orgPath = join(root, '.forge', 'org-chart.yaml');

  // === STATE ===
  app.get('/api/state', async () => loadDashboardState(root));

  // === MISSIONS ===
  app.get('/api/missions', async (_req, reply) => {
    const r = await listMissions(root);
    if (!r.ok) return reply.status(500).send({ error: r.error.message });
    return r.value;
  });

  app.post('/api/missions', async (req, reply) => {
    const b = req.body as Record<string, unknown>;
    const name = b['name'] as string | undefined;
    const mode = (b['mode'] as string) === '24h' ? ('24h' as const) : ('standard' as const);
    const brief = (b['brief'] as string) ?? 'Started from dashboard.';
    if (!name) return reply.status(400).send({ error: 'name is required' });
    const r = await createMission(root, name, mode, brief);
    if (!r.ok) return reply.status(500).send({ error: r.error.message });
    return { id: r.value };
  });

  app.post('/api/missions/:id/close', async (req, reply) => {
    const id = (req.params as Record<string, string>)['id'] ?? '';
    const r = await closeMission(root, id);
    if (!r.ok) return reply.status(500).send({ error: r.error.message });
    return { ok: true };
  });

  // === ORG CHART ===
  app.get('/api/org-chart', async (_req, reply) => {
    const r = await parseOrgChart(orgPath);
    if (!r.ok) return reply.status(500).send({ error: r.error.message });
    return r.value;
  });

  app.post('/api/org-chart/sync', async (_req, reply) => {
    const p = await parseOrgChart(orgPath);
    if (!p.ok) return reply.status(500).send({ error: p.error.message });
    const g = await generateAgentFiles(root, p.value);
    if (!g.ok) return reply.status(500).send({ error: g.error.message });
    return { files: g.value };
  });

  app.get('/api/org-chart/drift', async (_req, reply) => {
    const p = await parseOrgChart(orgPath);
    if (!p.ok) return reply.status(500).send({ error: p.error.message });
    const d = await detectDrift(root, p.value);
    if (!d.ok) return reply.status(500).send({ error: d.error.message });
    return d.value;
  });

  // === INBOX ===
  app.get('/api/inbox', async (_req, reply) => {
    const r = await listInboxItems(root);
    if (!r.ok) return reply.status(500).send({ error: r.error.message });
    return r.value;
  });

  app.post('/api/inbox/:id/approve', async (req, reply) => {
    const id = (req.params as Record<string, string>)['id'] ?? '';
    const b = req.body as Record<string, unknown> | undefined;
    const reason = (b?.['reason'] as string) ?? 'Approved from dashboard';
    const r = await approveInboxItem(root, id, reason);
    if (!r.ok) return reply.status(500).send({ error: r.error.message });
    return { ok: true };
  });

  app.post('/api/inbox/:id/reject', async (req, reply) => {
    const id = (req.params as Record<string, string>)['id'] ?? '';
    const b = req.body as Record<string, unknown> | undefined;
    const reason = (b?.['reason'] as string) ?? 'Rejected from dashboard';
    const r = await rejectInboxItem(root, id, reason);
    if (!r.ok) return reply.status(500).send({ error: r.error.message });
    return { ok: true };
  });

  // === KNOWLEDGE ===
  app.get('/api/knowledge/stats', async () => {
    try {
      const { graph, bm25, tfidf } = await ensureIndex(root);
      return {
        nodes: graph.nodeCount,
        edges: graph.edgeCount,
        documents: bm25.documentCount,
        vocabulary: tfidf.vocabularySize,
      };
    } catch {
      return { nodes: 0, edges: 0, documents: 0, vocabulary: 0 };
    }
  });

  app.post('/api/knowledge/build', async () => {
    clearCache();
    await ensureIndex(root);
    return { ok: true };
  });

  app.get('/api/knowledge/query', async (req) => {
    const q = (req.query as Record<string, string>)['q'] ?? '';
    if (!q) return { chunks: [], graphNodes: [], totalTokens: 0 };
    return query({ projectRoot: root, intent: q, k: 10 });
  });

  // === DECISIONS ===
  app.get('/api/decisions', async () => {
    const r = await readMemoryFiles(root);
    if (!r.ok) return { decisions: [] };
    return { journal: r.value.journal, conventions: r.value.conventions };
  });

  // === SCHEDULE ===
  app.get('/api/schedule', async () => {
    return { withinHours: true, timezone: 'local' };
  });

  // === PAYROLL ===
  app.get('/api/payroll', async () => {
    return { roles: [] };
  });

  // === DREAM ===
  app.post('/api/dream', async () => {
    return { durationMs: 0, message: 'Dream mode stub' };
  });

  // === SSE EVENTS ===
  app.get('/api/events', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    reply.raw.write('\n');

    const cleanup = watchDashboard(root, (state) => {
      reply.raw.write(`data: ${JSON.stringify(state)}\n\n`);
    });

    req.raw.on('close', cleanup);
  });
}
