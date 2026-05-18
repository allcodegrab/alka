import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { KnowledgeGraph } from './graph.js';
import type { GraphNode, GraphEdge } from './types.js';

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'out',
  'out-build',
  '.turbo',
  'coverage',
  'codeoss',
]);
const INDEXED_EXTENSIONS = new Set(['.ts', '.js', '.json', '.yaml', '.yml', '.md']);

function languageFromExtension(ext: string): string {
  switch (ext) {
    case '.ts':
      return 'typescript';
    case '.js':
      return 'javascript';
    case '.json':
      return 'json';
    case '.yaml':
    case '.yml':
      return 'yaml';
    case '.md':
      return 'markdown';
    default:
      return 'unknown';
  }
}

async function walkFiles(dir: string, projectRoot: string): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          await walk(fullPath);
        }
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = extname(entry.name);
      if (!INDEXED_EXTENSIONS.has(ext)) continue;

      let fileSize = 0;
      try {
        const fileStat = await stat(fullPath);
        fileSize = fileStat.size;
      } catch {
        // Skip files we can't stat
        continue;
      }

      const relPath = relative(projectRoot, fullPath);
      nodes.push({
        id: `file:${relPath}`,
        type: 'file',
        data: {
          path: relPath,
          language: languageFromExtension(ext),
          size: fileSize,
        },
      });
    }
  }

  await walk(dir);
  return nodes;
}

interface ParsedDecision {
  id: string;
  role: string;
  type: string;
  summary: string;
}

function parseDecisions(content: string): ParsedDecision[] {
  const decisions: ParsedDecision[] = [];
  const blocks = content.split(/(?=^### )/m);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed.startsWith('### ')) continue;

    const headerMatch = trimmed.match(/^### (\S+)/);
    if (!headerMatch) continue;

    const id = headerMatch[1]!;
    const roleMatch = trimmed.match(/\*\*Role:\*\*\s*(.+)/);
    const typeMatch = trimmed.match(/\*\*Type:\*\*\s*(.+)/);
    const summaryMatch = trimmed.match(/\*\*Summary:\*\*\s*(.+)/);

    decisions.push({
      id,
      role: roleMatch?.[1]?.trim() ?? '',
      type: typeMatch?.[1]?.trim() ?? '',
      summary: summaryMatch?.[1]?.trim() ?? '',
    });
  }

  return decisions;
}

function parseConventions(content: string): string[] {
  return content
    .split('---')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface DashboardData {
  name?: string;
  status?: string;
  mode?: string;
}

async function readJsonSafe(path: string): Promise<DashboardData | null> {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as DashboardData;
  } catch {
    return null;
  }
}

async function readTextSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

export async function buildGraph(projectRoot: string): Promise<KnowledgeGraph> {
  const graph = new KnowledgeGraph();

  // 1. Walk filesystem and create File nodes
  const fileNodes = await walkFiles(projectRoot, projectRoot);
  for (const node of fileNodes) {
    graph.addNode(node);
  }

  // 2. Parse decisions.md
  const decisionsContent = await readTextSafe(
    join(projectRoot, '.claude', 'memory', 'decisions.md'),
  );
  if (decisionsContent) {
    const decisions = parseDecisions(decisionsContent);
    for (const dec of decisions) {
      const node: GraphNode = {
        id: `decision:${dec.id}`,
        type: 'decision',
        data: {
          id: dec.id,
          role: dec.role,
          type: dec.type,
          summary: dec.summary,
        },
      };
      graph.addNode(node);
    }
  }

  // 3. Parse conventions.md
  const conventionsContent = await readTextSafe(
    join(projectRoot, '.claude', 'memory', 'conventions.md'),
  );
  if (conventionsContent) {
    const conventions = parseConventions(conventionsContent);
    for (let i = 0; i < conventions.length; i++) {
      const node: GraphNode = {
        id: `convention:${i}`,
        type: 'convention',
        data: {
          content: conventions[i],
        },
      };
      graph.addNode(node);
    }
  }

  // 4. Scan missions
  const missionsDir = join(projectRoot, '.claude', 'missions');
  let missionEntries: import('node:fs').Dirent[] = [];
  try {
    missionEntries = await readdir(missionsDir, { withFileTypes: true });
  } catch {
    missionEntries = [];
  }

  for (const entry of missionEntries) {
    if (!entry.isDirectory()) continue;

    const dashboardPath = join(missionsDir, entry.name, 'dashboard.json');
    const dashboard = await readJsonSafe(dashboardPath);
    if (!dashboard) continue;

    const missionNode: GraphNode = {
      id: `mission:${entry.name}`,
      type: 'mission',
      data: {
        name: dashboard.name ?? entry.name,
        status: dashboard.status ?? 'unknown',
        mode: dashboard.mode ?? 'standard',
      },
    };
    graph.addNode(missionNode);

    // Connect mission to artifact files
    const artifactsDir = join(missionsDir, entry.name, 'artifacts');
    let artifactEntries;
    try {
      artifactEntries = await readdir(artifactsDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const artEntry of artifactEntries) {
      if (!artEntry.isDirectory()) continue;

      const roleArtifactsDir = join(artifactsDir, artEntry.name);
      let roleFiles;
      try {
        roleFiles = await readdir(roleArtifactsDir);
      } catch {
        continue;
      }

      for (const fileName of roleFiles) {
        const relPath = relative(projectRoot, join(roleArtifactsDir, fileName));
        const fileNodeId = `file:${relPath}`;
        if (graph.hasNode(fileNodeId)) {
          const edge: GraphEdge = {
            from: missionNode.id,
            to: fileNodeId,
            type: 'produced',
          };
          graph.addEdge(edge);
        }
      }
    }
  }

  // 5. Connect file nodes to decisions/conventions that reference their paths
  const allFileNodes = graph.query({ type: 'file' });
  const allDecisionNodes = graph.query({ type: 'decision' });
  const allConventionNodes = graph.query({ type: 'convention' });

  for (const fileNode of allFileNodes) {
    const filePath = fileNode.data['path'] as string;

    for (const decNode of allDecisionNodes) {
      const summary = (decNode.data['summary'] as string) ?? '';
      if (summary.includes(filePath)) {
        const edge: GraphEdge = {
          from: fileNode.id,
          to: decNode.id,
          type: 'contains',
        };
        graph.addEdge(edge);
      }
    }

    for (const convNode of allConventionNodes) {
      const content = (convNode.data['content'] as string) ?? '';
      if (content.includes(filePath)) {
        const edge: GraphEdge = {
          from: fileNode.id,
          to: convNode.id,
          type: 'contains',
        };
        graph.addEdge(edge);
      }
    }
  }

  return graph;
}
