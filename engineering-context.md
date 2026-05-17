# Engineering Context — Forge

> **Purpose.** This file is the single source of truth for project-specific conventions that the engineering-excellence skill suite reads at session start. Skills consult sections of this file by name.
>
> **Format.** Each section has a one-line **summary** for fast scanning, then **details** with the full answer.
>
> **Rule.** When a skill's universal default conflicts with this file, this file wins. When this file is silent on a topic, the skill states the default it's using and proceeds — surface the silence rather than burying it.
>
> **Project state.** Forge is **pre-Phase-0 / greenfield** as of this writing. Many entries below describe the *intended* state for Phase 1 (Weeks 5–10). Where a section is genuinely undecided, it says so explicitly rather than inventing an answer.
>
> **Operating mode.** This project operates under **Team Mode** (see `FORGE_TEAM_MODE.md` for Phase 1 — roles, missions, knowledge graph, CTO inbox, 24-hour sprint cycle). The operational layer on top (payroll, work schedule, self-healing, continuous learning, dream mode, meditation, grounded re-verification, SME network) is specified in **`FORGE_TEAM_OPERATIONS.md`** (Phase 2; see §19). The reading order at session start is: this file → `.forge/org-chart.yaml` → other `.forge/*.yaml` config (payroll, schedule, learning, reverification, self-healing, integrations) → `.claude/memory/` → mission directory (if a mission is active). Pure single-agent work falls back to Standard Mode.
>
> **Design system.** Forge's UI uses the **Anvil design system** — "Industrial Precision" aesthetic, single signal accent (Forge Amber #FF5C1F), 4px grid, 1px hairlines, full token set for Forge Dark / Light / High-Contrast. The spec is in **`ANVIL_DESIGN_SYSTEM.md`** (805 lines, see §5.5). Any role touching UI code (`@stylist`, `@impl-*` on UI slices, `@docs-author` for screenshots) loads Anvil's tokens and component library at session start. Departing from Anvil for new UI without an Anvil revision is a §17.5-class change.
>
> **Implementation plan.** The phased enterprise implementation plan is in **`IMPLEMENTATION_PLAN.md`** (8 phases, full checklists, risk register, cost model, success metrics). The plan reflects the current starting point: Code-OSS v1.121.0 fork at `codeoss/`, Anvil mockup at `forge-mockup.html`, 31 skills defined, zero implementation code. Phase 0 starts with editor rebranding + Anvil theme + monorepo scaffold + first 3 roles. Read this file for build order, go/no-go gates, and open decisions.

---

## §1. Project identity

**Summary:** Forge is a private, in-house, multi-agent AI-native code editor — a Code-OSS fork built on the Claude Agent SDK, operated as a hierarchical AI engineering organization with one human CTO.

**Details:**
- **Name:** Forge (working codename; final brand TBD)
- **Repository:** `github.com/<org>/forge` (org name TBD — Bakstage org or new org)
- **Purpose / business goal:** A private 10× force-multiplier for the CTO. Idea-to-shipped-software in 24 hours via a coordinated AI engineering team. Not for public release.
- **Stage:** prototype (Phase 0–1) → internal-tooling (Phase 2+, dogfood-only)
- **Audience / users:** **One.** The CTO is the user; the system is the user's reports.
- **Compliance constraints:** none. Single-user, in-house, never released. Personal-data compliance still applies to whatever the CTO's missions touch (e.g., a mission that processes customer data inherits that data's compliance posture).

**Operating note.** Because there is one user, internal "permissions" in the system are *role-based* (who can edit, who can verify, who can review) — not security-based. Security boundaries exist between the system and external services (GitHub, JIRA, Gemini API), not between roles inside it.

---

## §2. Language & runtime

**Summary:** TypeScript (Node 22) for the editor shell, agent runtime, and Team Mode coordination; Rust (stable, edition 2024) for the indexer, BM25 (tantivy), and knowledge graph (petgraph); Python 3.12 only as an optional kernel for data-science agents.

**Details:**
- **Primary language(s) and version(s):** TypeScript 5.5+, Rust stable (1.83+), Python 3.12 (optional)
- **Runtime:** Node 22 LTS (Electron 32+ ships Node 22); Rust compiled to native via `napi-rs` for the indexer and knowledge graph; Python sandbox via Pyodide or subprocess (not decided — flagged in §15)
- **Package manager:** pnpm 9+ with workspaces; Cargo for Rust; uv for Python
- **Build tool:** Inherit Code-OSS's gulp + esbuild + webpack for the editor proper; tsup or `tsc` for new TS packages; cargo for Rust; Turborepo for the top-level monorepo task graph
- **Formatter:** Prettier (config in repo root); `rustfmt` with `edition = "2024"`; `ruff format` for Python
- **Linter:** ESLint (flat config) with `@typescript-eslint/strict` + Code-OSS rules merged; `clippy --all-targets --all-features -- -D warnings`; `ruff check`
- **Type-checker:** `tsc --noEmit --strict`; Rust types mandatory; `mypy --strict` for Python kernel code
- **How to run all of the above:** `pnpm check` (lint + typecheck + format-check + cargo check + cargo clippy + ruff)

**Deep dive:**
- Code-OSS uses CommonJS in the workbench layer; new packages are ESM. The TS config has dual targets — keep this isolation explicit.
- Rust crates live under `native/` and are exposed to TS via `napi-rs`. We do **not** use FFI strings without UTF-8 validation; tree-sitter spans assume UTF-8.
- Version-pinning policy: exact pinning for runtime deps in `package.json` and `Cargo.toml`; renovate bot updates weekly with CI gating.

---

## §3. Frameworks & libraries

**Summary:** Editor on Code-OSS + Monaco; agent runtime on `@anthropic-ai/claude-agent-sdk`; Rust indexer on tree-sitter + tantivy; in-memory knowledge graph (petgraph) + Voyage 3-Large embeddings + BGE-Reranker-v2.

**Details:**
- **Web / API framework:** Fastify (TS) for any local HTTP surface. No Express.
- **ORM / data access:** Drizzle for Forge Cloud (if and when it exists). `better-sqlite3` for the local skill/MCP cache and mission state.
- **Test framework:** Mocha (inherited from Code-OSS) for editor tests; Vitest for new TS packages; `cargo test` + `criterion` for Rust; Playwright for E2E.
- **HTTP client:** `undici` (Node-native, fastest). Not axios.
- **Logging library:** `pino` (TS, structured, JSON); `tracing` + `tracing-subscriber` for Rust.
- **Async / concurrency model:** TS is `async/await` only. Rust uses `tokio` runtime; no `block_on` in agent code paths.
- **Validation library:** `zod` for TS; `serde` + `validator` for Rust.
- **DI / IoC:** None. Code-OSS uses a service-locator pattern; we extend it.
- **Front-end framework:** None for the editor shell (Monaco + Code-OSS workbench). React + Vite for any cloud-admin or marketing surface (if/when those exist).
- **State management:** Code-OSS's event-emitter + service pattern in the editor. Zustand for any React surface. No Redux.

**Team Mode-specific stack (new in this revision):**
- **Knowledge graph:** `petgraph` (Rust crate), in-memory, exposed to TS via napi-rs. Schema is in §14.
- **BM25 lexical search:** `tantivy` (Rust crate), in-memory. Symbol and identifier search.
- **Embeddings (primary):** Voyage 3-Large API (default). Voyage 4-Large MoE when budget allows. Fallback: BGE-M3 self-hosted via Ollama for offline mode.
- **Embeddings (cost-optimized):** Google `text-embedding-005` for non-critical indexing.
- **Reranker:** BGE-Reranker-v2 (self-hosted) or Cohere Rerank 3 API (fallback).
- **Multi-LLM router:** thin TS package `packages/llm-router/` that proxies Claude / Gemini / GPT-5 with a uniform interface and per-request cost tracking.
- **External MCPs configured:** `github-mcp-server`, `atlassian-mcp` (JIRA), `notion-mcp-server` (Notion: publishes decision ledger, journal, conventions, mission reports, payroll reports — see §19.3), `@modelcontextprotocol/server-slack` (Slack: high-severity CTO Inbox alerts + slash commands like `/forge approve <id>` — see §19.3), `gemini-review-mcp` (custom adapter for cross-LLM PR review).

**Policy on adding new dependencies:** Gate via the CTO. Every new runtime dependency requires (a) license check (MIT/Apache/BSD/ISC only — no GPL/AGPL in the editor), (b) bundle-size impact, (c) maintenance signal (last release < 12 months, > 1 active maintainer).

**Version pinning policy:** Exact pinning (`1.2.3`, no `^` or `~`) for runtime deps; range for dev tooling only.

---

## §4. Code conventions

**Summary:** Match VS Code's editor conventions inside the Code-OSS tree; outside that tree, modern strict TS with explicit typed errors, no `any`, and feature-folder organization.

**Details:**
- **File / module organization:**
  - Inside the Code-OSS fork: preserve the existing `src/vs/` layered structure. Do not refactor for taste.
  - New packages live in `packages/` (TS) and `native/` (Rust), feature-folder organized.
  - Team Mode runtime lives in `packages/team-mode/` with sub-packages: `orchestrator/`, `roles/`, `missions/`, `knowledge/`, `dashboard/`, `inbox/`, `ledger/`.
  - Forge Cloud (if it exists) lives in `cloud/` with hexagonal layering.
- **Naming:** `kebab-case.ts` (matches Code-OSS); Rust files `snake_case.rs`; Classes/types `PascalCase`; functions/variables `camelCase`; constants `SCREAMING_SNAKE_CASE`. Test files `*.test.ts` colocated.
- **Error-handling style:** Throw typed domain errors (`SkillLoadError`, `PermissionDeniedError`, `MissionBudgetExceededError`, `RoleSpawnError`). Never catch generic `Error` except at process boundaries.
- **Async patterns:** `async/await` only. Cancellation via `AbortSignal`. No fire-and-forget without explicit `void` + comment.
- **Null / optional handling:** `T | undefined` over `T | null` (matches Code-OSS). Use `??` and `?.`; avoid `!` without a comment.
- **Comment / docstring style:** TSDoc for exported APIs. rustdoc on every public Rust item.
- **Pattern preferences:** Builder pattern for anything with >4 constructor parameters; explicit factory functions; `Result<T, E>`-style returns for fallible operations the caller must handle.
- **Patterns explicitly avoided:** No service locators outside Code-OSS's existing one. No reflection. No magic strings. No `// eslint-disable-next-line` without rationale. No `Promise.all` over user-supplied arrays without bounded concurrency.

**Deep dive:**
- VS Code's coding style guide applies inside `src/vs/` verbatim.
- Public-facing TS APIs in `packages/*/index.ts` need a TSDoc `@example` block.

---

## §5. Architecture

**Summary:** Local-first Electron app with four runtime layers (editor → AI surface → agent runtime → capability layer), plus a Team Mode coordination layer (orchestrator + roles + missions + knowledge graph + CTO inbox) that sits between the AI surface and the agent runtime.

