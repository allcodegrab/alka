# Forge — AI-Native Code Editor

A private, single-user, multi-agent AI engineering organization built on Code-OSS. Forge operates as a hierarchical team of AI agents coordinated by a VP Engineering orchestrator, with you (the CTO) at the top.

**Not for public release.** Built as a 10x force-multiplier for one developer.

---

## What This Is

- A **Code-OSS fork** rebranded as Forge with the Anvil design system (Industrial Precision aesthetic, Forge Amber `#FF5C1F` accent)
- A **15-role AI engineering team** defined as configuration-as-code in `.forge/org-chart.yaml`
- A **mission-based workflow** — idea to shipped software with research, planning, implementation, verification, and release phases
- A **24-Hour Sprint Mode** with phase budgets, scope cuts, and real-time clock
- A **knowledge system** with in-memory graph, BM25 search, and TF-IDF retrieval
- A **CLI** (`forge`) for managing missions, team, inbox, knowledge, and operations
- **Integrations** with GitHub, JIRA, and Gemini (cross-LLM PR review)

---

## Prerequisites

- **Node.js** >= 20.0.0 (recommended: 22.x via nvm)
- **pnpm** >= 10.x (`npm install -g pnpm`)
- **claude** CLI (Claude Code) — for agent spawning
- **gh** CLI (GitHub CLI) — for GitHub integration
- **Git** — for worktree isolation

Optional:
- **GEMINI_API_KEY** env var — for Gemini PR review
- **JIRA_BASE_URL**, **JIRA_EMAIL**, **JIRA_API_TOKEN**, **JIRA_PROJECT_KEY** — for JIRA integration

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/allcodegrab/alka.git
cd alka
pnpm install
pnpm build
```

### 2. Verify Everything Works

```bash
pnpm test          # 454 tests across 9 packages
pnpm typecheck     # TypeScript strict mode verification
pnpm format-check  # Prettier formatting check
```

### 3. Set Up the CLI

```bash
# Option A: Create a shell alias
alias forge="node $(pwd)/packages/forge-cli/dist/main.js"

# Option B: Link globally
cd packages/forge-cli && pnpm link --global && cd ../..

# Verify
forge --version
forge --help
```

---

## CLI Reference

### Team Management

```bash
# List all roles in the org chart
forge org-chart list

# Generate .claude/agents/*.md from .forge/org-chart.yaml
forge org-chart sync

# Check for drift between YAML and agent files
forge org-chart verify
```

### Missions

```bash
# Start a standard mission
forge mission start --name "add-user-endpoint"

# Start a 24-hour sprint
forge mission start --name "mvp-dashboard" --mode 24h

# With a custom brief
forge mission start --name "fix-auth-bug" --brief "Fix the JWT token expiry issue in /auth/login"

# List all missions
forge mission list

# Show current mission status
forge mission status
forge mission status --id 2026-05-19-add-user-endpoint

# Close a mission
forge mission close --id 2026-05-19-add-user-endpoint
```

### CTO Inbox

```bash
# List pending approval items
forge inbox list

# List all items (including decided)
forge inbox list --all

# Approve an item
forge inbox approve cto-inbox-2026-05-19-abc

# Reject with reason
forge inbox reject cto-inbox-2026-05-19-abc --reason "use existing library instead"
```

### Knowledge Graph

```bash
# Build the knowledge index (graph + BM25 + TF-IDF)
forge knowledge build

# Show index statistics
forge knowledge stats

# Search the codebase
forge knowledge query "where is SkillLoader used"
forge knowledge query "authentication flow" -k 5

# Clear cached index
forge knowledge clear
```

### Operations

```bash
# Payroll report
forge ops payroll
forge ops payroll --month 2026-05

# Work schedule status
forge ops schedule

# Run dream cycle manually (off-hours batch processing)
forge ops dream

# Trigger meditation for a completed mission
forge ops meditate 2026-05-19-add-user-endpoint

# Consult a subject matter expert
forge ops sme java-spring "How does Spring Boot handle @Transactional propagation?"
forge ops sme typescript-frontend "What's the React 19 use() hook pattern?"

# View learning proposals
forge ops learning

