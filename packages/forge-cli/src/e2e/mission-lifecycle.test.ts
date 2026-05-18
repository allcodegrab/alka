import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createMission,
  updateWhiteboard,
  readWhiteboard,
  appendDecision,
  closeMission,
  listMissions,
  createInboxItem,
  writeInboxItem,
  approveInboxItem,
} from '@forge/team-mode';
import type { DecisionEntry, InboxItemId } from '@forge/protocol';

describe('mission lifecycle (e2e)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mission-e2e-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should create a mission with all expected files and directories', async () => {
    const result = await createMission(tmpDir, 'Auth Flow', 'standard', 'Implement OAuth2 flow');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const dir = join(tmpDir, '.claude', 'missions', result.value);

    // Verify all files exist
    await expect(access(join(dir, 'context.md'))).resolves.toBeUndefined();
    await expect(access(join(dir, 'whiteboard.md'))).resolves.toBeUndefined();
    await expect(access(join(dir, 'dashboard.json'))).resolves.toBeUndefined();
    await expect(access(join(dir, 'status.md'))).resolves.toBeUndefined();
    await expect(access(join(dir, 'decisions.md'))).resolves.toBeUndefined();
    await expect(access(join(dir, 'artifacts'))).resolves.toBeUndefined();
  });

  it('should update and read whiteboard with role section preserved', async () => {
    const createResult = await createMission(tmpDir, 'Whiteboard Test', 'standard', 'test');
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const missionId = createResult.value;

    await updateWhiteboard(tmpDir, missionId, 'architect', 'Architecture plan here');
    await updateWhiteboard(tmpDir, missionId, 'impl-a', 'Implementation notes');

    const readResult = await readWhiteboard(tmpDir, missionId);
    expect(readResult.ok).toBe(true);
    if (!readResult.ok) return;

    expect(readResult.value).toContain('## @architect');
    expect(readResult.value).toContain('Architecture plan here');
    expect(readResult.value).toContain('## @impl-a');
    expect(readResult.value).toContain('Implementation notes');
  });

  it('should append decision to mission decisions.md', async () => {
    const createResult = await createMission(tmpDir, 'Decision Test', 'standard', 'test');
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const missionId = createResult.value;
    const entry: DecisionEntry = {
      id: 'DEC-001',
      timestamp: new Date().toISOString(),
      role: 'architect',
      type: 'architecture',
      summary: 'Use REST over GraphQL',
      why: 'Simpler for our use case',
      status: 'active',
      scope: 'mission',
    };

    const appendResult = await appendDecision(tmpDir, missionId, entry);
    expect(appendResult.ok).toBe(true);

    const decisionsPath = join(tmpDir, '.claude', 'missions', missionId, 'decisions.md');
    const content = await readFile(decisionsPath, 'utf-8');
    expect(content).toContain('DEC-001');
    expect(content).toContain('Use REST over GraphQL');
  });

  it('should merge decisions to project memory on close', async () => {
    const createResult = await createMission(tmpDir, 'Close Test', 'standard', 'test');
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const missionId = createResult.value;
    const entry: DecisionEntry = {
      id: 'DEC-002',
      timestamp: new Date().toISOString(),
      role: 'architect',
      type: 'convention',
      summary: 'Use kebab-case for files',
      why: 'Consistency',
      status: 'active',
      scope: 'project',
    };

    await appendDecision(tmpDir, missionId, entry);
    const closeResult = await closeMission(tmpDir, missionId);
    expect(closeResult.ok).toBe(true);

    const projectDecisions = await readFile(
      join(tmpDir, '.claude', 'memory', 'decisions.md'),
      'utf-8',
    );
    expect(projectDecisions).toContain('DEC-002');
    expect(projectDecisions).toContain('Use kebab-case for files');
  });

  it('should list missions with closed mission showing completed status', async () => {
    const r1 = await createMission(tmpDir, 'List Test', 'standard', 'test');
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    await closeMission(tmpDir, r1.value);

    const listResult = await listMissions(tmpDir);
    expect(listResult.ok).toBe(true);
    if (!listResult.ok) return;

    const mission = listResult.value.find((m) => m.id === r1.value);
    expect(mission).toBeDefined();
    expect(mission!.status).toBe('completed');
  });

  it('should create mission with 24h mode in dashboard.json', async () => {
    const result = await createMission(tmpDir, 'Urgent Fix', '24h', 'Critical bug fix');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const dashPath = join(tmpDir, '.claude', 'missions', result.value, 'dashboard.json');
    const dashboard = JSON.parse(await readFile(dashPath, 'utf-8'));
    expect(dashboard.mode).toBe('24h');
  });

  it('should create inbox item, approve, and record decision', async () => {
    const item = createInboxItem({
      missionId: 'test-mission',
      severity: 'high',
      type: 'architecture_change',
      proposer: 'architect',
      summary: 'Switch to PostgreSQL',
      what: 'Replace SQLite with PostgreSQL',
      why: 'Better scalability',
      recommendation: 'Approve',
      evidence: ['benchmark.md'],
      decisionOptions: [
        { id: 'approve', label: 'Approve', consequence: 'Migration needed' },
        { id: 'reject', label: 'Reject', consequence: 'Stay with SQLite' },
      ],
    });

    const writeResult = await writeInboxItem(tmpDir, item);
    expect(writeResult.ok).toBe(true);

    const approveResult = await approveInboxItem(tmpDir, item.id);
    expect(approveResult.ok).toBe(true);
    if (!approveResult.ok) return;
    expect(approveResult.value.status).toBe('approved');
    expect(approveResult.value.decision).toBe('approved');
  });

  it('should list multiple missions sorted newest first', async () => {
    // Create first mission
    const r1 = await createMission(tmpDir, 'First Mission', 'standard', 'first');
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    // Manually create a second mission with a later date by writing directly
    const laterDir = join(tmpDir, '.claude', 'missions', '2099-12-31-later-mission');
    await mkdir(laterDir, { recursive: true });
    await mkdir(join(laterDir, 'artifacts'), { recursive: true });
    await writeFile(
      join(laterDir, 'dashboard.json'),
      JSON.stringify({
        missionId: '2099-12-31-later-mission',
        name: 'Later Mission',
        mode: 'standard',
        status: 'active',
        startedAt: '2099-12-31T00:00:00.000Z',
        roles: [],
        totalCostUsd: 0,
        slicesTotal: 0,
        slicesCompleted: 0,
      }),
      'utf-8',
    );

    const listResult = await listMissions(tmpDir);
    expect(listResult.ok).toBe(true);
    if (!listResult.ok) return;

    expect(listResult.value.length).toBeGreaterThanOrEqual(2);
    // Newest first
    expect(listResult.value[0]!.id).toBe('2099-12-31-later-mission');
  });
});