**Details:**
- **Topology:** Local-first fat client (Electron). No required cloud control plane. Optional cloud spillover for compute-heavy agent runs.
- **Repo layout:** Monorepo, pnpm workspaces + Turborepo. Top-level layout:
  ```
  /code-oss/                       # vendored, upstream-tracked
  /packages/                       # Forge TS packages
    agent-runtime/
    skill-loader/
    mcp-broker/
    capability-graph/
    permission-system/
    hooks-engine/
    indexer-bridge/
    forge-protocol/
    llm-router/                    # NEW (Team Mode): Claude/Gemini/GPT-5 router
    team-mode/                     # NEW (Team Mode): orchestrator + roles + missions
  /native/                         # Rust crates
    indexer/
    diff-engine/
    blast-radius/
    knowledge-graph/               # NEW (Team Mode): petgraph + tantivy
  /skills/                         # built-in shipped skills (23 in Team Mode)
  /agents/                         # source for .claude/agents/*.md (generated from org-chart.yaml)
  /mcp-servers/                    # built-in MCP servers
  /docs/                           # ADRs, runbooks, contributor docs
  /e2e/                            # Playwright suites
  ```
- **Layering:** Five layers, top-down:
  1. **Editor shell** (Code-OSS workbench + Forge AI surface contributions)
  2. **AI surface** (Composer, Mission Control, inline edit, ghost diff stream)
  3. **Team Mode coordination** (orchestrator, roles, missions, knowledge graph, inbox)
  4. **Agent runtime** (subagents + critic + hooks engine + permission system)
  5. **Capability layer** (skill loader, MCP broker, capability graph, indexer bridge, LSP bridges)
- **Module boundaries:** Each `packages/*` exports a single `index.ts`. Cross-package imports via index only.
- **Data flow:** Sync request/response within the editor; agent runs stream (model → SSE → renderer); mission coordination is async file-based via `.claude/missions/<id>/`.
- **External services:**
  - Model providers (Anthropic primary, Google for PR review, OpenAI for tie-breaks) — direct from client.
  - Ollama / vLLM — local for sensitive scans and offline mode.
  - MCP servers — local stdio or remote HTTP.
  - GitHub, JIRA, Gemini — via MCP.
- **Deploy target:** Distributed as signed Electron builds (single-user). No public distribution channel.

**Deep dive:**
- ADR location: `docs/adr/NNNN-title.md`. Every architectural decision >1 person-week of work needs an ADR.
- Known pain point: Code-OSS upstream rebases. Weekly cadence is non-negotiable.
- The Knowledge Graph + Team Mode coordination are the most novel pieces and each get a design doc (`docs/design/knowledge-graph.md`, `docs/design/team-mode.md`).

---

## §5.5. Design system — Anvil

**Summary:** Forge's UI is built on the **Anvil design system** (`ANVIL_DESIGN_SYSTEM.md`, 805 lines), a complete visual language with the "Industrial Precision" aesthetic — a machinist's CNC-console metaphor with a single high-saturation signal accent and otherwise calm neutrals. Anvil is to the UI what `engineering-context.md` is to the codebase: the single source of truth that UI-touching roles read at session start.

**Details:**
- **Aesthetic:** Industrial Precision — calm, monochrome neutrals with a single signal accent. The accent is **Forge Amber #FF5C1F**, reserved for moments that demand attention (active agent surface, current cursor, primary CTA, error severity). Every other element uses the neutral palette.
- **Themes (mandatory tokens):**
  - **Forge Dark** (default): deep neutral surfaces, Forge Amber accent
  - **Forge Light**: paper-tone surfaces, Forge Amber accent
  - **Forge High-Contrast**: WCAG AAA for accessibility; same accent
  - Every component supports all three; switching themes never changes layout.
- **Typography:** **Satoshi** for UI text (variable axis 300–700); **Commit Mono** for code/data. Numeric tabular figures mandatory in cost meters, latency readouts, mission timers.
- **Grid:** 4px base unit. All spacing, padding, gaps are multiples of 4 (4, 8, 12, 16, 20, 24, 32, 48, 64). No 6px, no 10px, no 14px.
- **Hairlines:** 1px borders at low-contrast neutral. Anvil has no decorative shadows; surface separation comes from hairlines + subtle elevation tokens.
- **Six-zone shell:** the editor's chrome divides into Activity Bar, Side Bar, Editor Group, Mission Control panel (right), Status Bar, Command Center. Anvil specifies the exact tokens for each zone.
- **AI-native components specified by Anvil:**
  - Agent Card (orchestrator + specialist roles)
  - Mission Swimlane Gantt
  - Ghost Diff Stream (streaming diff with cursor)
  - Cost Meter (global + per-mission + per-role)
  - Risk Classifier badge
  - Skill Pill (active skills indicator)
  - Permission Mode switcher
  - Capability Graph Pill Picker
  - Critic Verdict Block
  - Best-of-N Comparison view
- **Accessibility floor:** WCAG AA on Forge Dark/Light; WCAG AAA on Forge High-Contrast.