# View self-healing event log
forge ops healing-log
```

---

## Running the Editor

The Forge editor is a Code-OSS fork with the Anvil Dark theme applied.

```bash
cd codeoss
npm install          # First time only (~5 min)
npm run compile      # Compile (~2 min)
./scripts/code.sh    # Launch on macOS
```

The editor opens as **"Forge"** with:
- Anvil Dark theme (deep neutral surfaces, Forge Amber accent)
- Title bar reads "Forge"
- Data stored in `~/.forge-editor/`

---

## Project Structure

```
alka/
├── packages/                    # Forge TypeScript packages
│   ├── forge-protocol/          # Shared types (zod schemas, Result<T,E>)
│   ├── agent-runtime/           # Agent spawn via claude CLI
│   ├── skill-loader/            # Load & inject SKILL.md files
│   ├── team-mode/               # Core engine (23 modules)
│   │   ├── mission/             # Mission directory lifecycle
│   │   ├── org-chart/           # YAML → agent .md generation
│   │   ├── inbox/               # CTO Inbox (file-based)
│   │   ├── ledger/              # Decision ledger (append-only)
│   │   ├── memory/              # Project memory (journal, conventions)
│   │   ├── verification/        # Verifier fan-out + remediation
│   │   ├── orchestrator/        # Parallel execution + decompose
│   │   ├── standup/             # Rate-limited status emission
│   │   ├── team-mods/           # Mid-mission team modifications
│   │   ├── buddy/               # Pre-flight intake + post-loop debrief
│   │   ├── sprint/              # 24-hour clock + scope cuts
│   │   ├── integrations/        # GitHub, JIRA, Gemini PR review
│   │   ├── payroll/             # Cost tracking + monthly reports
│   │   ├── schedule/            # Business hours + role lifecycle
│   │   ├── self-healing/        # 8 failure mode detectors + recovery
│   │   ├── reverification/      # Regression detection
│   │   ├── notifications/       # Notion + Slack dispatch
│   │   ├── dream/               # Off-hours batch processing
│   │   ├── learning/            # Continuous learning crawler
│   │   ├── meditation/          # Post-mission structured reflection
│   │   └── sme/                 # Subject matter expert network
│   ├── knowledge/               # Knowledge system
│   │   ├── graph/               # In-memory entity-relationship graph
│   │   ├── search/              # BM25 via lunr.js
│   │   ├── embeddings/          # TF-IDF vectorizer (no external API)
│   │   └── retrieval/           # Hybrid pipeline + diversity filter
│   ├── llm-router/              # Multi-LLM routing (Anthropic + Gemini)
│   ├── anvil/                   # Design tokens (Dark/Light/High-Contrast)
│   ├── dashboard/               # Dashboard data layer + webview HTML
│   └── forge-cli/               # The `forge` command
├── codeoss/                     # Code-OSS v1.121.0 fork (Forge-branded)
├── .forge/                      # Project configuration
│   ├── org-chart.yaml           # Team composition (15 roles + policies)
│   ├── payroll.yaml             # Monthly budgets per role
│   ├── schedule.yaml            # Business hours + dream mode window
│   └── inbox/                   # CTO inbox items (auto-generated)
├── .claude/                     # Claude Code workspace
│   ├── skills/                  # 31 engineering-excellence skills
│   ├── agents/                  # Generated agent .md files
│   ├── memory/                  # Project memory (journal, conventions)
│   └── missions/                # Mission directories (transient)
├── engineering-context.md       # Project conventions (900+ lines)
├── IMPLEMENTATION_PLAN.md       # Phased build plan
├── FORGE_TEAM_MODE.md           # Team mode design (1,480 lines)
├── FORGE_TEAM_OPERATIONS.md     # Operations design (900+ lines)
└── ANVIL_DESIGN_SYSTEM.md       # Visual design spec (805 lines)
```

---

## Configuration

### `.forge/org-chart.yaml` — Team Composition

```yaml
version: 1
name: Forge In-House Team
cto: shashank

roles:
  - id: vp-engineering
    title: VP Engineering
    tier: leadership
    model: claude-opus-4-7
    tools: [Read, Glob, Task, AskUserQuestion]
    # ... (15 roles total)

