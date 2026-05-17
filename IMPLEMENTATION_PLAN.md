# Forge — Enterprise Implementation Plan

> **Date:** 2026-05-17
> **Author:** Engineering Excellence session (AI-assisted)
> **Status:** DRAFT — awaiting CTO review and decision on open questions
>
> **Reading this plan:** Each phase has a goal, a checklist, exit criteria, risks, and estimated effort. Phases are sequential with explicit go/no-go gates. The plan is honest about what's hard, what's risky, and what should be deferred.

---

## Table of Contents

1. [Honest scope assessment](#1-honest-scope-assessment)
2. [Strategic phasing principle](#2-strategic-phasing-principle)
3. [Phase 0 — Skeleton + Standard Mode](#3-phase-0--skeleton--standard-mode)
4. [Phase 1 — Full Team + Verification Fan-Out](#4-phase-1--full-team--verification-fan-out)
5. [Phase 2 — Knowledge Graph + Hybrid Retrieval](#5-phase-2--knowledge-graph--hybrid-retrieval)
6. [Phase 3 — 24-Hour Sprint Mode](#6-phase-3--24-hour-sprint-mode)
7. [Phase 4 — Integrations (GitHub, JIRA, Gemini PR Review)](#7-phase-4--integrations)
8. [Phase 5 — Dashboard + Anvil Design System](#8-phase-5--dashboard--anvil-design-system)
9. [Phase 6 — Dogfood + Stabilize](#9-phase-6--dogfood--stabilize)
10. [Phase 7 — Operations Layer (Phase 2 features)](#10-phase-7--operations-layer)
11. [Phase 8 — Notion, Slack, Dream Mode, SME Network](#11-phase-8--advanced-operations)
12. [Cross-cutting concerns](#12-cross-cutting-concerns)
13. [Risk register](#13-risk-register)
14. [Open decisions for CTO](#14-open-decisions)
15. [What this plan explicitly defers](#15-explicit-deferrals)
16. [Cost model](#16-cost-model)
17. [Success metrics](#17-success-metrics)

---

## 1. Honest Scope Assessment

### What exists today
- **Code-OSS fork** — `codeoss/` directory, v1.121.0, fresh clone (238MB). Full workbench, build system, extensions. Unmodified — needs rebranding and Anvil theme.
- **`forge-mockup.html`** — complete Anvil design system mockup (~1000 lines). All tokens, six-zone shell, AI surface, agent cards, cost meter. Ready to adapt into the editor theme.
- `engineering-context.md` — 900+ lines of project conventions (comprehensive)
- `FORGE_TEAM_MODE.md` — 1,480 lines of Phase 1 design (comprehensive)
- `FORGE_TEAM_OPERATIONS.md` — 900+ lines of Phase 2 design (comprehensive)
- `ANVIL_DESIGN_SYSTEM.md` — 805 lines of design system spec (comprehensive)
- 31 skill SKILL.md files in `.claude/skills/` (content only, no runtime)
- 4 verifier agent files in `.claude/agents/` (markdown definitions)
- 4 research/audit documents in `docs/`
- No Forge-specific implementation code yet. The editor build system (`gulp + esbuild + webpack`) exists via Code-OSS.

### What needs to be built
| Component | Language | Complexity | Serial dependency? |
|---|---|---|---|
| Code-OSS rebranding + Anvil theme | Shell/TS/CSS | MEDIUM | Yes — early (fork exists, needs customization) |
| Monorepo scaffold (pnpm workspaces + Turborepo) | Config | LOW | Yes — early |
| `packages/agent-runtime/` | TypeScript | HIGH | Core |
| `packages/team-mode/` (orchestrator, roles, missions) | TypeScript | HIGH | Core |
| `packages/skill-loader/` | TypeScript | MEDIUM | Core |
| `packages/mcp-broker/` | TypeScript | MEDIUM | Core |
| `packages/permission-system/` | TypeScript | MEDIUM | Core |
| `packages/hooks-engine/` | TypeScript | MEDIUM | Core |
| `packages/capability-graph/` | TypeScript | MEDIUM | Can defer |
| `packages/forge-protocol/` | TypeScript | MEDIUM | Core |
| `packages/llm-router/` | TypeScript | MEDIUM | Phase 4 |
| `packages/anvil/` (design tokens + components) | CSS/TS | MEDIUM | Phase 5 |
| `native/indexer/` | Rust | HIGH | Phase 2 |
| `native/knowledge-graph/` | Rust | HIGH | Phase 2 |
| `native/diff-engine/` | Rust | MEDIUM | Can defer |
| `native/blast-radius/` | Rust | MEDIUM | Can defer |
| Dashboard (Forge view) | TS/CSS | HIGH | Phase 5 |
| CTO Inbox (Forge view) | TS/CSS | MEDIUM | Phase 5 |
| Mission directory runtime | TypeScript | MEDIUM | Phase 0 |
| `forge` CLI | TypeScript | MEDIUM | Phase 0 |
| `gemini-review-mcp` adapter | TypeScript | MEDIUM | Phase 4 |
| `.forge/*.yaml` config runtime | TypeScript | MEDIUM | Phase 0 |
| 12+ agent `.md` files | Markdown | LOW | Phase 0-1 |
| E2E test infrastructure | TypeScript | MEDIUM | Phase 6 |

### Realistic timeline
The original plan says "6 weeks for v1." With the Code-OSS fork already cloned:

- **With full-time AI-assisted development (you + Forge once bootstrapped):** 8-12 weeks for a usable v1
- **Phase 0 (skeleton + editor rebranding + standard mode):** 2-3 weeks
- **The fork risk is eliminated.** Code-OSS v1.121.0 is cloned at `codeoss/`. The build system (gulp + esbuild + webpack) is present. What remains: rebrand `product.json` to Forge, apply Anvil theme tokens from `forge-mockup.html`, add custom webview panels for Dashboard/Mission Control.
- **Rust native modules remain the serial dependency** — defer until after TS-only MVP works.

**Recommendation:** Build directly into the Code-OSS fork from day one. Rebrand and apply Anvil theme in Phase 0. Add Dashboard and Mission Control as Code-OSS webview panels (the extension API supports this well). The `forge-mockup.html` is the pixel-perfect reference for all UI work.

---

## 2. Strategic Phasing Principle

**Vertical slices, not horizontal layers.**

Each phase delivers a working capability you can use for real work. No phase is "build the database layer" or "build all the APIs." Every phase ends with a demo you can run.

**The dogfood loop:** Starting Phase 1, use the system to build the system. This is both a test and an accelerant.

**Go/no-go gates:** Each phase has explicit exit criteria. Do not start the next phase until the current one's exit criteria are met. The temptation to start Phase 2 while Phase 1 is "almost done" is the #1 cause of project death.

---

## 3. Phase 0 — Skeleton + Standard Mode

**Goal:** Run a single mission end-to-end with 3 roles, file-based coordination, and a CLI interface.

**Duration:** 2-3 weeks

### Checklist

#### 0.1 — Editor rebranding + Anvil theme
- [ ] Verify Code-OSS build works: `cd codeoss && yarn && yarn compile` (or equivalent)
- [ ] Rebrand `product.json`: nameShort → "Forge", nameLong → "Forge", applicationName → "forge", dataFolderName → ".forge-editor"
- [ ] Strip Microsoft brand references per MIT license requirements
- [ ] Extract Anvil design tokens from `forge-mockup.html` into a CSS theme file
- [ ] Apply Forge Dark theme: surface colors, border tokens, text tokens, accent (#FF5C1F)
- [ ] Apply Satoshi + Commit Mono fonts (or JetBrains Mono as interim fallback)
- [ ] Verify themed build launches and renders correctly
- [ ] Set up upstream tracking branch for future Code-OSS rebases

#### 0.2 — Monorepo scaffold (alongside codeoss/)
- [ ] Initialize monorepo at project root: `pnpm init`, workspace config, Turborepo
- [ ] Configure workspaces: `codeoss/` (the editor) + `packages/` (Forge packages)
- [ ] Create `tsconfig.base.json` with strict settings per §2
- [ ] Create ESLint flat config per §4
- [ ] Create Prettier config per §2
- [ ] Set up `pnpm check` script (lint + typecheck + format-check)
- [ ] Set up Vitest for new packages
- [ ] Create initial package stubs:
  - `packages/forge-cli/` — the `forge` command
  - `packages/agent-runtime/` — agent spawn, lifecycle, tool routing
  - `packages/team-mode/` — orchestrator, roles, missions
  - `packages/skill-loader/` — load SKILL.md files
  - `packages/forge-protocol/` — shared types, schemas (zod)
- [ ] Create `native/` directory (empty; Rust comes Phase 2)
- [ ] Set up `.forge/config.yaml` parser (zod schema)
- [ ] Set up `.forge/org-chart.yaml` parser (zod schema)
- [ ] Wire `pnpm check` as pre-commit hook

#### 0.2 — Agent runtime (minimal)
- [ ] Implement agent spawn via Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- [ ] Implement tool allowlist enforcement per agent definition
- [ ] Implement `maxTurns` enforcement
- [ ] Implement model selection per agent (Opus/Sonnet/Haiku)
- [ ] Implement worktree isolation for impl-* agents
- [ ] Implement agent lifecycle: spawn → run → complete/fail
- [ ] Implement cost tracking per agent run (tokens in/out/cost)
- [ ] Write tests: agent spawn, tool restriction, maxTurns, cost tracking

#### 0.3 — Skill loader (minimal)
- [ ] Load SKILL.md files from `.claude/skills/`
- [ ] Parse frontmatter (name, description, globs, alwaysApply)
- [ ] Inject skill content into agent system prompt based on `skills:` field
- [ ] Write tests: skill loading, frontmatter parsing, injection

#### 0.4 — Mission directory runtime
- [ ] Create mission directory on mission start: `.claude/missions/<id>/`
- [ ] Generate `context.md` (mission brief) from CTO input
- [ ] Generate `whiteboard.md` with per-role sections
- [ ] Generate `dashboard.json` (live state)
- [ ] Generate `status.md` (human-readable)
- [ ] Implement `decisions.md` append-only write
- [ ] Implement `artifacts/<role>_findings.md` write
- [ ] Implement mission close (merge decisions to top-level, cleanup)
- [ ] Write tests: create, write, close lifecycle

#### 0.5 — Org chart sync
- [ ] Parse `.forge/org-chart.yaml`
- [ ] Generate `.claude/agents/<role>.md` files from YAML
- [ ] Implement `forge org-chart sync` CLI command
- [ ] Implement drift detection (YAML vs .md files)
- [ ] Write tests: parse, generate, drift detection

#### 0.6 — First 3 roles
- [ ] Author `@vp-engineering` agent definition (no Edit/Write tools)
- [ ] Author `@architect` agent definition (read-only)
- [ ] Author `@impl-a` agent definition (worktree-isolated, full edit)
- [ ] Create `.forge/org-chart.yaml` with these 3 roles
- [ ] Run `forge org-chart sync` and verify output

#### 0.7 — Standard Mode loop
- [ ] Implement orchestrator loop:
  1. Read mission brief
  2. Decompose into slices (call @architect if needed)
  3. Assign slices to impl agents
  4. Poll whiteboard every 30s for status/questions
  5. Synthesize status
  6. Handle gate escalations (log to CTO inbox file for now)
- [ ] Implement specialist loop:
  1. Read context.md and whiteboard.md
  2. Execute assigned work
  3. Write artifacts
  4. Update whiteboard
  5. Mark complete
- [ ] Wire async file-based coordination (no sync RPC)
- [ ] Implement `forge mission start --name <name>` CLI
- [ ] Implement `forge mission status` CLI
- [ ] Write tests: orchestrator decomposition, specialist execution, file coordination

#### 0.8 — CTO Inbox (CLI-only, v0)
- [ ] Implement inbox item schema (zod): severity, type, proposer, summary, proposal, evidence, recommendation, decision_options
- [ ] Implement `forge inbox` CLI — list pending items
- [ ] Implement `forge inbox approve <id>` / `forge inbox reject <id> <reason>`
- [ ] Wire gate triggers: dep addition, architecture choice, schema change, budget >80%
- [ ] Persist decisions to `decisions.md`
- [ ] Write tests: item creation, approval, rejection, persistence

#### 0.9 — Decision ledger
- [ ] Implement append-only ledger write (schema per §14)
- [ ] Implement per-mission and project-level ledger files
- [ ] Implement merge on mission close
- [ ] Write tests: append, merge, schema validation

#### 0.10 — Project memory (minimal)
- [ ] Implement read of `.claude/memory/` files at session start
- [ ] Implement write to `journal.md` on mission close
- [ ] Implement write to `conventions.md` on pattern promotion
- [ ] Implement `working.md` scratchpad lifecycle
- [ ] Write tests: read, write, lifecycle

### Exit criteria
- [ ] You can run `forge mission start --name "add-endpoint"` and the system:
  - Creates a mission directory
  - Spawns @vp-engineering (Opus, no Edit tools)
  - @vp-engineering spawns @architect and @impl-a
  - @architect produces an architecture artifact
  - @impl-a produces a code change in a worktree
  - Decisions are logged
  - Mission closes with journal entry
- [ ] `forge inbox` shows a gate item when a dependency is proposed
- [ ] `forge inbox approve <id>` records the decision
- [ ] Cost is tracked and displayed per agent
- [ ] All tests pass: `pnpm test`
- [ ] Lint + typecheck clean: `pnpm check`

### Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Claude Agent SDK API doesn't support all needed features | Medium | High | Read SDK docs thoroughly before starting; identify gaps early; fallback to raw API if needed |
| Worktree isolation fails on macOS | Low | Medium | Test early; fallback to branch-based isolation |
| Skill injection exceeds context window | Medium | Medium | Measure token count per role; trim non-essential skills |

---

## 4. Phase 1 — Full Team + Verification Fan-Out

**Goal:** All 12+ standing roles working. Verifier fan-out produces real findings. Remediation loop works.

**Duration:** 2 weeks

**Depends on:** Phase 0 exit criteria met

### Checklist

#### 1.1 — Remaining role definitions
- [ ] Author `@data-engineer` (read-only, Opus)
- [ ] Author `@researcher` (read-only, Sonnet)
- [ ] Author `@impl-b`, `@impl-c`, `@impl-d` (worktree, Sonnet)
- [ ] Author `@stylist` (worktree, Sonnet)
- [ ] Author `@tests-verifier` (read-only, Sonnet)
- [ ] Author `@security-verifier` (read-only, Sonnet)
- [ ] Author `@performance-verifier` (read-only + Bash, Sonnet)
- [ ] Author `@reliability-verifier` (read-only, Sonnet)
- [ ] Author `@release-manager` (limited write, Sonnet)
- [ ] Author `@docs-author` (write, Sonnet)
- [ ] Author `@pr-reviewer` (read-only, Gemini 2.5 Pro — placeholder until Phase 4)
- [ ] Update `.forge/org-chart.yaml` with all roles
- [ ] Run `forge org-chart sync` and verify all 12+ agent files

#### 1.2 — Verification fan-out
- [ ] Implement orchestrator verification phase:
  - After impl agents complete, spawn verifiers in parallel
  - Each verifier reads the diff and produces structured findings
  - Findings aggregated by orchestrator
- [ ] Implement finding severity levels: info/low/medium/high/critical
- [ ] Implement remediation routing: HIGH findings → back to original impl agent
- [ ] Implement verifier finding storm detection (>5 HIGH on one slice → pause + CTO inbox)
- [ ] Write tests: fan-out, aggregation, remediation routing, finding storm

#### 1.3 — Parallel implementer execution
- [ ] Implement 4-way parallel worktree agent execution
- [ ] Implement slice assignment by orchestrator
- [ ] Implement slice completion tracking in whiteboard.md
- [ ] Implement inter-slice dependency detection (basic: file-level conflict check)
- [ ] Write tests: parallel execution, completion tracking, conflict detection

#### 1.4 — Stand-up skill runtime
- [ ] Implement rate-limited status emission (15-min minimum interval)
- [ ] Implement phase-transition trigger
- [ ] Implement dashboard.json status aggregation
- [ ] Write tests: rate limiting, aggregation

#### 1.5 — Team modifications (runtime)
- [ ] Implement mission-scoped ADD_ROLE, REMOVE_ROLE, PAUSE_ROLE, RESUME_ROLE
- [ ] Implement RECONFIGURE_ROLE (model swap within tier: auto; cross-tier: CTO approval)
- [ ] Implement `team-delta.yaml` per mission
- [ ] Implement budget impact calculation for modifications
- [ ] Write tests: add, remove, pause, resume, reconfigure, budget impact

#### 1.6 — Buddy mode (minimal)
- [ ] Implement Phase A (pre-flight intake) → produces MISSION_BRIEF.md
- [ ] Implement Phase B (post-loop debrief) → produces debrief artifact
- [ ] Implement hard-skip list (trivial prompts, "just do it", continuations)
- [ ] Wire buddy as wrapper around mission lifecycle
- [ ] Write tests: Phase A, Phase B, hard-skip

### Exit criteria
- [ ] A mission spawns 4 implementers in parallel worktrees
- [ ] 3 verifiers (tests, security, reliability) run after implementation
- [ ] A HIGH finding routes back to the original implementer for fix
- [ ] Remediation is re-verified
- [ ] Stand-up status appears in dashboard.json every phase transition
- [ ] Team modification (add/remove role) works mid-mission
- [ ] Buddy Phase A produces a brief; Phase B produces a debrief
- [ ] All tests pass; lint + typecheck clean

### Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 4 parallel agent runs exceed machine resources (RAM, CPU) | Medium | High | Test on target hardware early; implement sequential fallback |
| Worktree conflicts between parallel impl agents | Medium | Medium | Slice assignment must be file-disjoint; detect conflicts early |
| Verifier output quality too low to be useful | Medium | Medium | Tune verifier prompts; compare against manual review |

---

## 5. Phase 2 — Knowledge Graph + Hybrid Retrieval

**Goal:** Every agent retrieves context via `forge.knowledge.query()` backed by BM25 + embeddings + graph traversal.

**Duration:** 3 weeks (Rust work is the long pole)

**Depends on:** Phase 1 exit criteria met

### Checklist

#### 2.1 — Rust scaffold
- [ ] Initialize Cargo workspace under `native/`
- [ ] Set up `napi-rs` for TS↔Rust binding
- [ ] Set up `cargo fmt`, `clippy`, `cargo test` in CI
- [ ] Create crate stubs: `native/knowledge-graph/`, `native/indexer/`
- [ ] Verify napi-rs binding works: hello-world TS→Rust round-trip
- [ ] Write smoke tests

#### 2.2 — Knowledge graph (petgraph)
- [ ] Define node types: File, Symbol, Decision, Ticket, PR, Commit, Convention, Playbook, Mission, Finding
- [ ] Define edge types: contains, defines, references, depends_on, decided_by, supersedes, blocks, produced, cited, found_by
- [ ] Implement in-memory graph (petgraph)
- [ ] Implement cold rebuild from: filesystem walk + `.claude/memory/` files + git log
- [ ] Implement incremental update on file save
- [ ] Implement graph query API: neighbors, shortest path, subgraph extraction
- [ ] Expose to TS via napi-rs
- [ ] Write tests: build, query, incremental update
- [ ] Benchmark: cold rebuild <3s on 100k files

#### 2.3 — BM25 index (tantivy)
- [ ] Integrate tantivy crate
- [ ] Define schema: symbol name, file path, content chunks, qualified names
- [ ] Implement full index build from filesystem walk
- [ ] Implement incremental update on file save
- [ ] Implement search API: exact match + fuzzy
- [ ] Expose to TS via napi-rs
- [ ] Write tests: index, search, incremental update
- [ ] Benchmark: query <1ms p99

#### 2.4 — Embedding pipeline
- [ ] Implement Voyage 3-Large API client (primary)
- [ ] Implement embedding cache (local, per-project)
- [ ] Implement BGE-M3 fallback (Ollama, for offline)
- [ ] Implement batch embedding with debounce (off main thread)
- [ ] Implement vector similarity search (in-memory, brute-force initially; HNSW if needed)
- [ ] Write tests: embed, cache, search, fallback

#### 2.5 — Cross-encoder reranker
- [ ] Implement BGE-Reranker-v2 integration (self-hosted)
- [ ] Implement Cohere Rerank 3 API fallback
- [ ] Write tests: rerank ordering

#### 2.6 — Hybrid retrieval pipeline
- [ ] Wire the full pipeline:
  1. Parse query → intent + symbols
  2. BM25 → top 200-500 candidates
  3. Vector re-rank → top 50
  4. Cross-encoder → top 20
  5. Diversity constraint → top 8-15
  6. Graph expansion → pull connected nodes
  7. Return packed context (<30k tokens)
- [ ] Implement `forge.knowledge.query()` tool for agents
- [ ] Implement retrieval logging to mission whiteboard
- [ ] Write tests: full pipeline, quality spot-checks
- [ ] Benchmark: <300ms p95

#### 2.7 — Tree-sitter integration
- [ ] Integrate tree-sitter for TS, Java, Rust, Python parsing
- [ ] Extract symbol definitions (classes, functions, variables)
- [ ] Extract references (imports, call sites)
- [ ] Feed into knowledge graph as Symbol nodes + reference edges
- [ ] Implement incremental reparse on file save
- [ ] Write tests: parse, extract, incremental

### Exit criteria
- [ ] `forge.knowledge.query({ intent: "find all places SkillLoader is referenced" })` returns accurate, ranked results in <300ms
- [ ] The knowledge graph has File, Symbol, Decision, Convention nodes connected by typed edges
- [ ] BM25 finds exact identifiers; embeddings find semantically similar code
- [ ] Graph expansion pulls callers/callees of matched symbols
- [ ] Cold rebuild of 100k-file project <3s
- [ ] Incremental update on save <200ms
- [ ] All agents use `forge.knowledge.query()` instead of ad-hoc file reads for context

### Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| napi-rs setup complexity on macOS (M-series) | Medium | High | Test early; have a pure-TS fallback for BM25 (lunr.js) |
| Voyage API rate limits during bulk embedding | Medium | Medium | Implement backoff + batch; cache aggressively; BGE-M3 fallback |
| Hybrid retrieval quality is poor | Medium | High | Measure recall@10 against hand-labeled queries; tune pipeline parameters |
| RAM usage exceeds 2GB cap on large projects | Low | Medium | Profile early; implement eviction for vector cache |

---

## 6. Phase 3 — 24-Hour Sprint Mode

**Goal:** Run a complete 24-hour mission with phase budgets, scope cuts, and real-time clock.

**Duration:** 1-2 weeks

**Depends on:** Phase 1 exit criteria met (Phase 2 is nice-to-have but not blocking)

### Checklist

#### 3.1 — Phase clock
- [ ] Implement wall-time clock per mission (H+0 to H+24)
- [ ] Implement per-phase time budgets (configurable per `.forge/config.yaml`)
- [ ] Implement soft deadline warnings (emit to dashboard.json)
- [ ] Implement hard deadline CTO escalations (emit to CTO inbox)
- [ ] Write tests: clock, budget tracking, deadline enforcement

#### 3.2 — Scope cut precedence
- [ ] Implement priority labels on slices: `critical`, `important`, `nice-to-have`
- [ ] Implement orchestrator scope-cut logic per §7 precedence:
  1. Cut nice-to-have slices
  2. Cut secondary verifiers
  3. Cut docs to draft
  4. Cut release (draft PR only)
  5. Never cut tests/security on §17.5 sensitive surfaces
- [ ] Implement CTO override for scope cuts
- [ ] Write tests: each cut level, override

#### 3.3 — 24-hour timeline
- [ ] Implement H+N timestamp tracking per phase
- [ ] Implement phase transition events
- [ ] Implement mid-mission check-in at H+12 (CTO inbox item)
- [ ] Wire into dashboard.json for visualization
- [ ] Write tests: phase transitions, check-in

#### 3.4 — Dogfood mission
- [ ] Run a real 24-hour mission (build a Forge feature using Forge)
- [ ] Record: actual phase durations vs budgets
- [ ] Record: CTO inbox item count and response time
- [ ] Record: total cost
- [ ] Document friction points

### Exit criteria
- [ ] A 24-hour mission completes with all phases hitting budgets or escalating per policy
- [ ] Scope cuts work when implementation overruns
- [ ] The CTO receives mid-mission check-in at H+12
- [ ] Total mission cost is tracked and within expected range ($30-50)

---

## 7. Phase 4 — Integrations

**Goal:** GitHub PRs, JIRA tickets, and Gemini cross-LLM PR review work end-to-end.

**Duration:** 2 weeks

**Depends on:** Phase 1 exit criteria met

### Checklist

#### 4.1 — LLM router
- [ ] Implement `packages/llm-router/` with uniform interface
- [ ] Implement provider adapters: Anthropic (Claude), Google (Gemini), OpenAI (GPT-5)
- [ ] Implement per-request cost tracking
- [ ] Implement fallback routing (provider outage → next provider)
- [ ] Implement model selection per role from org-chart
- [ ] Write tests: routing, cost tracking, fallback

#### 4.2 — GitHub MCP integration
- [ ] Configure `github-mcp-server`
- [ ] Wire: create branch (per impl agent, per slice)
- [ ] Wire: commit (per slice completion)
- [ ] Wire: open PR (release-manager)
- [ ] Wire: request review
- [ ] Wire: merge PR (after CTO approval)
- [ ] Wire: create issue (for non-blocking verifier findings)
- [ ] Write integration tests against a test repo

#### 4.3 — JIRA MCP integration
- [ ] Configure `atlassian-mcp`
- [ ] Wire: read epic/story/task
- [ ] Wire: create story under epic (from mission decomposition)
- [ ] Wire: update task status (on slice completion)
- [ ] Wire: attach mission artifacts at close
- [ ] Implement JIRA hierarchy mapping (Epic↔Project, Story↔Mission, Sub-task↔Slice)
- [ ] Write integration tests

#### 4.4 — Gemini PR review
- [ ] Build `gemini-review-mcp` adapter
- [ ] Implement: send full PR diff + mission brief + verifier findings to Gemini 2.5 Pro
- [ ] Implement: parse structured response (severity-tagged findings)
- [ ] Implement: post findings as PR comment
- [ ] Implement: block merge on HIGH/CRITICAL
- [ ] Implement: disagreement detection (Claude verifier vs Gemini reviewer)
- [ ] Wire disagreements to CTO inbox
- [ ] Write tests: send, parse, block, disagreement

### Exit criteria
- [ ] A mission's impl agents create branches and commit per slice
- [ ] @release-manager opens a PR after verification passes
- [ ] @pr-reviewer (Gemini 2.5 Pro) reviews the PR diff
- [ ] Gemini findings appear as PR comments
- [ ] HIGH findings block merge until CTO reviews
- [ ] JIRA tickets transition through the mission lifecycle
- [ ] CTO approves → PR merges → JIRA updates to Done

### Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini API response format changes | Low | Medium | Schema validation on response; version-pin API |
| MCP server compatibility issues | Medium | Medium | Test each MCP server independently before wiring |
| GitHub rate limits during parallel missions | Low | Medium | Implement backoff; batch operations |

---

## 8. Phase 5 — Dashboard + Anvil Design System

**Goal:** Visual dashboard inside Forge (or standalone Electron view) showing org chart, mission swimlanes, CTO inbox, decision ledger, cost meter.

**Duration:** 3 weeks

**Depends on:** Phase 0-1 exit criteria met (dashboard reads from existing data structures)

### Checklist

#### 5.1 — Anvil token implementation
- [ ] Create `packages/anvil/tokens/` with CSS custom properties per ANVIL_DESIGN_SYSTEM.md §3
- [ ] Implement Forge Dark theme (default)
- [ ] Implement Forge Light theme
- [ ] Implement Forge High-Contrast theme (WCAG AAA)
- [ ] Set up Satoshi + Commit Mono font loading
- [ ] Implement 4px grid system
- [ ] Write visual regression tests for token application

#### 5.2 — Dashboard shell
- [ ] **Decision: standalone Electron webview OR Code-OSS extension view?**
  - Recommendation: standalone webview initially; migrate to Code-OSS view later
- [ ] Implement dashboard frame: header strip (project, mission, clock, budget, status)
- [ ] Implement org chart panel (role states, click to expand)
- [ ] Implement mission swimlane Gantt view (reuse Anvil spec)
- [ ] Implement CTO inbox panel (approve/reject/escalate inline)
- [ ] Implement decision ledger panel (chronological stream)
- [ ] Implement cost meter (global + per-mission + per-role)

#### 5.3 — Real-time updates
- [ ] Implement file watcher on `dashboard.json` for live updates
- [ ] Implement WebSocket bridge (if standalone) or IPC (if Code-OSS view)
- [ ] Target: 16ms frame budget during streaming

#### 5.4 — AI-native components
- [ ] Agent Card component (state dot, role name, progress, cost)
- [ ] Ghost Diff Stream component (streaming diff with cursor)
- [ ] Risk Classifier badge
- [ ] Skill Pill (active skills indicator)
- [ ] Cost Meter component
- [ ] Critic Verdict Block

#### 5.5 — Code-OSS deep integration
- [ ] Register Forge-specific views in the workbench (Mission Control F4, Dashboard)
- [ ] Wire webview panels to read live `dashboard.json` from mission directory
- [ ] Add Forge-specific keybindings (F4 → Dashboard, Cmd+Shift+I → CTO Inbox)
- [ ] Build signed Electron app distribution
- [ ] Note: Fork already exists at `codeoss/`; rebranding done in Phase 0

### Exit criteria
- [ ] Dashboard opens and shows live mission state
- [ ] CTO can approve/reject inbox items from the dashboard
- [ ] Cost meter updates in real time during agent runs
- [ ] All three Anvil themes work
- [ ] Swimlane shows agent progress per slice

### Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Code-OSS fork maintenance burden | High | High | Defer to after v1; use standalone Electron first |
| Dashboard performance during parallel agent runs | Medium | Medium | Profile early; throttle updates to 1/s |

---

## 9. Phase 6 — Dogfood + Stabilize

**Goal:** Use the system for real Bakstage/Mandalore work for 2+ weeks. Fix what breaks.

**Duration:** 2-3 weeks

**Depends on:** Phases 0-4 exit criteria met

### Checklist

- [ ] Run 5+ real Standard Mode missions (bug fixes, small features)
- [ ] Run 2+ real 24-Hour Mode missions (internal tools, prototypes)
- [ ] Capture friction in a structured log (`.claude/memory/lessons.md`)
- [ ] Tune role definitions based on observed behavior
- [ ] Tune budget thresholds based on actual costs
- [ ] Tune verifier prompt quality based on finding accuracy
- [ ] Fix critical bugs discovered during dogfood
- [ ] Measure: what % of your work goes through Forge vs status quo
- [ ] Update `engineering-context.md` with any discovered conventions
- [ ] Update `playbooks.md` with any repeatable sequences

### Exit criteria
- [ ] You use the system for >=50% of your weekly development work
- [ ] No critical bugs remain
- [ ] Average mission cost is within budget expectations
- [ ] Verifier findings are useful (>50% true positive rate)
- [ ] CTO inbox items have clear, actionable recommendations

---

## 10. Phase 7 — Operations Layer

**Goal:** Payroll, work schedule, self-healing, basic grounded re-verification.

**Duration:** 2 weeks

**Depends on:** Phase 6 — you need real usage data before building operations tooling

### Checklist

#### 7.1 — Payroll
- [ ] Implement `.forge/payroll.yaml` parser
- [ ] Implement per-role monthly cost aggregation
- [ ] Implement budget threshold alerts (50%, 80%, 100% → CTO inbox)
- [ ] Implement monthly payroll report generation (`.claude/reports/payroll-<YYYY-MM>.md`)
- [ ] Implement basic ROI signal (utilization-based: high/medium/low/unclear)
- [ ] Write tests: aggregation, threshold alerts, report generation

#### 7.2 — Work schedule
- [ ] Implement `.forge/schedule.yaml` parser
- [ ] Implement business hours enforcement (refuse new missions outside hours)
- [ ] Implement 24-Hour Mode override
- [ ] Implement role lifecycle states: active, paused, on-leave, retired
- [ ] Implement pause/resume/leave/restart commands via @vp-engineering
- [ ] Write tests: schedule enforcement, lifecycle transitions

#### 7.3 — Self-healing
- [ ] Implement `.forge/self-healing.yaml` parser
- [ ] Implement 8 failure mode detectors:
  - Mission crash (heartbeat timeout)
  - KG corruption (schema validation)
  - Cost runaway (budget cap crossed)
  - Verifier finding storm (>5 HIGH)
  - Stuck role (no progress for 2x phase budget)
  - MCP failure (retries exhausted)
  - Model outage (API retries exhausted)
  - Worktree conflict (git lock error)
- [ ] Implement recovery actions per failure mode
- [ ] Implement max 3 retries per failure type
- [ ] Implement escalation to CTO inbox after retries exhausted
- [ ] Implement journal logging with `[self-healing]` prefix
- [ ] Write tests: each failure mode detection + recovery

#### 7.4 — Grounded re-verification (basic)
- [ ] Implement daily test re-run on §17.5 production-critical paths
- [ ] Implement regression detection (test that passed before now fails)
- [ ] Emit findings to CTO inbox
- [ ] Write tests: regression detection

### Exit criteria
- [ ] Monthly payroll report generates with accurate cost data
- [ ] Budget alerts fire at configured thresholds
- [ ] Work schedule blocks off-hours mission acceptance
- [ ] Self-healing recovers from a simulated mission crash
- [ ] Self-healing escalates after 3 retries
- [ ] Daily test re-run detects a planted regression

---

## 11. Phase 8 — Advanced Operations

**Goal:** Notion/Slack integrations, dream mode, continuous learning, meditation, SME network.

**Duration:** 3 weeks

**Depends on:** Phase 7 exit criteria met

### Checklist

#### 8.1 — Notion integration
- [ ] Configure `notion-mcp-server`
- [ ] Wire: decision ledger → Notion page (per-mission-close)
- [ ] Wire: journal digest → Notion (weekly)
- [ ] Wire: conventions → Notion (sync on change)
- [ ] Wire: mission reports → Notion (on close)
- [ ] Wire: payroll reports → Notion (monthly)
- [ ] Write integration tests

#### 8.2 — Slack integration
- [ ] Configure `@modelcontextprotocol/server-slack`
- [ ] Wire: CTO inbox HIGH/CRITICAL → Slack channel
- [ ] Wire: mission complete/failed → Slack
- [ ] Wire: payroll threshold → Slack
- [ ] Implement `/forge status`, `/forge inbox`, `/forge approve`, `/forge reject`, `/forge pause` slash commands
- [ ] Implement quiet hours (DND)
- [ ] Write integration tests

#### 8.3 — Dream mode
- [ ] Implement dream-mode schedule trigger (02:00-06:00 weekday default)
- [ ] Implement operations:
  - KG rebuild + optimization
  - Embedding cache pre-warm
  - Journal weekly digest (if Friday night)
  - Decision ledger compaction
- [ ] Implement `.claude/dreams/<YYYY-MM-DD>.md` artifact generation
- [ ] Enforce: no source code edits, no git push, no deploy (tool allowlist)
- [ ] Write tests: schedule trigger, operations, artifact generation, tool restriction

#### 8.4 — Continuous learning
- [ ] Implement `.forge/learning.yaml` parser
- [ ] Implement Tier 1-2 source crawler (scheduled during dream mode)
- [ ] Implement change detection (diff against last snapshot)
- [ ] Implement proposal generation (`.claude/learning/proposals/<date>/<topic>.md`)
- [ ] Wire proposals to CTO inbox
- [ ] Implement apply/reject workflow
- [ ] Write tests: crawl, detect, propose, apply, reject

#### 8.5 — Meditation
- [ ] Implement meditation trigger on mission close
- [ ] Implement schema enforcement (concrete metrics, cited observations, max 3 proposals, "what I'm NOT going to do")
- [ ] Generate `.claude/meditations/<mission-id>/<role>.md`
- [ ] Wire proposals to CTO inbox
- [ ] Write tests: trigger, schema enforcement, generation

#### 8.6 — SME network
- [ ] Author 5 SME agent definitions:
  - `@sme-java-spring`
  - `@sme-typescript-frontend`
  - `@sme-mongodb-firestore`
  - `@sme-aws-cloud`
  - `@sme-voice-ai`
- [ ] Implement `forge.sme.consult()` tool
- [ ] Implement SME crawl during dream mode
- [ ] Implement Tier 1-2 citation enforcement on SME responses
- [ ] Implement idle-time-only schedule
- [ ] Write tests: consult, crawl, citation enforcement

### Exit criteria
- [ ] Decision ledger entries appear in Notion after mission close
- [ ] HIGH-severity CTO inbox items push to Slack
- [ ] `/forge approve <id>` works from Slack
- [ ] Dream mode runs on schedule, produces artifacts, does NOT edit source code
- [ ] Continuous learning generates a proposal from a detected change in TypeScript docs
- [ ] Meditation produces schema-valid artifacts per role on mission close
- [ ] `forge.sme.consult({ domain: "java-spring", question: "..." })` returns a cited answer

---

## 12. Cross-Cutting Concerns

These apply across all phases:

### Security
- [ ] Per-role tool allowlists enforced structurally (Phase 0)
- [ ] Secrets in OS keychain only; never on disk (Phase 0)
- [ ] Zod validation at every trust boundary (Phase 0)
- [ ] No `eval`, `Function()`, `child_process.exec` with shell interpolation (Phase 0)
- [ ] `pino` redaction config for secrets in logs (Phase 0)
- [ ] Dependency vulnerability scanning in CI: `npm audit` + `cargo audit` (Phase 0)
- [ ] License check on deps: MIT/Apache/BSD/ISC only (Phase 0)

### Testing
- [ ] Vitest for new TS packages (Phase 0)
- [ ] Mocha for Code-OSS tests if/when fork exists (Phase 5)
- [ ] `cargo test` for Rust (Phase 2)
- [ ] Property-based tests (fast-check) for: diff engine, knowledge graph query, capability graph (Phase 2)
- [ ] Transcript-replay harness for agent tests (Phase 1)
- [ ] Playwright E2E for dashboard (Phase 5)
- [ ] Flaky test policy: quarantine 24h, fix 7d, delete 14d (Phase 1)

### Documentation
- [ ] TSDoc on every exported function from `packages/*/index.ts` (continuous)
- [ ] rustdoc on every public Rust item (Phase 2)
- [ ] ADRs in `docs/adr/` for decisions >1 person-week (continuous)
- [ ] Runbooks in `docs/runbooks/` (Phase 7):
  - `runaway-mission-budget.md`
  - `orchestrator-deadlock.md`
  - `verifier-finding-storm.md`
  - `knowledge-graph-corruption.md`
  - `mission-recovery-after-crash.md`

### Version control
- [ ] Trunk-based development; `main` always shippable (Phase 0)
- [ ] Conventional Commits (Phase 0)
- [ ] Feature branches <5 days (Phase 0)
- [ ] Mission-generated branches: `mission/<id>/<slice>` (Phase 0)
- [ ] Squash on merge (Phase 0)

---

## 13. Risk Register

| # | Risk | Phase | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | Claude Agent SDK limitations block agent spawn pattern | 0 | Medium | Critical | Prototype SDK usage in week 1; identify gaps; raw API fallback | CTO |
| R2 | 4 parallel agents exceed machine resources | 1 | Medium | High | Benchmark on target hardware; implement sequential fallback | CTO |
| R3 | napi-rs + macOS ARM build issues | 2 | Medium | High | Test in week 1 of Phase 2; pure-TS fallback (lunr.js for BM25) | CTO |
| R4 | Hybrid retrieval quality insufficient | 2 | Medium | High | Hand-label 50 queries; measure recall@10; tune pipeline | CTO |
| R5 | Code-OSS upstream rebase breaks customizations | 5 | Medium | Medium | Keep Forge changes in separate files/extensions where possible; minimize core patches | CTO |
| R6 | Gemini API compatibility/quality for PR review | 4 | Low | Medium | Version-pin; validate response schema; manual fallback | CTO |
| R7 | Scope creep from documentation richness | All | High | High | This plan is the scope. Nothing not in this plan ships until this plan is done. | CTO |
| R8 | Token costs exceed budget during development | All | Medium | Medium | Monitor daily; use Sonnet where possible; Haiku for trivial roles | CTO |
| R9 | Over-engineering the operations layer before core is solid | 7-8 | Medium | High | Phase 7-8 gated on Phase 6 exit criteria (50% adoption) | CTO |
| R10 | Single-person bus factor | All | High | Critical | This is a private tool; acceptable risk. Document everything. | CTO |

---

## 14. Open Decisions for CTO

Decisions needed before starting Phase 0:

| # | Decision | Options | Default | Impact if wrong |
|---|---|---|---|---|
| D1 | ~~Start with Code-OSS fork or standalone runtime?~~ | **RESOLVED** — fork exists at `codeoss/` | Build into the fork from Phase 0 | N/A |
| D2 | JIRA, Linear, or GitHub Projects? | JIRA (you mentioned it) | **JIRA** | Low — swappable via integration config |
| D3 | Gemini model for PR review? | 2.5 Pro / 3 Flash / 3 Pro | **2.5 Pro** | Low — configurable |
| D4 | Per-mission budget defaults? | $20 Standard / $50 24-Hour | **$20 / $50** | Low — tunable after dogfood |
| D5 | Self-host BGE-M3 for offline embedding? | Yes / No | **Yes** | Low — fallback only |
| D6 | Auto-decision policy for low-severity inbox items? | Never / After 1h / After 4h | **Never** for now | Low — conservative default |
| D7 | Budget: target monthly API spend during development? | $200 / $400 / $600 | Need input | Medium — affects model selection for dev work |

Decisions to make during build:

| # | Decision | When | Impact |
|---|---|---|---|
| D8 | What constitutes a "slice"? | Phase 1, based on first missions | High — affects parallelism and cost |
| D9 | KG rebuild trigger: on save, commit, or demand? | Phase 2 | Medium — save is freshest but costliest |
| D10 | Cost cap behavior: hard-stop vs escalate-and-continue? | Phase 3 | Medium — affects mission reliability |

---

## 15. What This Plan Explicitly Defers

Not in v1. Not forgotten. Deferred with rationale.

| Feature | Why deferred | Revisit when |
|---|---|---|
| Cloud spillover for agent compute | Adds infra complexity; single machine is sufficient for v1 | Machine becomes the bottleneck |
| Multi-model best-of-N for verifiers | Claude-only verification is sufficient baseline | After 20+ missions show verifier blind spots |
| Cross-project shared knowledge graph | Per-project KG is sufficient; cross-project adds complexity | 3+ projects actively using Forge |
| Plugin/skill marketplace | Single user; you write your own skills | Never (not for public release) |
| Multi-tenancy | Single user | Never |
| Public docs site | In-house only | Never |
| SOC2 / SSO / billing | Not for sale | Never |
| Mobile app | CTO inbox via Slack is sufficient | Never |
| Capability Graph (semantic tool selection) | Can defer; explicit tool lists work for 12 roles | When tool count exceeds 50 per role |
| `native/diff-engine/` | Existing diff tools work; optimize later | When diff performance is measured as bottleneck |
| `native/blast-radius/` | Not needed for v1 | When blast-radius analysis is requested |

---

## 16. Cost Model

### Development phase API costs (estimated)

| Phase | Duration | Estimated API spend | Notes |
|---|---|---|---|
| Phase 0 | 2-3 weeks | $100-200 | Mostly Sonnet; some Opus for testing orchestrator |
| Phase 1 | 2 weeks | $150-300 | 4 parallel agents burn fast during testing |
| Phase 2 | 3 weeks | $50-100 + $20-40 embeddings | Less agent work; more Rust coding |
| Phase 3 | 1-2 weeks | $100-200 | Real 24-hour missions during dogfood |
| Phase 4 | 2 weeks | $100-200 | Integration testing |
| Phase 5 | 3 weeks | $50-100 | Mostly UI work |
| Phase 6 | 2-3 weeks | $200-400 | Real missions |
| Phase 7-8 | 5 weeks | $150-300 | Operations work |
| **Total** | **20-23 weeks** | **$900-1,840** | |

### Operational costs (post-v1)

| Item | Monthly estimate |
|---|---|
| Agent API costs (12 roles, ~60% utilization) | $400-600 |
| Embedding costs (Voyage 3-Large) | $10-30 |
| Gemini PR review | $15-30 |
| Self-hosted reranker (compute) | $0 (local) |
| **Total** | **$425-660/month** |

---

## 17. Success Metrics

### Phase 0 (must-hit)
- A mission runs end-to-end with 3 roles
- Cost tracking works per agent

### Phase 6 (v1 success)
- >=50% of weekly development work goes through Forge
- Average Standard Mode mission cost <$25
- Average 24-Hour Mode mission cost <$50
- Verifier true-positive rate >50%
- CTO inbox response time <15 minutes during work hours
- No data loss from mission crashes

### Phase 8 (full system)
- Monthly payroll report generates accurately
- Dream mode runs on schedule without intervention
- Continuous learning catches at least 1 real framework change per month
- SME consultations return cited, accurate answers

---

## Summary: The Critical Path

```
Phase 0 (2-3w)         Phase 1 (2w)   Phase 3 (1-2w)  Phase 6 (2-3w)
Skeleton + Editor ────► Full Team ────► 24-Hour Mode ──► Dogfood
Rebrand + Anvil Theme       │                                │
   │                        ▼                                ▼
   │                   Phase 2 (3w)     Phase 4 (2w)    Phase 7 (2w)
   │                   Knowledge ──────► Integrations ──► Operations
   │                   Graph                                 │
   │                                                         ▼
   │                                Phase 5 (2w)        Phase 8 (3w)
   │                                Dashboard ─────────► Advanced Ops
   │                                (into editor)
   ▼
   Total: ~18-21 weeks to full system
   Usable at Phase 1 (~4-5 weeks)
   Production-quality at Phase 6 (~12-14 weeks)
```

**The most important line in this plan:** Phase 0 alone gives you working value. Every subsequent phase is incremental. Do not wait for the full system to start using it.

---

*This plan is wrong in places — every plan this size is. The point is to make the wrongness visible so you can fix it cheaply. Review the open decisions (§14), the risk register (§13), and the deferrals (§15). Tell me which assumptions are wrong.*