**When Anvil is read:**
- Every role with `Edit` or `Write` access to `**/*.{tsx,jsx,svelte,vue,css,scss}` reads Anvil's tokens at session start.
- `@stylist` reads the full spec (it's their primary input).
- `@docs-author` reads the screenshot conventions and theme tokens.
- Architecture decisions affecting UI structure cite Anvil sections (e.g., "Per Anvil §3.2 Mission Swimlane, we'd need...").

**Departing from Anvil:**
- New UI patterns that don't fit Anvil's component library require an Anvil revision PR — same gating as a §17.5 sensitive surface change. The visual language is intentionally tight; one-off departures fracture it.
- The exception is Mission Control's experimental surfaces (e.g., new visualizations for the knowledge graph), which can prototype outside Anvil and then propose addition.

**Deep dive:**
- Token files live in `packages/anvil/tokens/` and are consumed by both the editor (via CSS variables) and the React surfaces (via design-tokens import).
- Anvil's mockup is `forge-mockup.html` (~1000 lines, self-contained, themed Forge Dark).
- Anvil's spec is `ANVIL_DESIGN_SYSTEM.md`. Read it once, reference it forever.

---

## §6. Testing

**Summary:** Vitest for new TS, Mocha for editor (inherited), `cargo test`/criterion for Rust, Playwright for E2E. Mock externals only; integration tests run real MCP servers in Testcontainers. **Team Mode adds:** deterministic transcript-replay for agent tests (model API replaced by recorded transcripts).

**Details:**
- **Frameworks:**
  - Unit: Vitest (new TS), Mocha (Code-OSS), `cargo test` (Rust)
  - Integration: Vitest + Testcontainers
  - E2E: Playwright driving packaged Electron app
  - **Agent / mission tests:** custom harness in `packages/team-mode/test-utils/` using deterministic transcript replay. Real model APIs never called in CI.
- **Test file location:** Colocated: `foo.ts` + `foo.test.ts`. E2E in `/e2e/` mirrors user-facing surface.
- **Test naming:** `describe('SkillLoader', () => { it('loads a skill from a workspace path', ...) })`. No "should" prefix.
- **Coverage philosophy:** Behavior over lines; no minimum gate. Sensitive paths (per §17) MUST ship with tests in the same PR.
- **Mocking style:** Mock externals only. Real Postgres/Redis via Testcontainers. Never mock our own modules.
- **Fixture patterns:** Builder pattern fixtures (`aSkill().withName('x').build()`). One `fixtures/` folder per package.
- **Integration test infrastructure:** Testcontainers for stateful deps. A `dev-stack` docker-compose for local dev.
- **Flaky-test policy:** Quarantine within 24h, fix within 7 days, delete after 14.
- **How to run tests locally:** `pnpm test` (everything) or `pnpm test --filter=@forge/agent-runtime`.
- **CI test command:** `pnpm test:ci`.

**Deep dive:**
- Property-based tests (`fast-check`) required for: diff engine, blast-radius calculator, indexer query API, knowledge graph query API, capability graph similarity search.
- Nightly E2E run against real Anthropic / Google APIs with budget-capped keys.
- **Team Mode mission tests:** every new mission flow ships with a transcript-replay test that covers the happy path + at least one verifier-rejection-and-retry case.

---

## §7. Documentation

**Summary:** TSDoc + rustdoc inline; ADRs in `docs/adr/`; runbooks in `docs/runbooks/`; Team Mode design docs in `docs/design/`; user docs in a separate `forge-docs` site (out of scope for private build).

**Details:**
- **Docstring convention:** TSDoc for TS; rustdoc for Rust. Every exported function from `packages/*/index.ts` needs `@example`.
- **README expectations:** Top-level README + per-package READMEs explaining ownership and how to run tests.
- **ADR location:** `docs/adr/NNNN-title.md`.
- **Runbook location:** `docs/runbooks/`. Required runbooks for Team Mode: `runaway-mission-budget.md`, `orchestrator-deadlock.md`, `verifier-finding-storm.md`, `knowledge-graph-corruption.md`, `mission-recovery-after-crash.md`.
- **Design docs:** `docs/design/{team-mode,knowledge-graph,cto-inbox,decision-ledger}.md` for systems; **`ANVIL_DESIGN_SYSTEM.md`** is the visual-language spec (read at session start by any role touching UI; see §5.5); **`FORGE_TEAM_OPERATIONS.md`** is the Phase 2 operational layer spec (see §19).
- **API docs:** OpenAPI 3.1 spec for any HTTP surface. Code-OSS internal APIs not documented externally.

**Deep dive:**
- Deprecation policy: `@deprecated` tag + removal-version comment + CHANGELOG entry. Removal no sooner than two minor versions later.

---

## §8. Security

**Summary:** Multiple trust boundaries (user prompt, repo content, model output, MCP server output, marketplace skill content). **Team Mode adds:** per-role tool allowlists structurally enforced via Claude Code custom subagent frontmatter; verifiers and PR-reviewer are read-only by allowlist; the orchestrator (@vp-engineering) has no editing tools at all.

**Details:**
- **Trust boundaries:**
  1. **User prompt → orchestrator**: trusted-with-budget; orchestrator obeys per permission mode.
  2. **Model output → tool call**: adversarial-input-trusted-with-policy-check.
  3. **Repo content → agent context**: untrusted by default. Hooks/skills from a fresh clone disabled until trust granted.
  4. **MCP server output**: untrusted. Validate against tool schema.
  5. **Skill content from marketplace**: untrusted until signature verified.
  6. **Inter-role artifacts** (mission directory files): trusted within a mission; an agent that produces a poisoned artifact can mislead siblings — the orchestrator and verifiers cross-check artifacts against ground-truth signals.
- **Auth pattern:** OS keychain on client. OAuth2 + short-lived JWT for any cloud surface.
- **Authz pattern:** Per-role tool allowlists (Claude Code custom subagent `tools:` + `disallowedTools:` fields). RBAC for any future cloud surface.
- **Secrets management:** Client: OS keychain only — never plaintext on disk, never in `localStorage`. Cloud: Vault or AWS Secrets Manager. Pino redaction config strips known secret patterns. **Phase 2 integrations add these secrets, all keychain-stored:** `NOTION_API_KEY` (Notion MCP), `SLACK_BOT_TOKEN` (Slack MCP), `GEMINI_API_KEY` (cross-LLM review), `VOYAGE_API_KEY` (embeddings). All accessed via environment variables resolved at runtime from the keychain; never committed; never in mission directories; never logged.
- **Input validation policy:** Validate at every trust boundary. Zod for every tool input, IPC channel, HTTP route.
- **Output escaping policy:** Per-output-medium. DOMPurify for markdown→webview. Array-form `spawn` for shell. Drizzle parameterized queries for SQL.
- **Dependency vulnerability process:** Dependabot weekly; `npm audit`, `cargo audit` in CI; manual review for HIGH/CRITICAL within 48h.
- **PII handling:** No code from user repos leaves the client by default. Cloud agents run on snapshots the user explicitly pushes. Telemetry opt-in.
- **Things explicitly forbidden:**
  - No `eval`, no `Function()` constructor, no `vm.runInNewContext` on untrusted input
  - No `child_process.exec` with shell interpolation
  - No raw SQL string-building
  - No loading hooks/skills from a repo before trust verification
  - No network egress from a skill without it being declared in the skill manifest
  - No storing API keys outside the OS keychain
  - No telemetry without explicit opt-in
  - **No role granting itself additional tools mid-session.** Tools are declared in `org-chart.yaml`, materialized into `.claude/agents/*.md`, and enforced by Claude Code. A role asking for tools outside its allowlist is a security event, not a feature request.

**Deep dive:**
- Threat model: `docs/security/threat-model.md`. Updated quarterly and on every new trust boundary.
- Security review process: any PR touching `packages/permission-system/`, `packages/skill-loader/`, `packages/mcp-broker/`, `packages/hooks-engine/`, `packages/team-mode/`, or the cloud auth layer requires `@security-verifier` review AND CTO sign-off.

---

## §9. Operations

**Summary:** Single-user, local-only operation. Mission-level cost tracking is mandatory; per-role cost tracking is mandatory; the dashboard surfaces both live. No paging, no on-call, no SLO — but if a mission's budget overrun hits 80%, the CTO gets an inbox item.

**Details:**
- **Deploy process:** Local-only. Signed Electron builds via GitHub Actions on tag.
- **Environments:** `dev` (per-developer scratch), nothing else. No staging, no prod (single user, single machine).
- **Log aggregation:** Local pino → file rotation in `~/.forge/logs/`. No remote aggregation by default.
- **Log format:** JSON structured with `correlation_id`, `mission_id`, `role`, `subagent_id`, `cost_usd_so_far`. Redaction config strips secrets.
- **Log retention:** 30 days local; mission transcripts kept for the project's full lifetime in `.claude/missions/<id>/transcript/` (committed only if you opt in per-mission).
- **Metrics:** Local Prometheus exporter (optional). Dashboard reads from the mission state files directly.
- **Required metrics for new endpoints / new roles:** latency p50/p95/p99, error rate, throughput, **tokens-in / tokens-out / dollar-cost / model-id** per call.
- **Alerting:** No PagerDuty. The CTO Inbox (§17) is the alerting surface. **Phase 2 adds Slack push** for `high`/`critical` Inbox items (see §19.3). High-severity self-healing events and budget threshold crossings also push.
- **Feature flags:** Local-only, in `~/.forge/flags.json`. Every flag has an owner + removal date in the comment.
- **Phase 2 reports (auto-generated):**
  - **Monthly payroll** at `.claude/reports/payroll-<YYYY-MM>.md` (1st of month; also pushed to Notion if configured). Per-role budget vs spend; ROI signal (deterministic, not editorial); cost per mission; flagged candidates for retirement.
  - **Dream cycle summary** at `.claude/dreams/<YYYY-MM-DD>.md` (every cycle). KG rebuild stats, embedding cache stats, proposals generated, anomalies observed.
  - **Per-mission meditation** at `.claude/meditations/<mission-id>/<role>.md` (every role, mission close). Schema-enforced; concrete metrics + cited observations + max 3 testable proposals.
  - **Weekly journal digest** at `.claude/digests/journal-week-<W>.md` (Friday-Saturday night, during dream mode).
  - **Skill-update proposals** at `.claude/learning/proposals/<date>/<topic>.md` (when continuous-learning detects drift). Tier 1-2 citations mandatory; never auto-applied.
  - **Grounded re-verification findings** to CTO Inbox; ledger-annotates the affected decisions with `evidence-drift-detected`.

**Deep dive:**
- Dashboards shipped day-one: per-project mission swimlanes, CTO inbox, decision ledger, knowledge-graph mini-viz, cost meter (global + per-mission + per-role).
- No SLO — single user. The closest thing is the 24-Hour Mode phase budgets (§17). Overrun those, CTO gets notified.

---

## §10. Performance

**Summary:** Indexer is the hardest constraint. **Team Mode adds:** knowledge graph rebuild <3s cold on 100k-file project, <200ms incremental on file save; mission spawn (all roles in parallel) <2s; CTO inbox render <100ms.

**Details:**
- **Latency targets:**
  - Tab completion: <200ms p50, <500ms p95
  - Inline edit (Cmd+K) first byte: <800ms p50
  - Composer first token: <2s p50
  - Indexer full re-index, 1M LOC TS+Java: <60s cold; <2s incremental on save
  - Symbol lookup query: <50ms p95
  - **Knowledge graph rebuild (cold, 100k files):** <3s
  - **Knowledge graph incremental update (on save):** <200ms
  - **Hybrid retrieval (BM25 + Voyage + reranker):** <300ms p95
  - **Mission spawn (12-role org, all idle):** <2s
  - **CTO Inbox render (100 items):** <100ms
  - Mission Control UI frame budget: 16ms during streaming
- **Throughput targets:**
  - Parallel agent runs on single dev machine: 4 concurrent worktree agents without UI degradation
  - Cross-LLM PR review round-trip: <60s p95 for diffs <2000 LOC
- **Resource limits:**
  - Editor RSS at idle, 500k-LOC project: <1GB
  - Editor RSS during 4-way parallel mission: <4GB
  - Native indexer mmap budget: 25% of available RAM, capped at 8GB
  - Knowledge graph + vector cache: capped at 2GB
- **Optimization policy:** Measure first. Every optimization PR ships with a benchmark showing the delta.
- **Known hot paths:**
  - Tree-sitter incremental parse on save
  - Symbol graph update on file change
  - Embedding generation (batch, off main thread, debounced)
  - Diff streaming render
  - Capability Graph similarity search (sub-10ms — called on every subagent spawn)
  - **Knowledge graph traversal (call-graph queries):** must remain sub-50ms even on 100k-node graphs
- **Profiling tools:** Chrome DevTools (renderer); clinic.js (main); `cargo flamegraph` + `samply` (Rust); `tracing-flame` (Rust async).
- **Load-test tooling:** k6 for any HTTP surface; custom harness `bench/` for editor perf; **`bench/mission/` for full-mission simulation** with transcript replay.

**Deep dive:**
- Required benchmarks (CI gates): indexer cold-index, indexer incremental, hybrid retrieval, capability graph lookup, **knowledge graph rebuild**, **full-mission walkthrough**.

---

## §11. Version control workflow

**Summary:** Trunk-based with short-lived feature branches; Conventional Commits; squash on merge; PRs require typecheck + lint + test + a relevant verifier subagent for any sensitive path; **PRs touching team-mode or org-chart.yaml require explicit CTO approval before merge**.

**Details:**
- **Branch model:** Trunk-based. `main` always shippable. Feature branches <5 days. Long-running work behind feature flags.
- **Branch naming:** `feat/<ticket>-<slug>`, `fix/<ticket>-<slug>`, `chore/<slug>`, `docs/<slug>`. Mission-generated branches: `mission/<mission-id>/<slice-name>`.
- **Commit message format:** Conventional Commits. Scopes include: `agent-runtime`, `skill-loader`, `indexer`, `team-mode`, `knowledge-graph`, `dashboard`, `inbox`, `ledger`, `org-chart`.
- **Squash / merge / rebase policy:** Rebase to keep current; squash on merge.
- **PR template / required sections:** Why, How to verify, Risks, Rollout. PRs touching sensitive paths (see §17) require a "Verifier subagent output" section. **PRs touching `org-chart.yaml` or any `packages/team-mode/**` file require a "Team Mode impact" section.**
- **Required reviewers:** 1 for `chore`/`docs`; CTO for anything in `packages/permission-system/`, `packages/skill-loader/`, `packages/mcp-broker/`, `packages/hooks-engine/`, `packages/team-mode/`, `native/indexer/`, `native/knowledge-graph/`, `cloud/`, or **any change to `org-chart.yaml`**.
- **Required CI checks:** lint, typecheck, test, build, security (npm audit + cargo audit + trufflehog), license-check, **mission-walkthrough test for any team-mode change**.
- **Force-push policy:** Feature branches yes (before review starts). Shared branches never.
- **Tag / release format:** SemVer. `v<MAJOR>.<MINOR>.<PATCH>`. Pre-releases: `v0.5.0-rc.1`.

**Deep dive:**
- Release cadence: every two weeks for the editor; continuous for mission-generated branches.
- **PR review uses Gemini, not Claude** — see §11.5 and §17. The `@pr-reviewer` role explicitly uses Gemini 2.5 Pro for cross-LLM verification.

---

## §11.5. PR review (Team Mode-specific)

**Summary:** PR review is performed by the `@pr-reviewer` role, which is structurally configured to use Gemini 2.5 Pro (not Claude). This is a cross-LLM verification policy, not a tunable.

**Details:**
- **Who:** the `@pr-reviewer` custom subagent (`.claude/agents/pr-reviewer.md`)
- **Model:** `gemini-2-5-pro` (locked by `org-chart.yaml` policy `pr-review-uses-gemini`)
- **Tools:** `Read`, `Grep`, `Glob` + `GeminiReview` (MCP) — read-only
- **Skills preloaded:** `critical-self-review`, `unbiased-development`, `production-readiness`
- **Input context to Gemini:**
  - Full PR diff
  - Mission brief (`MISSION_BRIEF.md` for this mission)
  - Prior verifier findings (Claude verifiers' output)
  - Cited decision-ledger entries
- **Output:** structured severity-tagged findings (`info` / `low` / `medium` / `high` / `critical`) plus a summary. Posted as a PR comment.
- **Blocking severities:** `high`, `critical`. Either blocks merge until CTO reviews.
- **Disagreement protocol:** When Gemini's findings disagree with Claude verifier output, the disagreement is surfaced explicitly to the CTO Inbox as a structured item showing both perspectives. The CTO decides; GPT-5 is available as a tie-breaker but is not routinely invoked.

**Why Gemini and not Claude:** different model lineage (DeepMind), different training data, different blind spots. Cross-LLM review catches what Claude missed. Feature flags get disabled when you're tired; structural enforcement (the `model:` field is `gemini-2-5-pro` and a YAML policy enforces it) holds.

---

## §12. Communication preferences

**Summary:** High pushback, medium verbosity, no praise filler, state confidence explicitly, confirm before irreversible actions. **Team Mode adds:** the orchestrator and every role must surface bad news immediately — `unbiased-development` is loaded by every role for this reason.

**Details:**
- **Pushback level:** High. Disagree when warranted; surface failures and risks clearly; hold ground when right; concede when wrong. Soften feedback to be useful, not to be polite.
- **Verbosity:** Medium. Earn every line. No filler, no restating the question.
- **Code-block expectations:** Inline for snippets <30 lines; artifact/file for longer.
- **Confirmation discipline:** Confirm before irreversible actions (force-push, file delete, db migration, infra apply, deploys). Do not over-confirm trivial edits.
- **Honesty about uncertainty:** State confidence levels when it matters. "I'm 80% sure" beats "I think." Don't bluff.
- **Praise / preamble policy:** No praise filler, no "great question", no AI-style preambles.
- **Inter-role tone:** Same. The orchestrator does not over-soften feedback to specialists; specialists do not over-soften findings to the orchestrator. Treat every artifact as a peer-engineering memo.

**Deep dive:**
- Phrases to avoid: "Certainly!", "I'd be happy to", "Let me know if you have any questions", "Hope this helps", "Feel free to".
- Framing preferred: lead with conclusion or disagreement; supporting detail follows.

---

## §13. Memory configuration

**Summary:** `.claude/memory/` per project, committed (team-shared / single-user-shared-across-machines). **Team Mode adds:** `decisions.md` (decision ledger), `.claude/missions/<id>/` for per-mission scratch, and `.forge/org-chart.yaml` for team configuration.

**Details:**
- **Memory location:** `.claude/memory/`
- **Files:**
  - `working.md` — short-term, current task scratchpad (gitignored)
  - `journal.md` — long-term episodic, dated record (committed)
  - `conventions.md` — semantic, distilled stable facts (committed)
  - `playbooks.md` — procedural, repeatable operations (committed)
  - `lessons.md` — post-mortems of failed agent runs / missions (committed)
  - `decisions.md` — **NEW (Team Mode):** the decision ledger. Append-only. Every decision made by any role during any mission is recorded here with timestamp, role, decision summary, why, evidence, citations. (Committed)
- **Mission directory (per-mission, transient):** `.claude/missions/<mission-id>/`
  - `context.md` — the mission brief, signed by CTO at H+0
  - `plan.md` — decomposed plan
  - `whiteboard.md` — shared scratch, all roles write structured sections
  - `team-delta.yaml` — **NEW (§18):** mission-scoped team modifications (added/dismissed/paused roles)
  - `artifacts/` — per-agent reports (one file per role per artifact)
  - `decisions.md` — mission-scoped decisions (merged to top-level `decisions.md` on mission close)
  - `transcript/<role>.jsonl` — per-role transcript stream
  - `dashboard.json` — live state for the Forge dashboard
  - `status.md` — human-readable summary
- **Team configuration (per-project):** `.forge/org-chart.yaml`
  - Single source of truth for roles
  - `forge org-chart sync` regenerates `.claude/agents/*.md`
  - Committed and PR-reviewable
- **Project config (per-project):** `.forge/config.yaml`
  - LLM provider routing, embedder choice, integration settings (GitHub repo, JIRA project key, Gemini enablement), budget caps
  - Committed
- **Integrations config:** `.forge/integrations.yaml`
  - MCP server registrations, JIRA hierarchy mapping, Gemini review prompt template, **Notion publish targets and cadence (§19.3), Slack channel mapping and notification thresholds (§19.3)**
  - Committed
- **Phase 2 operational configs (per-project, see §19):**
  - `.forge/payroll.yaml` — per-role monthly budgets + model assignments; alert thresholds; ROI review cadence
  - `.forge/schedule.yaml` — business hours, dream-mode window, maintenance windows, per-role schedule overrides; lifecycle policies
  - `.forge/self-healing.yaml` — eight failure modes with detection signals and recovery actions; max retry count
  - `.forge/learning.yaml` — Tier 1-2 source registry for continuous learning; cadence per source; proposal output path
  - `.forge/reverification.yaml` — daily/weekly/monthly grounded re-verification checks; thresholds
  - All Phase 2 configs are committed and PR-reviewable.
- **Commit memory to repo?** Yes (committed files above). `working.md` and `.claude/missions/` are gitignored by default; promote missions to committed via `--save-mission` flag at close time if you want the full transcript in repo history.
- **Curation cadence:** Per-mission close: `journal.md` and `decisions.md` get an entry. Per-PR: author updates `conventions.md` if a stable pattern emerged. Monthly: full review by you to prune stale entries and promote patterns.
- **Things explicitly excluded from memory:** secrets, credentials, customer PII, raw API keys, signed-skill private keys, OAuth refresh tokens. Mission transcripts are scrubbed by `pino`'s redaction config before commit.

**Deep dive:**
- `tradeoffs.md` is added when we hit two-way-door decisions that need durable rationale (e.g., "why Drizzle and not Prisma"). Lighter than ADRs.
- Decision ledger schema is in §14 (entry shape) and §15 (governance).
- **Knowledge graph rebuilds from these files + the filesystem on every project open.** No separate persistence — the durable files are the source of truth.

---

## §14. Domain context

**Summary:** The domain is multi-agent AI orchestration over a code editor. Core concepts: Skills, Subagents, Critic loop, Capability Graph, Worktree tiers, Hooks. **Team Mode adds:** Org Chart, Roles, Missions, Mission Brief, Decision Ledger, CTO Inbox, Knowledge Graph, Phase Budgets, 24-Hour Mode, Buddy Mode, Stand-up, Team Delta.

**Details:**
- **Core concepts (pre-existing):**
  - **Skill** — a `SKILL.md` file (with optional helper files) that teaches an agent a repeatable methodology. Model-invokable by default. Tier-loaded (system / workspace / user / org / marketplace).
  - **Subagent** — a Claude Agent SDK agent spawned by an orchestrator with its own context window, tool allowlist, and model choice.
  - **Critic loop** — implementer produces a diff; critic (separate subagent) reviews against type-check / test / lint / static analysis; failure loops back with structured feedback.
  - **Capability Graph** — semantic index over all registered tools. Per-subagent task embedding selects top-K relevant tools at spawn time.
  - **Worktree tier** — execution isolation level (Local → Worktree → Container → Cloud).
  - **Hooks** — lifecycle interceptors (13 points) that allow / block / modify / escalate.
  - **AAP (Agent Action Protocol)** — Forge's internal protocol for orchestrator ↔ subagent communication.

- **Team Mode concepts (new):**
  - **Org Chart** — the team's hierarchical structure, defined in `.forge/org-chart.yaml`. Roles, models, tools, skills, reporting lines.
  - **Role** — a stable specialization (e.g., `@architect`, `@impl-a`, `@security-verifier`). Each role is a Claude Code custom subagent in `.claude/agents/`. Roles are configuration, not code.
  - **Orchestrator** — the `@vp-engineering` role specifically. The only role with `Task` (subagent spawn) and `AskUserQuestion` tools. No editing tools. Decomposes goals, routes work, synthesizes outputs, escalates to CTO.
  - **Mission** — a single coordinated unit of work spanning planning → implementation → verification → release. Has a unique ID, a brief, a team, a budget, a clock. Lives in `.claude/missions/<mission-id>/`.
  - **Mission Brief** — the contract for a mission, signed by CTO at H+0. Defines problem, success criteria, out-of-scope, constraints, team assembled, phase budgets. Immutable except via CTO-approved scope changes.
  - **Decision Ledger** — append-only record of every decision made by any role during any mission. Schema: `{id, timestamp, mission_id, role, type, summary, why, alternatives_considered, evidence, citations, status, scope}`.
  - **CTO Inbox** — the queue of items awaiting CTO decision. Sorted by leverage (impact × time-sensitivity). Schema in `FORGE_TEAM_MODE.md` §12.
  - **Knowledge Graph** — typed entity-relationship view of the project: files, symbols, decisions, tickets, PRs, conventions, missions, findings. Edges: contains, defines, references, depends_on, decided_by, supersedes, blocks. In-memory (petgraph), rebuilt on project open.
  - **Hybrid Retrieval** — BM25 (tantivy) + Voyage 3-Large + cross-encoder reranker + diversity constraint + graph expansion. The function every role calls when it needs context.
  - **Phase Budget** — wall-time budget per mission phase (research, plan, implementation, verification, etc.). Overruns escalate per a precedence-ordered scope-cut list.
  - **24-Hour Mode** — explicit mission mode with H+N timestamps and hard phase budgets. End-to-end software in a calendar day.
  - **Standard Mode** — the default. The engineering-excellence loop calibrated to task size. Buddy wraps it; verifiers fan out per §17 thresholds.
  - **Buddy Mode** — a feature/mode that wraps the engineering loop with Phase A (intake) and Phase B (debrief). Event-anchored. Not a continuous critic.
  - **Stand-up** — a rate-limited (every 15 min max) emission where every active role produces a one-line status. Aggregated in the dashboard.
  - **Team Delta** — mission-scoped modifications to the team (added or dismissed roles for this mission only). Lives in `.claude/missions/<id>/team-delta.yaml`. Does not modify `org-chart.yaml` unless promoted.

- **Team Operations concepts (Phase 2; see §19 and `FORGE_TEAM_OPERATIONS.md`):**
  - **Payroll** — cost-as-salary framing. Each role has a monthly budget tied to its model assignment. Monthly report auto-generated; ROI signal (high/medium/low/unclear) computed deterministically from utilization data. Configured in `.forge/payroll.yaml`.
  - **Work Schedule** — when the team is on duty. Default business hours only; 24-Hour Mode overrides on CTO explicit accept. Dream-mode window; maintenance windows; per-role schedule overrides. Configured in `.forge/schedule.yaml`.
  - **Role Lifecycle States** — `active`, `paused`, `on-leave`, `retired`, `dreaming`, `consulting`. Pause = minutes-hours; Leave = days-weeks with auto-resume date.
  - **Self-Healing** — automatic recovery from eight defined infrastructure failure modes (mission crash, KG corruption, cost runaway, verifier finding storm, stuck role, MCP failure, model outage, worktree conflict). Each has a detection signal and a prescribed recovery action. Max 3 retries; then escalate. Never silent — every healing action logged to journal with `[self-healing]` prefix. Does NOT fix logic bugs; that's the implementer's job.
  - **Continuous Learning** — scheduled Tier 1-2 source crawls during dream mode. Produces `skill-update proposals`, never auto-applied. Tier 3-4 sources are signal-only. Configured in `.forge/learning.yaml`.
  - **Dream Mode** — scheduled off-hours batch processing. Concrete operations only (KG rebuild, embedding pre-warm, journal digest, ledger compaction, continuous-learning crawl, SME knowledge refresh, grounded re-verification, post-mortems on failed missions). Forbidden from editing source code, pushing to git, or deploying. Default window 02:00-06:00.
  - **Meditation** — event-anchored structured per-role reflection at mission boundaries. Strict schema (concrete metrics + cited observations + max 3 testable proposals + "what I'm NOT going to do"). NOT free-form introspection — the schema is the safeguard against reflection poisoning. Per-mission close OR weekly review.
  - **Grounded Re-verification** — periodic deterministic regression and decision-drift detection. Daily test re-runs on production-critical paths + audits; weekly decision-drift + perf regression + convention adherence; monthly skill-citation re-checks. Surfaces findings; never auto-rolls back. Configured in `.forge/reverification.yaml`.
  - **SME Network** — a separate role tier (knowledge tier) of subject matter experts that crawl Tier 1-2 sources in their domain and respond to consultations via `forge.sme.consult()`. Five SMEs for this stack: `@sme-java-spring`, `@sme-typescript-frontend`, `@sme-mongodb-firestore`, `@sme-aws-cloud`, `@sme-voice-ai`. Sleeping by default; idle 90% of the time. Read-only by tool allowlist. Tier 1-2 citations mandatory on every response.

- **Critical business rules:**
  - **Single user. You are the CTO.** Approval gates respect this — there's exactly one human in the loop.
  - **Async file-based coordination only.** No synchronous agent-to-agent RPC. Agents read and write to mission directory files.
  - **The orchestrator has no editing tools.** Structurally enforced via `tools:` allowlist.
  - **PR review uses Gemini.** Structurally enforced via `model:` field on `@pr-reviewer`.
  - **No telemetry without opt-in.**
  - **Buddy does not run continuously.** Two events only: mission intake (Phase A), mission close (Phase B).
  - **Cost discipline is a quality of the system, not a feature.** Every role reports cost; per-mission budgets are enforced; 80% triggers CTO inbox.
  - **(Phase 2) Continuous-learning proposals are never auto-applied.** CTO-approved, always. Tier 3-4 sources are signal-only.
  - **(Phase 2) Dream mode cannot edit source code.** Tool allowlist enforces; writes only to `.claude/**`.
  - **(Phase 2) Meditation is event-anchored and schema-bound.** No continuous self-critique. Concrete metrics + cited observations + max 3 testable proposals.
  - **(Phase 2) Self-healing addresses infrastructure failures, not logic bugs.** Eight defined modes; max 3 retries; always logged.
  - **(Phase 2) SMEs don't write code, don't make decisions, don't participate in missions.** They inform via consultation only. Tier 1-2 citations mandatory.

- **External constraints:**
  - Code-OSS is MIT but Microsoft's brand assets are not — strip on every upstream merge.
  - Model provider TOS apply to redistributed prompts; we don't redistribute user prompts.

- **Common misunderstandings:**
  - "Stand-up is a chat" — no, it's a rate-limited status emission, structured, written to dashboard.json.
  - "The orchestrator does the work" — no, it delegates. It has no editing tools.
  - "PR review can use any model" — no, it's locked to Gemini by org-chart policy. Cross-LLM verification is structural.
  - "Buddy watches the loop" — no, buddy runs at two events. The loop is watched by ground-truth gates (tests, lint, type-check, scenario), not by AI.
  - "All decisions go to the CTO Inbox" — no. The Inbox is for gates (§17 list). Routine decisions are recorded in the ledger and proceed without your approval.
  - **(Phase 2) "Dream mode means the agents reflect on the day"** — no, dream mode produces concrete artifacts (KG rebuild, proposals, digests). Free-form reflection is forbidden.
  - **(Phase 2) "Meditation is the agent thinking about its work"** — no, meditation is schema-bound structured analysis with citations. "I felt rushed" is forbidden; "I had 18 min per slice avg vs 60 budgeted" is required.
  - **(Phase 2) "Self-healing fixes bugs"** — no, it fixes infrastructure failures (crashes, corruption, outages). Logic bugs are the implementer's job.
  - **(Phase 2) "Continuous learning means the system upgrades itself"** — no, it produces proposals. Every change is CTO-approved.
  - **(Phase 2) "SMEs participate in missions"** — no, they're consulted. They sleep most of the time.

**Deep dive:**
- Glossary lives at `docs/glossary.md`. Add a term any time a new concept is introduced in code.
- The full Team Mode model is documented in `FORGE_TEAM_MODE.md` (1,479 lines). This file (§14) is the operational summary; that file is the rationale.

---

## §15. Project-specific overrides

**Summary:** Overrides versus universal skill defaults, including Team Mode-specific overrides.

**Details:**

**Pre-existing overrides:**
- `right-sized-engineering §rule-of-three: override to rule-of-four for skill API abstractions.` Plugin authors are downstream consumers; premature abstraction in the skill SDK locks them in.
- `engineering-excellence §multi-agent: override the 3-files threshold to 2-files for any change touching the agent runtime, permission system, skill loader, MCP broker, hooks engine, or indexer.` We are the dogfood.
- `unbiased-development §language-default: override to "TypeScript or Rust only in the editor process."` Python is supported as an optional skill execution sandbox, run out-of-process.

**Team Mode overrides (new):**
- `engineering-excellence §multi-agent: when Team Mode is active and a mission is in flight, use the mission's assigned team rather than spawning ad-hoc verifier subagents.` The mission already has @security-verifier, @tests-verifier, @reliability-verifier, @performance-verifier as roles; spawning ad-hoc duplicates would burn budget for no quality gain.
- `prompt-buddy §triggers: when Team Mode is active, the buddy runs once per mission (not per-prompt).` The CTO interacts with the orchestrator; the orchestrator interacts with specialists; buddy intake happens once at mission acceptance. Re-running buddy on every prompt within a mission produces fatigue and adds no signal.
- `project-memory §write-cadence: every mission close writes journal + decision-ledger entries. Skipping is an error.` In Standard Mode the cadence is per-feature; in Team Mode it's per-mission, mandatory.
- `unbiased-development §applies-to: every role loads this skill.` Every transcript stream should be reviewable as honest engineering communication, not as politeness theater.
- `verify-rigorously §parallel-by-concern: in Team Mode 24-Hour missions, verifier fan-out is mandatory regardless of file count.` The 24-hour cadence means we can't afford post-hoc verification discovery.
- `version-control-craft §commits-per-slice: 1 commit per slice, not 1 per change.` Each impl agent commits when their slice's tests pass. Mission-level squash on merge happens at the PR stage.

**Team Operations overrides (Phase 2; see §19 and `FORGE_TEAM_OPERATIONS.md`):**
- `research-first §source-tiers: enforced absolutely by continuous-learning.` Tier 1 (official docs) and Tier 2 (major-team blogs) auto-trusted for crawling. Tier 3 (reputable engineers) manual curation only. Tier 4 (HN/Reddit/Twitter) signal-only, never auto-trusted. Every skill-update proposal must cite at least one Tier 1-2 source.
- `prompt-buddy §reflection-discipline: dream mode and meditation must be event-anchored and ground-truth-anchored.` The 2024-2025 LLM self-correction research (Self-Refine, CRITIC, Reflexion, Reflector) is the rationale. Continuous self-critique is forbidden; structured artifact-producing operations are required.
- `engineering-excellence §observability: every healing action logged to journal with `[self-healing]` prefix.` Silent healing is forbidden; the audit floor is always visible. Max 3 retries per failure type, then escalate.
- `right-sized-engineering §rule-of-N: meditation produces max 3 proposals per role per mission.` More than 3 proposals = wish-list drift. Pick the most testable.
- `unbiased-development §applies-to: SMEs answer only with Tier 1-2 citations.` SMEs must cite at least one Tier 1 source for `confidence: high` responses. No "I think" responses from SMEs.
- `production-readiness §quality-gates: grounded re-verification runs daily on §17.5 production-critical paths.` New regressions emit CTO Inbox items; never auto-rolled back. Decision drift annotates decisions with `evidence-drift-detected`; never rewrites entries.

**Open overrides being considered:**
- Should `right-sized-engineering` carry a Team Mode-specific override that downgrades the rule-of-N for *internal-only* code? Argument for: this is private code, premature abstraction is cheap to refactor. Argument against: the project will grow; refactoring is never as cheap as not abstracting. Default: no override.

---

## §16. Claude Code integration

**Summary:** We use Claude Code to operate Team Mode. Plan mode default for the orchestrator only; Sonnet for most roles; Opus for orchestrator and architect; **Gemini for PR review (via MCP adapter)**. **31 skills total**: the 16 from engineering-excellence-v6 + 7 Team Mode (Phase 1) skills + 8 Team Operations (Phase 2) skills. SME tier adds 5 additional knowledge-tier roles.

**Details:**

### Settings (apply via Config tool or settings.json)
- **`permissions.defaultMode`:** `plan` — for the orchestrator (@vp-engineering). The orchestrator must plan before delegating. Other roles operate in `acceptEdits` mode for in-worktree work and `default` (ask before destructive action) otherwise.
- **`model`:** see the role-model matrix in `FORGE_TEAM_MODE.md` §11. Summary: Opus for @vp-engineering, @architect, @data-engineer. Sonnet for everything else except @pr-reviewer (Gemini 2.5 Pro). Best-of-N tournaments may run @impl-c on Opus or GPT-5.4 for cross-model diversity.
- **`verbose`:** `true`

### Tool preferences
- **Use `LSP` over `Grep` for code relationships.** `findReferences`, `goToDefinition`, `incomingCalls`, `outgoingCalls` are semantic.
- **Use `Glob` over `Bash(find ...)`.**
- **Use `Edit` over `Bash(sed ...)`.** Edit enforces a prior `Read`.
- **Use `EnterPlanMode` for any non-trivial change.** The orchestrator always plans.
- **Use `Agent` (subagent) / `Task` only via the orchestrator.** Specialist roles do not spawn further subagents. This keeps the org chart flat at two levels (orchestrator + specialists).
- **Use `forge.knowledge.query()` over ad-hoc Read/Grep when seeking context.** Every role has this tool. The hybrid retrieval (BM25 + Voyage + reranker + graph expansion) produces better context than ad-hoc file reads.

### Skills directory
- **Path:** `.claude/skills/`
- **Skills loaded for this project (31 total):**
  - **16 from engineering-excellence-v6:** `engineering-excellence`, `unbiased-development`, `right-sized-engineering`, `prompt-buddy`, `project-memory`, `research-first`, `plan-then-execute`, `surgical-edits`, `testing-discipline`, `documentation-discipline`, `version-control-craft`, `verify-rigorously`, `critical-self-review`, `production-readiness`, `debug-systematically`, `repo-safety-net`
  - **7 for Team Mode (Phase 1):** `mission-brief`, `org-chart`, `stand-up`, `knowledge-graph`, `decision-ledger`, `cto-inbox`, `team-modifications` (the §18 skill)
  - **8 for Team Operations (Phase 2; see §19):** `payroll`, `work-schedule`, `self-healing`, `continuous-learning`, `dream-mode`, `meditation`, `grounded-reverification`, `sme-network`
- **Bundle:** Phase 1 + Phase 2 skills ship as `forge-skills-extension.zip` (15 SKILL.md files + README); installed at `.claude/skills/`.
- **Project-specific skill location** (Forge-specific patterns not in the bundles): `.claude/skills/forge/`

### Agents directory
- **Path:** `.claude/agents/`
- **Source:** `.forge/org-chart.yaml` (single source of truth)
- **Generation:** `forge org-chart sync` reads YAML, emits `.md` files. Run on every `org-chart.yaml` change. CI verifies they're in sync.
- **The roster (12 standing roles + 5 SMEs = 17 total):** 12 standing in `FORGE_TEAM_MODE.md` §5; 5 SMEs (`@sme-java-spring`, `@sme-typescript-frontend`, `@sme-mongodb-firestore`, `@sme-aws-cloud`, `@sme-voice-ai`) in `FORGE_TEAM_OPERATIONS.md` §10. SMEs idle 90% of the time; consulted via `forge.sme.consult()`.

### CLAUDE.md
- **Path:** `CLAUDE.md` at repo root + per-package `CLAUDE.md` files for `packages/permission-system/`, `packages/skill-loader/`, `packages/mcp-broker/`, `packages/hooks-engine/`, `packages/capability-graph/`, `packages/team-mode/`, `native/indexer/`, `native/knowledge-graph/`.
- **Compact instructions:** yes. When context fills, summarize by package; preserve engineering-context.md, the active mission brief, the most recent two ADRs, the active permission policy.
- **Don't-do list:** yes. Top-level CLAUDE.md includes: don't disable failing tests; don't add deps without CTO approval; don't bypass the permission system in tests by mocking it (test through it); don't grant a role tools outside its allowlist; don't modify `org-chart.yaml` without a PR.

### Memory configuration
- **Project memory directory:** `<repo>/.claude/memory/` (per-repo, committed) — see §13.
- **Mission directories:** `<repo>/.claude/missions/<mission-id>/` (per-mission, gitignored by default).
- **Claude Code SessionMemory:** `~/.claude/session-memory/` (per-user, auto-extracted) — complementary.
- **MagicDocs auto-doc files:** not used.

### MCP servers
- **Configured MCP servers:**
  - `github-mcp-server` (GitHub: issues, PRs, branches, commits, releases)
  - `atlassian-mcp` (JIRA: epics, stories, tasks, sprints)
  - `gemini-review-mcp` (custom adapter; routes @pr-reviewer's PR review to Gemini 2.5 Pro)
  - **`notion-mcp-server`** (Notion: human-readable publishing — ledger, journal, conventions, mission reports, payroll reports. Configured via `.forge/integrations.yaml` `notion:` block. See §19.3 for publish targets and cadence.)
  - **`@modelcontextprotocol/server-slack`** (Slack: high-severity CTO Inbox alerts + slash commands like `/forge approve <id>` from your phone. Configured via `.forge/integrations.yaml` `slack:` block. Quiet hours respected by default.)
  - Postgres read-only (dev env only, for any data-engineer work)
  - Internal docs MCP server (sourced from `/docs/`)
- **MCP tool preference policy:** prefer dedicated MCP tools over Bash/WebFetch when available. If a workflow is awkward through MCP, that's a Forge bug — file it.

### Tools to NOT use in this project
- `Sleep` (use `run_in_background` instead)
- `cat`, `sed`, `find`, `grep` via Bash when dedicated tools work (`Read`, `Edit`, `Glob`, LSP)
- Any unsigned, unverified skill from outside the 31 skills listed above (16 engineering-excellence-v6 + 7 Team Mode + 8 Team Operations)
- Production database access in any tier (no exceptions; use read-only replicas)
- **Spawning a Claude agent for PR review when the role exists.** Use `@pr-reviewer` (Gemini), not an ad-hoc Claude subagent.
- **Auto-applying skill-update proposals.** Continuous-learning produces proposals; the CTO approves. See §19.2.
- **Source-code edits from dream mode.** Forbidden by tool allowlist; dream-mode roles can only write to `.claude/**`. See §19.5.
- **Free-form meditation prose.** The meditation schema is enforced; free-form text outside designated sections is rejected. See §19.6.

**Deep dive:**
- Custom slash commands: TBD; populate as we build them.
- Hooks configured in `.forge/hooks/`:
  - `pre-commit`: `pnpm check`
  - `pre-pr`: `pnpm test:ci`
  - `post-diff-apply on **/*.{ts,tsx}`: `prettier --write` + `tsc --noEmit` on the changed file's package
  - `post-diff-apply on native/**/*.rs`: `cargo fmt` + `cargo check`
  - `pre-tool on Bash`: block `rm -rf`, `force-push origin main`, `kubectl apply --context prod`
  - `pre-tool on Edit|Write to org-chart.yaml`: require CTO approval inline (not just at commit time)
  - `pre-tool on Edit|Write to .forge/*.yaml`: require CTO approval inline for `payroll.yaml`, `schedule.yaml`, `learning.yaml`, `self-healing.yaml`, `reverification.yaml`, `integrations.yaml`
  - `pre-tool on Write outside .claude/` for roles loading `dream-mode` skill: block (dream mode is `.claude/**` write only)
  - `cost-threshold $5`: pause + confirm
  - `mission-budget 80%`: emit CTO Inbox item (severity high)
  - **`payroll-threshold 80%`:** emit CTO Inbox item (severity high) + Slack push (Phase 2)
  - **`schedule-boundary off-hours`:** refuse new mission acceptance unless 24-Hour Mode override is explicit (Phase 2)
  - **`dream-mode-window-start`:** signal `dream-mode` skill to begin scheduled operations (Phase 2)
  - **`self-healing-event`:** append `[self-healing]` journal entry; Slack push if `critical` (Phase 2)
  - `session-start`: inject `git log --oneline -10`, current branch, top 5 open missions, top 3 CTO Inbox items

---

## §17. Multi-agent coordination

**Summary:** Forge operates two coordination patterns simultaneously: (a) Standard-Mode parallel-by-concern verification for ad-hoc fan-outs, and (b) Team Mode for hierarchical org-chart-driven missions. Both share the mission directory pattern and ground-truth gates. **Team Mode is the default operating model for any work non-trivial enough to need more than one agent.**

**Details:**

### When Team Mode applies (the default)

Use Team Mode for:
- Any new feature spanning >1 file
- Any change touching §17.5 sensitive surfaces (below)
- Any database migration or schema change
- Any work the CTO labels as a "mission"
- Any 24-Hour Mode mission (always Team Mode)
- Any work where verification across multiple concerns is needed

Use Standard Mode for:
- Single-line fixes
- Conversational questions
- One-shot CLI tasks ("rename this variable across the repo")
- Small refactors confined to a single file
- Drafting docs / writing tests for existing code without changing the code

The orchestrator (@vp-engineering, in Team Mode) decides which mode applies and confirms with the CTO at mission acceptance.

### Team Mode coordination protocol

**Orchestrator (`@vp-engineering`):**
1. Reads the mission brief (`MISSION_BRIEF.md`).
2. Decomposes into a DAG of slices (8-16 for a 24h mission; 1-4 for a small Standard-Mode mission).
3. Routes each slice to the right specialist by reading Agent Cards.
4. Polls the mission directory's `whiteboard.md` every 30s for questions / status / blocks.
5. Synthesizes specialist outputs into the mission's `status.md`.
6. Escalates to CTO via the Inbox at every §12 gate from `FORGE_TEAM_MODE.md`.
7. Closes the mission via buddy Phase B; writes journal + decisions; cleans up mission directory if not `--save-mission`.

**Specialist roles (everything else):**
1. Read `mission/context.md` and `mission/whiteboard.md` first.
2. Stay in assigned scope. Other roles cover other concerns.
3. Save findings to `mission/artifacts/<role>_findings.md` (structured per worker template).
4. Add a one-paragraph summary to `mission/whiteboard.md` under your section.
5. Mark complete only after both files saved.
6. Don't edit code unless the brief explicitly assigns implementation. Audit roles (verifiers, pr-reviewer) report only.

### Coordinator and worker rules (preserved from engineering-excellence v6)

**Coordinator (orchestrator only):**
1. Don't peek mid-flight. No reading specialist output streams mid-run. Wait for completion.
2. Don't predict. If asked "what did @security-verifier find?" — say "still running" if not yet complete.
3. Synthesize from artifacts only.
4. **Aggregate, don't average.** One Critical from one verifier outranks zero findings from three.
5. Resume individual specialists (not respawn) when one needs deeper investigation.

**Specialist:**
1. Read `mission/context.md` and `whiteboard.md` first.
2. Stay in scope.
3. Save findings to `artifacts/<role>_findings.md`.
4. Add summary to `whiteboard.md`.
5. Mark complete after both saved.
6. Don't edit code unless assigned.

### §17.5 — Production-critical paths (Team Mode operating)

Any change to these paths triggers automatic verifier fan-out, even on a routine slice:

- `packages/permission-system/` — security-critical, every tool call passes through here
- `packages/skill-loader/` — security-critical, loads code from disk and marketplace
- `packages/mcp-broker/` — security-critical, brokers untrusted tool calls
- `packages/hooks-engine/` — security-critical, executes user-defined commands
- `packages/capability-graph/` — correctness-critical, wrong tool selection breaks every agent
- `packages/agent-runtime/src/orchestrator/` — every user affected by changes here
- `packages/team-mode/orchestrator/` — Team Mode coordinator
- `packages/team-mode/missions/` — mission lifecycle
- `packages/llm-router/` — multi-LLM routing; PR review goes through here
- `native/indexer/` — perf-critical, errors here can corrupt the index
- `native/knowledge-graph/` — same; corruption affects all retrieval
- `cloud/src/auth/` (if cloud exists) — multi-tenant boundary
- `.forge/org-chart.yaml` — team structure; ANY change requires CTO approval before PR opens (not at merge time)

### Triggers for ad-hoc Standard-Mode parallel verification

For Standard Mode work (when Team Mode is not active), the v6 thresholds apply:

- Change touches **2+ files** AND any sensitive surface above.
- Any **schema change** in `cloud/`.
- Any change to `.forge/policy.yaml`, hook definitions, or skill manifest schema.
- Any change to agent runtime tool registration, permission flow, or sandbox boundary.
- The CTO explicitly requests independent review.

### Concern split (preserved from v6)

- **Default workers (2, escalate to 4 on findings):** security, reliability.
- **Add when applicable:** performance (DB / hot-path), tests (logic change), data-integrity (migrations), backward-compat (public APIs), accessibility (UI changes).

In Team Mode, the full quartet (security, performance, reliability, tests) runs by default for any 24-Hour Mode mission. The 2-then-escalate pattern is reserved for Standard Mode.

### Mission directory

- **Location:** `.claude/missions/<mission-id>/`
- **Hard cap on parallel specialists:** 6 (the org chart has 12 roles total; not all run concurrently — typically 4 implementers + 3 verifiers max)
- **Default cap:** 4 concurrent
- **Retention:** purge after merge or 30 days, unless `--save-mission` was set
- **Gitignore:** `.claude/missions/` is gitignored by default. The decision ledger entries from each mission *are* committed (they're in top-level `decisions.md`).

### When NOT to parallelize

Trivial changes, sequential-dependent work, conversational answers, single-concern changes, single-file edits outside production-critical paths. The orchestrator (in Team Mode) or the engineering-excellence loop (in Standard Mode) judges this. When in doubt: ask the CTO.

### Pre-built custom subagents (v6+)

From engineering-excellence-v6, installed at `.claude/agents/`:
- `@security-verifier` — preloads `production-readiness, unbiased-development`. Read-only.
- `@performance-verifier` — preloads same. With bash for query-plan + `cargo bench`.
- `@reliability-verifier` — preloads same. Read-only.
- `@tests-verifier` — preloads `testing-discipline, verify-rigorously, unbiased-development`.

In Team Mode, these roles are part of the standing org chart. In Standard Mode, they're spawned ad-hoc when §17 triggers fire.

### Sandbox configuration

Sandbox enabled for this project — we handle agent code that itself shells out:

```json
"sandbox": {
  "enabled": true,
  "autoAllowBashIfSandboxed": false,
  "network": { "allowUnixSockets": [] }
}
```

Legitimate dev workflows requiring network (real MCP server integration tests) run outside the sandbox via an explicit opt-out flag; see `docs/runbooks/sandbox-opt-out.md`.

---

## §18. Conversational team management

**Summary:** The CTO can add, remove, duplicate, pause, resume, or reconfigure roles by talking to `@vp-engineering` in natural language. Modifications default to mission-scoped (don't pollute `org-chart.yaml`); promoting to permanent is opt-in and goes through a PR. Every modification is recorded in the decision ledger.

**Why this feature exists.** Editing `org-chart.yaml` mid-mission is the wrong friction level. Real engineering management is conversational: "we need another frontend person on this," "let's pull the data engineer off — we don't need them," "switch the implementer on the gnarly slice to Opus." Forge should support that register.

**Why it's scoped carefully.** Without scoping, every one-off "add a Rust specialist for this MVP" would permanently bloat the org chart. Without an audit trail, six months later you can't reconstruct why a team had a `@migrations-specialist`. Without budget enforcement, a single "spin up four more implementers" tanks the mission economics.

### The skill — `team-modifications` (Skill 23)

A new skill in `.claude/skills/team-modifications/SKILL.md`. Loaded by `@vp-engineering` only.

**Triggers:**
- A CTO message containing role-modification verbs ("spin up", "add", "dismiss", "remove", "pause", "resume", "switch", "swap to", "promote", "duplicate") addressed to `@vp-eng` or `@vp-engineering`.
- `@vp-engineering` proactively identifying a role gap during planning ("this mission would benefit from X — want me to spin one up?").
- Mission state hitting a configured trigger (e.g., "implementation phase is 2x over budget" → propose dropping non-critical verifier).

**Hard skip:**
- Trivial completion-context messages ("yes" / "no" / "approved")
- CTO messages not directed at `@vp-engineering`
- Mid-verifier-run modifications to verifier roles (verifier-stopping mid-run loses state; require explicit confirmation)

### Operations

| Operation | What it does | Default scope | Approval |
|---|---|---|---|
| **ADD_ROLE** | Instantiate a new role, optionally based on a template | mission-scoped | auto if existing role-type + within budget; CTO if new role-type or budget impact >20% |
| **DUPLICATE_ROLE** | Spin up another instance of an existing role (e.g., `@impl-a` → `@impl-a-2`) for parallel work | mission-scoped | auto if within budget; CTO if over budget |
| **REMOVE_ROLE** | Dismiss a role, recover their pending work, reassign to siblings or queue back to orchestrator | mission-scoped | auto if role has no pending work; CTO confirmation if pending work exists |
| **PAUSE_ROLE** | Stop a role's runs but keep state; resumable | mission-scoped | auto (always cheap to reverse) |
| **RESUME_ROLE** | Restart a paused role | mission-scoped | auto |
| **RECONFIGURE_ROLE** | Change model, skills, tools, or maxTurns of a role mid-mission | mission-scoped | auto if within tier (Sonnet ↔ Sonnet); CTO if cross-tier (Sonnet ↔ Opus) or tool-change |
| **PROPOSE_NEW_ROLE** | VP suggests a role type the team doesn't have; CTO approves/rejects | n/a — proposal | CTO always |
| **PROMOTE_TO_PERSISTENT** | Take a mission-scoped role-add and write it to `org-chart.yaml` | persistent (PR) | CTO always; PR is opened, not committed directly |

### State management

- **Mission-scoped changes** live in `.claude/missions/<mission-id>/team-delta.yaml`:
  ```yaml
  # team-delta.yaml — modifications to the base org chart for this mission only
  mission_id: skill-loader-refactor
  base_org_chart_version: v1
  additions:
    - id: stylist-2
      template: stylist
      reason: "Additional frontend capacity for the admin UI slice"
      proposed_by: cto
      approved_at: 2026-05-16T14:23:01Z
      budget_impact_usd: 2.40
  removals:
    - id: data-engineer
      reason: "All in-memory, no DB work this mission"
      proposed_by: cto
      approved_at: 2026-05-16T11:02:00Z
      pending_work: []
  reconfigurations:
    - id: impl-c
      change: model
      from: claude-sonnet-4-6
      to: claude-opus-4-7
      reason: "Slice-7 is unusually complex — JWT verification path"
      proposed_by: vp-engineering
      approved_at: 2026-05-16T13:14:23Z
      budget_impact_usd: 3.80
  ```
- **Persistent changes** modify `.forge/org-chart.yaml` and generate a PR. The PR goes through normal review including the `@pr-reviewer` (Gemini) review.
- All changes are logged in the mission's `decisions.md` and aggregated into the project's top-level `decisions.md` at mission close.

### Constraints

**CTO approval required for:**
- Any persistent change to `org-chart.yaml`
- Adding a new role-type not in the template library (e.g., a `@migrations-specialist` if none exists)
- Budget impact >20% of mission budget
- Removing a verifier mid-verification phase
- Switching the orchestrator's model (the orchestrator is special; changing its model mid-mission is risky)

**Auto-approved (with CTO notification in the dashboard, not Inbox):**
- Adding duplicates of existing role-types for parallel work (within budget)
- Switching models within tier (Sonnet ↔ Sonnet variants)
- Pause / resume operations
- Mission-scoped removals when no work is pending for that role

**Forbidden (cannot be done at all):**
- Removing the orchestrator (`@vp-engineering`)
- Removing all verifiers from a 24-Hour Mode mission (the precedence-ordered scope-cut list in `FORGE_TEAM_MODE.md` §7 handles partial reduction, but at least one of {tests, security} must remain)
- Granting a role tools outside the role's template allowlist
- Adding a role with `tools` not in the project-allowed tool registry (no on-the-fly tool definitions)

### Discovery: when `@vp-engineering` proposes a role addition

The orchestrator monitors the mission for signals that the team is mis-shaped:

- **Workload signal:** an implementer is running over the slice's wall-time budget by 40%+ and the remaining slices include similar work. → Propose: "spin up another implementer."
- **Specialty signal:** a slice involves a domain not in the current team's skill mix (e.g., migrations, ML, mobile). → Propose: "add a specialist for X."
- **Bottleneck signal:** a verifier's queue has grown to 3+ unverified slices. → Propose: "duplicate the verifier for parallel processing."
- **Under-utilization signal:** a role has been idle for 2+ phase budgets. → Propose: "dismiss the idle role to save budget."

Proposals appear in the dashboard's CTO Inbox with the same structure as any other inbox item: severity (typically `medium`), proposer (`@vp-engineering`), evidence (workload data, queue length, idle duration), recommendation, decision options (`approve`, `reject`, `defer`).

### Examples

**Example A — CTO-initiated mission-scoped addition:**

```
You:    @vp-eng, this is going to need a lot of frontend work. Spin up
        another stylist.

@vp-eng: Confirming team modification for mission skill-loader-refactor:
         ADD_ROLE
           Template: stylist
           ID: stylist-2
           Model: claude-sonnet-4-6 (matches @stylist base)
           Tools: Read, Edit, Write, Bash, Grep, Glob, LSP (matches @stylist)
           Scope: mission-scoped (won't modify org-chart.yaml)
           Budget impact: +$2.40 estimated (5% of mission budget)
         Auto-approval applies (existing role-type + within 20% threshold).
         Confirm to proceed?

You:    Yes

@vp-eng: Done. @stylist-2 is in the team. Assigning slice-9 (admin UI panel).
         Decision logged: decisions.md#dec-2026-05-16-007
```

**Example B — CTO-initiated removal:**

```
You:    @vp-eng, we don't need the data-engineer for this. Everything's
        in-memory.

@vp-eng: Acknowledged. Dismissing @data-engineer from mission
         skill-loader-refactor.
         Recovering pending work: none (data-engineer hadn't started).
         Auto-approval applies (no pending work).
         Slot freed. Logged: decisions.md#dec-2026-05-16-008
```

**Example C — Orchestrator-proposed addition (discovery):**

```
@vp-eng: PROPOSAL — CTO Inbox item created

         Severity: medium
         Type: role_addition_proposed
         Mission: skill-loader-refactor (H+8:14)

         Observation: slice-7 (JWT verification) involves cryptography
         patterns my current implementers haven't engaged with this mission.
         @impl-a is 35min into slice-7 and the diff hasn't compiled.

         Proposal: spin up @crypto-specialist for this mission only.
         - Template: based on @impl-a, with skills addition:
           `production-readiness/cryptography` (extension skill)
         - Model: claude-opus-4-7 (cryptography is high-stakes)
         - Estimated budget impact: +$4.20 (8% of mission budget)
         - Scope: mission-only (not promoting to org-chart.yaml)

         Decision options:
         - Approve   → @crypto-specialist spawned, slice-7 reassigned
         - Reject    → @impl-a continues; consider re-prompting with
                       more cryptography context
         - Take over → CTO writes the slice manually

You:    Approve

@vp-eng: Done. @crypto-specialist spawned. Slice-7 reassigned.
         @impl-a returns to slice-3 queue.
         Decision logged: decisions.md#dec-2026-05-16-014
         Original-slice handoff transcript: artifacts/handoff-slice-7.md
```

**Example D — Promoting to persistent (org-chart.yaml change):**

```
You:    @vp-eng, the @crypto-specialist worked out. Make it a permanent role.

@vp-eng: This would modify the org chart permanently. Persistent changes
         go through a PR.

         Generated org-chart-delta:
         ```yaml
         + - id: crypto-specialist
         +   title: Cryptography Specialist
         +   tier: build
         +   reports_to: vp-engineering
         +   model: claude-opus-4-7
         +   tools: [Read, Edit, Write, Bash, Grep, Glob, LSP]
         +   skills: [surgical-edits, testing-discipline,
         +            production-readiness, unbiased-development]
         +   isolation: worktree
         +   max_turns: 60
         +   color: red
         ```

         I'll open a PR against .forge/org-chart.yaml.
         Confirm to proceed?

You:    Yes

@vp-eng: PR #127 opened: feat(org-chart): add @crypto-specialist
         Awaiting CTO review + @pr-reviewer (Gemini).
         Once merged, @crypto-specialist available for all future missions.
         Decision logged: decisions.md#dec-2026-05-16-019
```

### Dashboard surface

The dashboard's Org Chart panel shows the team as it currently exists, with deltas annotated:

```
@vp-engineering          ●  running
@architect               ✓  done
@data-engineer           ✗  dismissed this mission        (delta: -)
@researcher              ✓  done
@impl-a                  ●  running
@impl-b                  ⚠  blocked
@impl-c                  ●  running   (model: opus, delta: ↑)
@impl-d                  ●  idle
@stylist                 ●  running
@stylist-2  (delta: +)   ●  running
@crypto-specialist (+)   ●  running   ← proposed by orchestrator, approved
@tests-verifier          ●  idle
@security-verifier       ●  idle
@performance-verifier    -  not on this mission
@reliability-verifier    ●  idle
@release-manager         -  not on this mission
@docs-author             -  not on this mission
@pr-reviewer             -  not on this mission
```

Symbols:
- `(delta: +)` — mission-scoped addition (will not persist)
- `(delta: -)` — mission-scoped removal
- `(delta: ↑)` — mission-scoped reconfiguration (upgraded)
- `(delta: ↓)` — mission-scoped reconfiguration (downgraded)
- `-` — not assembled for this mission (idle in the org chart)

The dashboard also shows a small `Pending team modifications` panel near the Inbox for proposed-but-not-yet-approved changes.

### Anti-patterns this section exists to prevent

- **Editing `org-chart.yaml` directly for one-off needs.** Mission-scoped is the default; persistent requires a PR.
- **Spawning ad-hoc Claude subagents that aren't in the org chart.** Every active worker is a named role. Shadow agents are forbidden — the orchestrator cannot spawn unrostered workers.
- **Granting tools by request.** Tools are declared in the role template. A role that needs a tool it doesn't have triggers a `RECONFIGURE_ROLE` proposal, not a silent tool-grant.
- **Reducing the team below the mission's safety floor.** At least one of `@tests-verifier` or `@security-verifier` must remain on any sensitive-surface mission. Removing both is forbidden.
- **Modification storms.** The skill rate-limits CTO-initiated modifications to 1 per 5 minutes. Multiple modifications within that window are batched into a single proposal. This prevents thrashing on a stuck mission.

### See also

- `FORGE_TEAM_MODE.md` §5 (the full role roster and the org-chart-as-code pattern)
- `FORGE_TEAM_MODE.md` §12 (the CTO Approval Architecture; what gates require approval)
- `FORGE_TEAM_MODE.md` §13 (Inter-Agent Communication Protocol; how teams coordinate after a modification)
- `decision-ledger` skill (records every team modification)
- `cto-inbox` skill (surfaces team-modification proposals from the orchestrator)
- `org-chart` skill (the underlying YAML-to-agents generation; team-modifications builds on it)

---

## §19. Team Operations (Phase 2)

**Summary:** The operational layer that turns Team Mode from "works for one mission" to "operates continuously." Adds payroll (cost-as-salary), expanded integrations (Notion + Slack), work schedule (hours / pause / leave), self-healing, continuous learning, dream mode, meditation, grounded re-verification, and the SME network. Full spec in `FORGE_TEAM_OPERATIONS.md`. Discipline anchor (also in that doc's §1): every "introspective" feature is event-anchored, ground-truth-anchored, and artifact-producing — the safeguards against the reflection-poisoning trap documented in 2024-2025 LLM self-correction research.

### §19.1 Payroll

The cost-as-salary framing. Each role has a monthly budget (`.forge/payroll.yaml`) tied to its model assignment. Total budget ~$600/month with 17 roles (12 standing + 5 SMEs). Monthly report auto-generated to `.claude/reports/payroll-<YYYY-MM>.md` on the 1st; ROI signal is **deterministic** (computed from utilization data), not editorial. 50/80/100% thresholds emit CTO Inbox items + Slack pushes. CTO retires roles after ROI review identifies low-value candidates (system flags; CTO decides). Dashboard tab F5 surfaces per-role spend and trend. **Anti-pattern (forbidden):** gamification, auto-retirement, hidden cost.

### §19.2 Continuous learning (skill currency)

Scheduled crawler over Tier 1 (official docs) and Tier 2 (major-team blogs) only — defined in `.forge/learning.yaml`. **Tier 3-4 (HN, Reddit, Twitter) are signal-only — never auto-trusted.** Detects API changes, deprecations, new patterns relevant to skills loaded by this project. Produces *skill-update proposals* with mandatory Tier 1-2 citations and affected-files lists. Proposals go to CTO Inbox; **never auto-applied**. Rejected topics are parked 90 days. The full skill is `continuous-learning` in the bundle; full spec in `FORGE_TEAM_OPERATIONS.md` §6.

### §19.3 Notion and Slack integrations

**Notion** — `notion-mcp-server` publishes human-readable knowledge to a Notion workspace. Configured in `.forge/integrations.yaml` `notion:` block. Publish targets: decision ledger (append-only), journal (weekly digests), conventions (sync), mission reports (one Notion page per mission), payroll reports (one page per month). What's NOT published: mission whiteboards (transient), per-role transcripts (verbose), `working.md`, source code, secrets.

**Slack** — `@modelcontextprotocol/server-slack` sends `high`/`critical` CTO Inbox alerts to configured channels. Configured in `.forge/integrations.yaml` `slack:` block. Channels: `#forge-cto-inbox` (alerts), `#forge-missions` (lifecycle), `#forge-payroll` (budget alerts), `#forge-errors` (self-healing). Slash commands: `/forge status`, `/forge inbox`, `/forge approve <id>`, `/forge reject <id> <reason>`, `/forge pause <mission-id>`, `/forge dream`. **Quiet hours respected by default.** What's NOT sent to Slack: stand-up status emissions, per-role chatter, routine mission progress, cost-meter ticks.

### §19.4 Work schedule and role lifecycle

`.forge/schedule.yaml` defines: business hours (when missions can be auto-accepted; default 9-22 weekday, off weekend), dream-mode window (default 02:00-06:00), maintenance windows, per-role schedule overrides. **24-Hour Mode overrides business hours** but only on explicit CTO accept; off-hours auto-acceptance is forbidden.

Role lifecycle states: `active` (default), `paused` (minutes-hours; state preserved), `on-leave` (days-weeks; auto-resume at end-date), `retired` (removed from org chart; re-instantiate via team-modifications PR), `dreaming` (running dream-mode operations), `consulting` (SME mid-response). Pause vs leave naming helps you reason about the team as a real organization.

### §19.5 Self-healing

`.forge/self-healing.yaml` defines eight failure modes with deterministic detection signals and prescribed recovery actions. The full table is in `FORGE_TEAM_OPERATIONS.md` §5:

1. Mission crash → resume from `mission/whiteboard.md` last consistent state
2. KG corruption → rebuild from durable sources
3. Cost runaway → pause mission (not abort)
4. Verifier finding storm (>5 HIGH) → stop new slice assignments
5. Stuck role (no progress 2× phase budget) → soft-restart role
6. MCP server failure → disable for mission; mission continues
7. Model provider outage → switch to fallback model
8. Worktree conflict → soft-abort slice; reassign in fresh worktree

Max 3 retries per failure type; after that, escalate to CTO Inbox. **Every action logged to journal with `[self-healing]` prefix** — silent healing is forbidden. **Heals infrastructure failures, not logic bugs** (a failing test is the implementer's problem, not the healer's).

### §19.6 Dream mode

Scheduled off-hours batch processing per `.forge/schedule.yaml` `dream_mode_window`. Operations are concrete and artifact-producing — KG rebuild + optimization, embedding cache pre-warm, journal weekly digest (Fri-Sat night), decision-ledger compaction, continuous-learning crawl, SME knowledge refresh, grounded re-verification, mission post-mortems for failed missions only.

**Hard constraints** (enforced by tool allowlist on the dream-mode runtime):
- ❌ Cannot edit source code (`packages/**`, `cloud/**`, `native/**`)
- ❌ Cannot push to git
- ❌ Cannot deploy
- ❌ Cannot mutate external services (Notion/JIRA/GitHub/Slack are read-only during dream mode)
- ✅ Can write to `.claude/**` (digests, proposals, ledger compaction)
- ✅ Can read everywhere

Each cycle writes `.claude/dreams/<YYYY-MM-DD>.md` summarizing operations completed, proposals generated, anomalies observed. Cost cap per cycle: $8 by default.

### §19.7 Meditation

Event-anchored structured per-role reflection. Triggers: mission close (after buddy Phase B), weekly review (Friday 17:00 local; configurable), CTO explicit request, failed mission (auto + `incident: true` flag).

**Strict schema** (`.claude/meditations/<mission-id>/<role>.md`):
1. Concrete metrics (not opinions) — slices, retries, findings, cost, time
2. Concrete observations (cited, not asserted) — file:line or artifact references mandatory
3. Pattern (only if cited 3+ times across journal — otherwise empty)
4. Proposals (max 3, testable)
5. What I'm NOT going to do (forbidden self-criticisms list)
6. CTO action

**Hard rules:** every observation cites a file/artifact. Every proposal is testable. No comparing to other roles. No re-litigating past decisions. Max 3 proposals. **"Nothing to propose" is a valid meditation** — don't fabricate. The schema is the safeguard against reflection poisoning.

### §19.8 Grounded re-verification

Periodic deterministic regression and decision-drift detection per `.forge/reverification.yaml`:

- **Daily** (during dream mode): re-run tests on §17.5 production-critical paths; `npm audit` + `cargo audit` re-runs; benchmark sanity check.
- **Weekly:** decision-drift detection (for each decision in last 90 days, re-check cited evidence; flag if dep last-release >6 months or URL content drift); perf regression vs 4-week rolling avg; convention adherence audit (grep for forbidden patterns).
- **Monthly:** skill-citation re-check (for each URL cited in any skill, re-fetch and detect drift); threat-model freshness reminder if >90 days stale.

Surfaces findings to CTO Inbox; **never auto-rolls back** decisions. Decision drift annotates the entry with `evidence-drift-detected` (append-only annotation, not rewrite).

### §19.9 SME network

A separate role tier (knowledge tier) — five SMEs sized for this stack:

| SME | Domain |
|---|---|
| `@sme-java-spring` | Java 21, Spring Boot 3.x, Spring Security, JPA, Spring Cloud |
| `@sme-typescript-frontend` | TS 5.x, React 19, Angular 18, Preact |
| `@sme-mongodb-firestore` | MongoDB 7, Firestore, Mongoose |
| `@sme-aws-cloud` | AWS (S3, Lambda, ECS, RDS, EventBridge, Kinesis) |
| `@sme-voice-ai` | Gemini Live, Deepgram, WebRTC, 100ms, VideoSDK, SIP telephony |

Sleeping by default; idle 90% of the time. Activated on consultation (`forge.sme.consult({domain, question, context, max_cost_usd})`) or scheduled crawl during dream mode. **Tier 1-2 citations mandatory** on every response. **No `Edit`/`Write` tools** — SMEs answer questions; they don't write code. Knowledge stored in the project KG as `domain:<sme-id>` subgraphs. SMEs are added/removed via team-modifications (§18).

### §19.10 The reflection-poisoning trap (research anchor)

The reason every Phase 2 "introspective" feature has strict guardrails: the 2024-2025 literature on LLM self-correction is unambiguous that *continuous* AI self-critique degrades quality. ICLR 2024 "Large Language Models Cannot Self-Correct Reasoning Yet"; CRITIC 14.3% wrong corrections; Reflexion 16.3% false positives on MBPP; Self-Refine degrades GSM8K; NeurIPS 2024 Reflector studies name the failure mode "reflection poisoning" — a bad self-critique steers the agent away from the correct answer.

Phase 2 features defeat this by:
1. **Event-anchored triggering** (mission close, schedule boundary, error condition, idle window) — never continuous
2. **Ground-truth anchoring** (test pass/fail, dep release dates, benchmark numbers, finding counts) — never opinion
3. **Artifact-producing operations** (proposals, digests, meditations, dream cycles, healing logs) — never free-form

If you ever look at a Phase 2 feature design and think "I'd rather have the AI just figure it out continuously," reread this section. That's the trap.

### §19 build status

Phase 2 is **post-Phase-1**, planned for Weeks 7-9 of the 9-week build. Phase 6 (Operations) wires payroll + Notion + Slack + schedule; Phase 7 (Self-improvement) wires self-healing + continuous-learning + grounded-reverification; Phase 8 (Dream + SMEs) wires dream-mode + meditation + SME-network. Full build plan in `FORGE_TEAM_OPERATIONS.md` §13.

---

## How to use this file

1. **First time on the project:** read top to bottom. Then read `FORGE_TEAM_MODE.md` (Phase 1), `FORGE_TEAM_OPERATIONS.md` (Phase 2), `ANVIL_DESIGN_SYSTEM.md` (UI), and `FORGE_ARCHITECTURE.md` (overall) in that order.
2. **Subsequent sessions:** the engineering-excellence skill reads this at session start. The CTO doesn't re-read; the file is the contract.
3. **Session start, Team Mode active:** the orchestrator reads this file → `.forge/org-chart.yaml` → other `.forge/*.yaml` config (`payroll.yaml`, `schedule.yaml`, `learning.yaml`, `reverification.yaml`, `self-healing.yaml`, `integrations.yaml`) → `.claude/memory/` → mission directory (if a mission is in flight). Specialists read this file + the mission brief; they do not re-read other agents' transcripts. **Roles touching UI also read `ANVIL_DESIGN_SYSTEM.md`** at session start.
4. **When something changes:** update the relevant section in the same change that introduces the change. Stale context is worse than missing context.
5. **When the context disagrees with the codebase:** the codebase is the territory; this file is the map. Update the file. (Note in `journal.md`.)
6. **Skill ordering:** the engineering-excellence skill loads first, reads this file, and selects which sub-skills to activate based on what the mission requires.
7. **Cross-references at a glance:**
   - **§1, §17, §18** → `FORGE_TEAM_MODE.md` (roles, missions, conversational team management)
   - **§5.5** → `ANVIL_DESIGN_SYSTEM.md` (UI tokens, components, themes)
   - **§19** → `FORGE_TEAM_OPERATIONS.md` (payroll, schedule, healing, learning, dream, meditation, re-verification, SMEs)
   - **§5, all** → `FORGE_ARCHITECTURE.md` (overall system)

This file lives at `<repo>/engineering-context.md`.
