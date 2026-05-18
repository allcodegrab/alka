import { readFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface DashboardRole {
  roleId: string;
  status: string;
  currentAction?: string;
  progress?: number;
  costUsd: number;
}

export interface DashboardInboxItem {
  id: string;
  severity: string;
  type: string;
  proposer: string;
  summary: string;
  status: string;
}

export interface DashboardDecision {
  id: string;
  timestamp: string;
  role: string;
  summary: string;
}

export interface DashboardState {
  project: string;
  missionId: string | null;
  missionName: string | null;
  mode: string | null;
  status: string | null;
  clock: string | null;
  totalCostUsd: number;
  slicesTotal: number;
  slicesCompleted: number;
  roles: DashboardRole[];
  inbox: DashboardInboxItem[];
  decisions: DashboardDecision[];
}

export async function loadDashboardState(projectRoot: string): Promise<DashboardState> {
  const state: DashboardState = {
    project: projectRoot.split('/').pop() ?? 'unknown',
    missionId: null,
    missionName: null,
    mode: null,
    status: null,
    clock: null,
    totalCostUsd: 0,
    slicesTotal: 0,
    slicesCompleted: 0,
    roles: [],
    inbox: [],
    decisions: [],
  };

  // Find most recent active mission
  const missionsDir = join(projectRoot, '.claude', 'missions');
  try {
    const entries = await readdir(missionsDir, { withFileTypes: true });
    const missionDirs = entries
      .filter((e) => e.isDirectory())
      .sort((a, b) => b.name.localeCompare(a.name));

    for (const dir of missionDirs) {
      const dashPath = join(missionsDir, dir.name, 'dashboard.json');
      try {
        const raw = await readFile(dashPath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (data['status'] === 'active' || state.missionId === null) {
          state.missionId = dir.name;
          state.missionName = (data['name'] as string) ?? dir.name;
          state.mode = (data['mode'] as string) ?? 'standard';
          state.status = (data['status'] as string) ?? 'unknown';
          state.totalCostUsd = (data['totalCostUsd'] as number) ?? 0;
          state.slicesTotal = (data['slicesTotal'] as number) ?? 0;
          state.slicesCompleted = (data['slicesCompleted'] as number) ?? 0;
          state.roles = (data['roles'] as DashboardRole[]) ?? [];
          if (data['status'] === 'active') break;
        }
      } catch {
        // skip unreadable dashboards
      }
    }
  } catch {
    // no missions directory
  }

  // Load inbox items
  const inboxDir = join(projectRoot, '.forge', 'inbox');
  try {
    await mkdir(inboxDir, { recursive: true });
    const files = await readdir(inboxDir);
    for (const f of files.filter((f) => f.endsWith('.json'))) {
      try {
        const raw = await readFile(join(inboxDir, f), 'utf-8');
        const item = JSON.parse(raw) as DashboardInboxItem;
        state.inbox.push(item);
      } catch {
        // skip bad files
      }
    }
    state.inbox.sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sevOrder[a.severity] ?? 99) - (sevOrder[b.severity] ?? 99);
    });
  } catch {
    // no inbox
  }

  return state;
}