policies:
  - id: verifier-must-be-read-only
    appliesTo: ["*-verifier", "pr-reviewer"]
    rule: "disallowedTools: [Edit, Write]"
```

### `.forge/payroll.yaml` — Budget Tracking

```yaml
monthlyTotalCapUsd: 200
alertThresholdsPct: [50, 80, 100]
roles:
  vp-engineering:
    monthlyBudgetUsd: 40
    model: claude-opus-4-7
  impl-a:
    monthlyBudgetUsd: 30
    model: claude-sonnet-4-6
```

### `.forge/schedule.yaml` — Work Hours

```yaml
timezone: America/New_York
businessHours:
  monday: "09:00-22:00"
  saturday: "off"
  sunday: "off"
dreamModeWindow:
  weekday: "02:00-06:00"
  weekend: "anytime"
```

---

## The 15-Role Engineering Team

| Tier | Role | Model | Purpose |
|---|---|---|---|
| Leadership | `@vp-engineering` | Opus | Orchestrator — decomposes, routes, synthesizes. **No edit tools.** |
| Planning | `@architect` | Opus | System design, ADRs, tech choices |
| Planning | `@data-engineer` | Opus | Schema, migrations, query plans |
| Planning | `@researcher` | Sonnet | Deep research before planning |
| Build | `@impl-a` through `@impl-d` | Sonnet | Implementation in worktree-isolated branches |
| Build | `@stylist` | Sonnet | Frontend/UI specialist |
| Verify | `@tests-verifier` | Sonnet | Test coverage + quality review |
| Verify | `@security-verifier` | Sonnet | OWASP-class security audit |
| Verify | `@performance-verifier` | Sonnet | N+1, hot path, allocation review |
| Verify | `@reliability-verifier` | Sonnet | Error handling, retry, idempotency |
| Release | `@release-manager` | Sonnet | Version bump, changelog, deploy |
| Release | `@docs-author` | Sonnet | Documentation updates |
| Verify | `@pr-reviewer` | Gemini 2.5 Pro | Cross-LLM PR review |

---

## Key Design Decisions

- **No continuous AI critique** — buddy mode fires twice (intake + debrief), never mid-loop. Quality comes from ground-truth gates (tests, lint, types), not AI watching AI.
- **Async file-based coordination** — agents read/write to mission directories, no synchronous RPC. Prevents cascade timeouts.
- **Orchestrator has no edit tools** — structurally enforced via tool allowlist. It delegates; specialists execute.
- **Cross-LLM PR review** — `@pr-reviewer` uses Gemini (different lineage = different blind spots). Structural, not optional.
- **No external embedding APIs** — TF-IDF vectorizer is pure TypeScript, zero cost. Swap to Ollama + BGE-M3 for neural embeddings when needed.
- **Self-healing addresses infrastructure, not logic** — 8 failure mode detectors with max 3 retries, then CTO escalation. Never auto-fixes code bugs.

---

## Development

### Build Commands

```bash
pnpm install         # Install all dependencies
pnpm build           # Build all packages (via Turborepo)
pnpm test            # Run all tests (454 tests)
pnpm typecheck       # TypeScript strict verification
pnpm format          # Auto-format with Prettier
pnpm format-check    # Check formatting without modifying
pnpm clean           # Clean all build outputs
```

### Adding a New Package

```bash
mkdir packages/my-package
# Create package.json, tsconfig.json (extends ../../tsconfig.base.json), src/index.ts
pnpm install
```

### Tech Stack

| Component | Technology |
|---|---|
| Language | TypeScript 5.8+ (strict, ESM) |
| Runtime | Node.js 20+ |
| Package manager | pnpm 10+ with workspaces |
| Build orchestrator | Turborepo |
| Test framework | Vitest |
| Linter | ESLint with @typescript-eslint/strict |
| Formatter | Prettier |
| Validation | Zod |
| Logging | Pino |
| CLI | Commander |
| BM25 search | lunr.js |
| Editor | Code-OSS v1.121.0 fork |

---

## License

MIT (Code-OSS base). Forge-specific code is private/proprietary.
