# Forge Team Mode — The Private Build Plan

> A complete plan for turning Forge (the editor) into a private, single-user, multi-agent engineering team that ships end-to-end software in 24 hours with you (the CTO) at the top of the hierarchy.
>
> **In-house only. Not for public release.** Optimized for one developer.
>
> Builds on: `FORGE_ARCHITECTURE.md`, `ANVIL_DESIGN_SYSTEM.md`, `engineering-context.md`, and the `engineering-excellence-v6` skill suite you uploaded (16 skills, 4 pre-built subagents, repo-safety-net, hooks recipe).
>
> Document length is deliberate. You asked for zero overlooking. Scan the table of contents and read sections as needed.

---

## Table of Contents

0. [Executive summary — what we're building](#0-executive-summary)
1. [What this is, and what this is not](#1-what-this-is)
2. [Constraint set — the design space we're working in](#2-constraint-set)
3. [Research synthesis — 2026 state of art](#3-research-synthesis)
4. [The architecture overlay — Team Mode on top of Forge](#4-architecture-overlay)
5. [The engineering team — the org chart](#5-engineering-team)
6. [Skills assignment per role](#6-skills-assignment)
7. [The 24-Hour Sprint Cycle](#7-twenty-four-hour-sprint)
8. [Buddy Engineering Mode — the feature](#8-buddy-engineering-mode)
9. [Universal Knowledge System](#9-universal-knowledge-system)
10. [The Project Dashboard](#10-project-dashboard)
11. [Multi-LLM Orchestration — which model does what](#11-multi-llm-orchestration)
12. [The CTO Approval Architecture](#12-cto-approval)
13. [Inter-Agent Communication Protocol](#13-inter-agent-protocol)
14. [Tool integrations — JIRA, GitHub, Gemini PR review](#14-tool-integrations)
15. [New skills to add to engineering-excellence](#15-new-skills)
16. [The genuinely novel pieces](#16-novel-pieces)
17. [Build plan — phased, calibrated](#17-build-plan)
18. [Open questions and decisions required](#18-open-questions)
19. [Known failure modes and mitigations](#19-failure-modes)
20. [What this plan deliberately does not include](#20-non-goals)

---

## 0. Executive Summary

You are building a **private, single-user, in-house AI engineering organization** that runs inside Forge. The system is **never released publicly**. It is yours. You are the CTO. The system is your reports.

The system takes an idea and produces production-ready software, with appropriate process gates. It does the research, writes the PRD, designs the architecture, plans the work, implements vertical slices, writes tests, opens PRs, gets PR review from a different LLM (Gemini), tracks features in JIRA, manages releases, and reports up. You approve at the gates that matter and otherwise stay out of the loop.

The system runs in **two modes**:

- **Standard Mode** — the engineering-excellence-v6 loop. Calibrated to task size. The default for non-trivial work.
- **24-Hour Mode** — a high-cadence sprint cycle. A complete project from idea to deployed software in a single calendar day. Used for new internal tools, prototypes, MVPs, and "let's see if this works" experiments.

The **buddy engineering** layer wraps both modes. Pre-flight enrichment before the loop. Post-loop intent review after. Event-anchored. Ground-truth-anchored. Not a continuous watchdog (research is explicit that continuous AI critique degrades quality).

The **per-project dashboard** shows everything in real time: who is doing what, what they're stuck on, what's waiting for you, what's overspending, what's at risk.

The **knowledge system** is hybrid retrieval: BM25 + Voyage 3-Large embeddings over a structured knowledge graph, fully in-memory for single-user latency. Code symbols and decisions are first-class entities.

**What this is not:** not a flat agent mesh, not a chat-room of bots, not a continuous-critique loop, not yet-another-Devin-clone. It's a hierarchical organization with file-based async coordination, ground-truth-anchored quality gates, and you at the top.

---

## 1. What This Is, And What This Is Not

### What it is

A **private multi-tenant-of-one engineering organization** that runs as a software system. The metaphor is real: an LLC-of-one where you sign off on what gets shipped. Roles are stable. Reporting chains are stable. The org chart is configuration-as-code.

Concretely:

- A set of named AI roles (VP Engineering, Architect, Data Engineering, Implementer×N, Testing, etc.) — each defined as a Claude Code custom subagent with `skills:` frontmatter, tools, model assignment, and reporting line.
- A coordinator (the **Orchestrator**) that decomposes goals, routes work to roles, and synthesizes outputs. The orchestrator has no editing tools — it only delegates and reads artifacts.
- An async, file-based coordination protocol where every agent reads and writes to a per-project mission directory. No synchronous chat between agents.
- A per-project dashboard that shows live state.
- A knowledge graph + vector index in-memory per project.
- Integrations: GitHub (issues, PRs, branches, commits), JIRA (tickets, epics, sprints), Gemini API (cross-LLM PR review), local model providers (Anthropic primary).
- Two operating modes: Standard and 24-Hour Sprint.
- A buddy layer that wraps both modes with pre-flight intake and post-loop debrief.
- Universal memory: the engineering-excellence project-memory pattern, extended with a decision ledger and a knowledge graph.
- A CTO Inbox where decisions requiring your approval queue up.

### What it is not

Stating the negatives explicitly so we stay disciplined:

- **Not a continuous AI critic.** Research is unambiguous: continuous AI-on-AI critique degrades quality. Quality comes from ground-truth signals (tests, lint, type-check, scenario execution), not from one model second-guessing another mid-loop. The buddy fires twice — pre and post. Verification fires at deterministic gates. That's it.
- **Not a flat agent mesh.** Flat meshes work for small teams and fail at scale. Hierarchical orchestration with a tool-less orchestrator is the only pattern that holds in production (2026 enterprise multi-agent literature confirms this).
- **Not a chat room.** Agents do not "talk" in real-time. They write structured artifacts. The dashboard reads those artifacts. Live chat between agents creates cascade timeouts and undebuggable race conditions.
- **Not a public product.** No multi-tenant code paths, no SSO, no SOC2, no cloud-billing. You are the only user. The system optimizes for single-user latency and ergonomics.
- **Not Devin and not Cursor 3.** Devin is one autonomous agent with delegation; Cursor 3 is editor + multiple chat tabs. This is an organization with roles, hierarchy, gates, and a dashboard.
- **Not generic.** Every role, every skill, every gate is calibrated to *your* workflow (Bakstage tech stack, Spring Boot/Java/Mongo/Angular/React/AWS).
- **Not over-engineered.** The engineering-excellence `right-sized-engineering` skill applies to building this system itself. If a feature has no concrete trigger in your workflow, it doesn't ship.

---

## 2. Constraint Set

The design space, written down so we know what we're optimizing for:

| Constraint | Value | Implication |
|---|---|---|
| Users | 1 (you) | No SSO, no roles-and-permissions in Team Mode itself; the "permission system" inside the system is org-chart-based, not security-based. |
| Deployment | Local (Electron + Forge) | No cloud control plane required for the core. Optional cloud for compute-heavy agent runs. |
| Persistence | In-memory + per-project files | Knowledge graph and embedding index live in RAM, rebuilt on project open. Decision ledger and memory live in `.claude/memory/` per project, committed. |
| Public release | Never | No marketing, no docs site, no install flow. Internal only. |
| Cost | Yours to absorb | But measured — every agent reports its cost; the dashboard sums them. Budget caps per mission. |
| Failure tolerance | Personal use | Failures don't page customers. They page you, and only when you should know. |
| Languages | TypeScript / Java / Python | Match your stack (Mandalore = Spring Boot/Java; Bakstage frontend = Angular/React/TS; ML/data = Python). |
| Models | Multi-provider | Claude primary (Anthropic Agent SDK). Gemini for PR review. GPT-5 reserved for tie-breaking. Local (Ollama) for sensitive scans. |
| Build-vs-buy | Build the orchestration, buy the editor (Forge), buy the models | We don't reimplement Monaco, MCP, or model APIs. We orchestrate them. |
| Time-to-first-value | Phase 0 alone should give you working dashboard + 3 roles | Avoid the "12-month buildout to first value" trap. |

The 24-hour mode is itself a constraint: any feature that can't be exercised in a 24-hour sprint cycle doesn't earn its place in v1.

---

## 3. Research Synthesis

The state of the art in 2026 multi-agent engineering, distilled to what shapes this design.

### Multi-agent patterns that hold in production

Four patterns dominate. We pick **Hierarchical Orchestration**:

| Pattern | Use case | Verdict |
|---|---|---|
| Orchestrator-Worker | Structured workflows | Use for sub-missions (a single feature's implementation). |
| Router-Classifier | Triage / helpdesk | Not relevant — we're not a helpdesk. |
| **Hierarchical** | **Enterprise-wide planning** | **The top-level architecture.** |
| Critic-Refiner | Compliance / regulated review | Use only at PR review gate (one critic, one refiner, finite loop). |

The 2026 enterprise multi-agent literature converges on one rule: **the top-level orchestrator must have no tools of its own.** It decomposes goals and routes; specialists execute. This prevents the orchestrator from becoming a single point of correctness failure. Our Orchestrator (the VP Engineering role's AI) follows this rule.

### What MetaGPT/ChatDev got right and wrong

**Right:**
- Roles as first-class artifacts (PM, Architect, Engineer, QA)
- Every step produces a deliverable, not just chat
- SOP (Standard Operating Procedure) -driven workflow

**Wrong:**
- Roles are too coarse (one Engineer for everything; one QA for everything)
- Linear waterfall (PM → Architect → Engineer → QA) doesn't match how good engineering actually works
- No explicit human-in-the-loop gates
- No multi-LLM verification — single model across all roles
- No ground-truth anchoring — the QA agent reviews via self-critique

**Our adjustments:**
- 12 named roles (VP Eng, Architect, Data Eng, 4× Implementer, 2× Tester, Security, Performance, Reliability, Release Manager) instead of 5
- Hierarchical with concurrent execution where the DAG permits
- Explicit CTO gates at: mission brief, architecture decision, schema change, public-API change, production push
- Multi-LLM by default: Claude for code, Gemini for PR review, GPT-5 for tie-breaks
- Ground-truth gates: tests, lint, type-check, scenario execution, cross-LLM diff (not "the AI thinks this looks good")

### What Devin 2.0 got right

- **Interactive Planning** — the agent proposes a plan, the human edits, then execution starts. We mirror this with the buddy Phase A intake.
- **Devin Wiki** — auto-indexed repo with architecture docs. We mirror this with the Universal Knowledge Graph (more on this in §9).
- **One agent, deep context** — for some tasks (a tight refactor), one strong agent beats five coordinating agents. We support this via the Standard Mode loop.

### What Cursor 3 got right

- **Agents Window** — a workspace optimized for orchestration, not for editing. Forge's Mission Control view (from `ANVIL_DESIGN_SYSTEM.md` §5.3) is this.
- **Best-of-N tournaments** — run the same prompt across N models and pick the strongest output. We adopt this for implementer outputs in 24-hour mode.
- **Worktree isolation** — each agent works in its own git worktree so diffs are clean. The engineering-excellence v6 pre-built subagents already use `isolation: worktree` where applicable.

### What MetaGPT got most right that we're keeping

**Blackboard architecture for shared state.** A central knowledge store that all agents read from and write to, with structured rules about who writes what. This is exactly the `.claude/missions/<mission-id>/` directory pattern from engineering-excellence v6. We extend it with the knowledge graph.

### Inter-agent communication (the protocol question)

Two protocols matter in 2026:

- **MCP (Model Context Protocol, Anthropic)** — governs how agents access tools and data. Already used in Forge.
- **A2A (Agent-to-Agent, Google)** — v1.0 early 2026, agents publish Agent Cards at `/.well-known/agent.json`. Backed by Microsoft, AWS, Salesforce, SAP, Cisco.

We do **not** adopt A2A wholesale. Direct synchronous agent-to-agent calls create cascade timeouts — the #2 production failure mode. Instead:

- **Discovery via Agent Cards** (inspired by A2A) — every role publishes its capabilities to a local registry so the orchestrator and dashboard know what's available.
- **Coordination via the mission directory** (inspired by MetaGPT's blackboard and engineering-excellence v6's missions) — async, file-based, durable, auditable.
- **No synchronous agent-to-agent RPC.** Workers complete and report; coordinators read artifacts and route the next step.

### Embedding models for code retrieval

Consensus from the 2026 MTEB and RTEB benchmarks:

| Model | Use | Why |
|---|---|---|
| **Voyage 3-Large / Voyage 4-Large MoE** | Primary code retrieval | 14% over OpenAI text-embedding-3-large on NDCG@10 (Voyage 4); 4-6 point lead on code/legal/medical retrieval. |
| **BM25** | Symbol and identifier search | Dense embeddings miss exact identifiers. Hybrid is non-negotiable for code. |
| **Cohere embed-v4** | Hybrid dense+sparse in one call | Fallback if Voyage rate-limits. |
| **BGE-M3** (self-hosted) | Offline / air-gapped | When you don't want to send code to a SaaS embedder. |

**The hybrid retrieval pipeline** (the only thing that works well for code):

1. **BM25** fetches top 200-500 candidates by lexical match.
2. **Voyage 3-Large** re-ranks via dense embedding similarity.
3. **Cross-encoder reranker** (BGE-Reranker-v2 or Cohere Rerank 3) scores top 50.
4. **Diversity constraint** prevents near-duplicate chunks.
5. Result: top 8-15 chunks delivered to whichever agent asked.

### The buddy/critic research

From `prompt-buddy/SKILL.md` (your uploaded bundle, citing the source literature):

- LLMs **cannot reliably self-correct reasoning** without external verification signals (ICLR 2024).
- Self-Refine *degrades* performance on GSM8K and MATH (NeurIPS 2024 RISE).
- CRITIC: 14.3% wrong corrections. Reflexion: 16.3% false positives on MBPP.
- "Reflection poisoning": a bad self-critique can steer the agent *away* from the correct answer it had reached.

**Implication for our design**: every quality gate must be anchored to a deterministic ground-truth signal. Tests run. Lint runs. Type-check runs. Scenario executes. Cross-LLM diff happens (different model, different training, different blind spots — closer to ground truth than self-critique). The buddy is event-anchored, not continuous. We never run an "AI critic" agent that watches another agent in real time.

---

## 4. Architecture Overlay — Team Mode on Top of Forge

Team Mode is a layer that sits on top of Forge (the editor) and uses the engineering-excellence-v6 skill suite. It is not a separate product. It is a mode you enter inside Forge.

```
┌────────────────────────────────────────────────────────────────────┐
│  YOU (CTO)                                                         │
│  Approves: mission brief, architecture, schema changes,            │
│            public API changes, prod pushes, scope expansions       │
└────────────┬───────────────────────────────────────────────────────┘
             │ approval
             ▼
┌────────────────────────────────────────────────────────────────────┐
│  CTO INBOX (always visible in dashboard)                           │
│  Queue of items awaiting decision; sorted by leverage + time       │
└────────────┬───────────────────────────────────────────────────────┘
             │ items
             ▼
┌────────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (no tools — only delegates and reads artifacts)      │
│  Role: VP Engineering                                              │
│  Owns: mission decomposition, work routing, synthesis              │
│  Model: Opus (high-reasoning required)                             │
└────────────┬───────────────────────────────────────────────────────┘
             │ routes work
             ▼
┌────────────────────────────────────────────────────────────────────┐
│  SPECIALIST POOL (12 named roles, ~3-5 active per mission)         │
│                                                                    │
│  Planning tier:   @architect  @data-engineer  @researcher          │
│  Build tier:      @impl-a  @impl-b  @impl-c  @impl-d  @stylist     │
│  Verify tier:     @tests-verifier  @security-verifier              │
│                   @performance-verifier  @reliability-verifier     │
│  Release tier:    @release-manager  @docs-author  @pr-reviewer     │
│                                                                    │
│  Each is a Claude Code custom subagent (.claude/agents/*.md)       │
│  Each declares: tools, model, skills:, isolation, maxTurns, color  │
└────────────┬───────────────────────────────────────────────────────┘
             │ reads / writes
             ▼
┌────────────────────────────────────────────────────────────────────┐
│  MISSION DIRECTORY (.claude/missions/<mission-id>/)                │
│  • context.md       (the brief, signed by CTO)                     │
│  • whiteboard.md    (shared scratch)                               │
│  • artifacts/       (per-agent reports)                            │
│  • decisions.md     (decision ledger, append-only)                 │
│  • dashboard.json   (live state, read by the dashboard)            │
└────────────┬───────────────────────────────────────────────────────┘
             │ feeds
             ▼
┌────────────────────────────────────────────────────────────────────┐
│  PROJECT DASHBOARD (a Forge view, F4)                              │
│  Shows: org chart, mission swimlanes, CTO inbox,                   │
│         decision ledger, knowledge graph viz, cost meter           │
└────────────────────────────────────────────────────────────────────┘

         ┌──────────────── reads ──┐
         │                          │
┌────────▼──────────┐    ┌──────────▼────────────┐
│  KNOWLEDGE GRAPH  │    │  HYBRID RETRIEVAL      │
│  (in-memory       │    │  • BM25 (tantivy)      │
│   per project)    │    │  • Voyage 3-Large      │
│  • files          │    │  • cross-encoder rerank│
│  • symbols        │    │  • diversity constraint│
│  • decisions      │    │                        │
│  • dependencies   │    │  Returns top 8-15 chunks│
│  • tickets (JIRA) │    │                        │
│  • PRs (GitHub)   │    └────────────────────────┘
└───────────────────┘

External integrations (read-write):
  • GitHub  → branches, commits, PRs, issues, releases
  • JIRA    → epics, stories, tasks, sprints
  • Gemini  → PR review (cross-LLM verification)
  • Linear  → optional, alternative to JIRA
```

### Layer responsibilities

| Layer | Owns | Lives in |
|---|---|---|
| Forge editor | Code surface, file system, Monaco, MCP | Existing `FORGE_ARCHITECTURE.md` |
| Team Mode runtime | Orchestrator, role assembly, mission lifecycle | New `packages/team-mode/` |
| Skills | Discipline content (the v6 suite) | `.claude/skills/` |
| Roles | Per-role specialization (the org chart) | `.claude/agents/` |
| Missions | Per-task coordination | `.claude/missions/<id>/` |
| Memory | Per-project durable knowledge | `.claude/memory/` |
| Knowledge graph | Entity-relationship view of the project | In-memory, rebuilt on project open |
| Dashboard | Visualization | Forge's `Mission Control` view, extended |

### The two operating modes

**Standard Mode** — the engineering-excellence loop, calibrated to task size. For non-trivial work that doesn't need a full team. The buddy wraps it (Phase A / Phase B). Specialist subagents fan out only when triggered by the §17 thresholds.

**24-Hour Mode** — a high-cadence sprint cycle (detailed in §7). Used for new internal tools, prototypes, MVPs. Full team assembled at H+0. Continuous progress against a 24-hour clock. Phases have time budgets. Misses trigger CTO escalations, not silent slips.

Modes are explicit. You select the mode when you start a mission. You can promote a Standard mission to 24-Hour mode (or demote) mid-flight.

---

## 5. The Engineering Team — The Org Chart

Twelve named roles. Each is a Claude Code custom subagent (file in `.claude/agents/`). Each role has a stable definition, a model assignment, a tool allowlist, preloaded skills via the `skills:` frontmatter, an isolation policy, and a reporting line. The org chart is configuration-as-code (`<repo>/.forge/org-chart.yaml`); changes are tracked in git.

### The hierarchy

```
                          CTO (you)
                            │
                            ▼
                  @vp-engineering (Orchestrator)
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Planning tier       Build tier         Verify tier
   (PM-class)         (Engineering)       (QA-class)
        │                   │                   │
   @architect          @impl-a             @tests-verifier
   @data-engineer      @impl-b             @security-verifier
   @researcher         @impl-c             @performance-verifier
                       @impl-d             @reliability-verifier
                       @stylist
                            │
                            ▼
                      Release tier
                            │
                       @release-manager
                       @docs-author
                       @pr-reviewer (uses Gemini)
```

### Per-role specification

Each row below corresponds to a file in `.claude/agents/`. The schema follows the engineering-excellence-v6 conventions.

| Role | Specialty | Tools | Skills preloaded | Model | Isolation | maxTurns | color |
|---|---|---|---|---|---|---|---|
| **@vp-engineering** | Orchestrator — decomposes missions, routes work, synthesizes outputs. **No editing tools.** | `Read, Glob, Task, AskUserQuestion` | `engineering-excellence, prompt-buddy, project-memory, plan-then-execute, unbiased-development, right-sized-engineering` | Opus (high-reasoning) | none | 80 | blue |
| **@architect** | System design, ADRs, technology choices, dependency calls. **Read-only.** | `Read, Grep, Glob, WebFetch, WebSearch` | `research-first, plan-then-execute, right-sized-engineering, production-readiness, unbiased-development` | Opus | none | 30 | purple |
| **@data-engineer** | Schema design, migrations, query plans, data integrity. **Read-only on prod.** | `Read, Grep, Glob, Bash (read-only DB)` | `research-first, plan-then-execute, production-readiness, right-sized-engineering, unbiased-development` | Opus | none | 30 | cyan |
| **@researcher** | Deep unbiased research before planning starts. Web, internal docs, prior PRs. **Read-only.** | `Read, Grep, Glob, WebSearch, WebFetch` | `research-first, unbiased-development` | Sonnet | none | 40 | green |
| **@impl-a / @impl-b / @impl-c / @impl-d** | Implementation. Each works on a different vertical slice in a different worktree. **Worktree-isolated.** | `Read, Edit, Write, Bash, Grep, Glob, LSP` | `engineering-excellence, surgical-edits, testing-discipline, documentation-discipline, version-control-craft, unbiased-development, right-sized-engineering` | Sonnet (default) / Opus (when slice complexity warrants) | worktree | 60 | orange |
| **@stylist** | Frontend-only specialist. Handles UI changes, design-system token application, accessibility. | `Read, Edit, Write, Bash, Grep, Glob, LSP` | `surgical-edits, testing-discipline, documentation-discipline, version-control-craft, unbiased-development` | Sonnet | worktree | 40 | pink |
| **@tests-verifier** | Reviews test coverage and quality. **Read-only.** | `Read, Grep, Glob, Bash` | `testing-discipline, verify-rigorously, unbiased-development` | Sonnet | none | 20 | yellow |
| **@security-verifier** | OWASP-class audit of diffs. **Read-only.** | `Read, Grep, Glob` | `production-readiness, unbiased-development, repo-safety-net` | Sonnet | none | 20 | red |
| **@performance-verifier** | N+1, hot path, allocation review. **Read-only.** | `Read, Grep, Glob, Bash` | `production-readiness, unbiased-development` | Sonnet | none | 20 | red |
| **@reliability-verifier** | Error/retry/idempotency. **Read-only.** | `Read, Grep, Glob` | `production-readiness, unbiased-development` | Sonnet | none | 20 | red |
| **@release-manager** | Version bump, changelog, release notes, deploy checklist. **Limited write.** | `Read, Edit, Write, Bash, Grep, Glob` | `version-control-craft, documentation-discipline, production-readiness, unbiased-development` | Sonnet | none | 30 | gold |
| **@docs-author** | User-facing docs, README updates, API docs. | `Read, Edit, Write, Grep, Glob, WebFetch` | `documentation-discipline, unbiased-development, right-sized-engineering` | Sonnet | none | 25 | teal |
| **@pr-reviewer** | **Cross-LLM PR review using Gemini.** Reviews the diff with a different model's lens. **Read-only.** | `Read, Grep, Glob, GeminiReview (MCP)` | `critical-self-review, unbiased-development, production-readiness` | **Gemini 2.5 Pro** | none | 25 | white |

**Notes on the role design:**

- **Four implementers** (not "ten engineers") because the cost of orchestrating ten parallel agents exceeds the benefit for one developer's workflow. Four is the sweet spot for vertical-slice parallelism on a single mission.
- **Three verifiers as a minimum trio** (tests, security, reliability) — performance adds a fourth when the change touches DB / hot paths / async (per engineering-context.md §17).
- **@pr-reviewer is Gemini.** This is the explicit cross-LLM verification call. Different model lineage (DeepMind), different training data, different blind spots → catches things Claude misses. This implements your "Gemini for PR review" requirement.
- **The Orchestrator has no editing tools.** It cannot write code. It can only `Read` (to inspect artifacts), `Glob` (to navigate), `Task` (to spawn workers), and `AskUserQuestion` (to escalate to CTO). This is structurally enforced — it cannot become a single point of correctness failure.
- **No "Engineer" role** in the singular. The work is split by *slice*, not by job description. The implementer that writes the JIRA-integration code is the same kind of agent as the one writing the database migration — they get different briefings, not different roles.
- **A "10X engineer" is not a role** — it's an aspiration for output quality, which we get from skill stacking + model selection + verification gates, not from naming an agent "@10x-engineer."

### Configuration-as-code: `org-chart.yaml`

```yaml
# .forge/org-chart.yaml
# Single source of truth for the engineering team.
# Generates .claude/agents/*.md on save.

version: 1
name: Bakstage In-House Team
cto: shashank

roles:
  - id: vp-engineering
    title: VP Engineering
    tier: leadership
    reports_to: cto
    model: claude-opus-4-7
    tools: [Read, Glob, Task, AskUserQuestion]
    skills: [engineering-excellence, prompt-buddy, project-memory, plan-then-execute, unbiased-development, right-sized-engineering]
    isolation: none
    max_turns: 80
    color: blue
    can_approve: [slice_completion, verifier_findings_summary]
    must_escalate: [mission_brief, architecture_change, schema_change, public_api_change, prod_push, scope_expansion]

  - id: architect
    title: Architect
    tier: planning
    reports_to: vp-engineering
    model: claude-opus-4-7
    tools: [Read, Grep, Glob, WebFetch, WebSearch]
    skills: [research-first, plan-then-execute, right-sized-engineering, production-readiness, unbiased-development]
    isolation: none
    max_turns: 30
    color: purple
    produces: [architecture.md, adrs/]

  # ... (one block per role; full file lives in repo)

policies:
  - id: implementation-must-be-worktree
    applies_to: [impl-*]
    rule: "isolation: worktree"

  - id: verifier-must-be-read-only
    applies_to: ["*-verifier", "pr-reviewer"]
    rule: "disallowedTools: [Edit, Write, Bash]"

  - id: pr-review-uses-gemini
    applies_to: [pr-reviewer]
    rule: "model: gemini-2-5-pro"
```

A small CLI (`forge org-chart sync`) reads this YAML and emits `.claude/agents/*.md`. Changes are PR-reviewable.

---

## 6. Skills Assignment Per Role

The skill suite is your uploaded engineering-excellence-v6 (16 skills) plus 6 new skills we add for Team Mode (specified in §15). The full skill matrix:

| Skill | Continuous on | VP-Eng | Architect | Data-Eng | Researcher | Impl-* | Stylist | Tests-Ver | Security-Ver | Perf-Ver | Rel-Ver | Release-Mgr | Docs-Author | PR-Reviewer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| engineering-excellence | all roles | • | | | | • | • | | | | | | | |
| unbiased-development | all roles | • | • | • | • | • | • | • | • | • | • | • | • | • |
| right-sized-engineering | all roles | • | • | • | | • | | | | | | | • | |
| prompt-buddy | orchestrator-only | • | | | | | | | | | | | | |
| project-memory | session start/end | • | | | | | | | | | | | | |
| research-first | research phase | | • | • | • | | | | | | | | | |
| plan-then-execute | planning phase | • | • | • | | | | | | | | | | |
| surgical-edits | execute phase | | | | | • | • | | | | | | | |
| testing-discipline | execute + verify | | | | | • | • | • | | | | | | |
| documentation-discipline | execute phase | | | | | • | • | | | | | | • | |
| version-control-craft | commit phase | | | | | • | • | | | | | • | | |
| verify-rigorously | verify phase | | | | | | | • | | | | | | |
| critical-self-review | review phase | | | | | | | | | | | | | • |
| production-readiness | harden phase | | • | • | | | | | • | • | • | • | | • |
| debug-systematically | when bugs emerge | | | | | • | • | | | | | | | |
| repo-safety-net | session start + git push | • | | | | • | • | | • | | | • | | |
| **NEW skills (§15)** | | | | | | | | | | | | | | |
| mission-brief | mission kickoff | • | • | | | | | | | | | | | |
| org-chart | session start | • | | | | | | | | | | | | |
| stand-up | once per phase | • | | | | | | | | | | | | |
| knowledge-graph | continuous | • | • | • | • | • | • | • | • | • | • | • | • | • |
| decision-ledger | every decision | • | • | • | | • | | | | | | • | | |
| cto-inbox | when blocked | • | • | • | | • | • | • | • | • | • | • | | • |

**The two skills that are continuously active across every role** are `unbiased-development` and `knowledge-graph`. The first governs how every agent communicates (anti-sycophancy, calibrated). The second governs how every agent retrieves context.

### How `skills:` frontmatter is applied per role

The engineering-excellence-v6 README clarified that file-based custom subagents (the kind in `.claude/agents/`) inherit *only* the skills named in the `skills:` field. So for each role, we list the skills it must have preloaded. Other skills are not loaded for that role — by design. A `@security-verifier` doesn't need `surgical-edits`; loading it would only consume tokens.

This is a per-role token discipline: small contexts → cheaper runs → faster missions.

---

## 7. The 24-Hour Sprint Cycle

Your stated goal: idea-to-shipped-software in 24 hours. The cycle has fixed phase budgets. Phases that run over the budget trigger CTO escalations.

### The clock

```
H+0       Mission accepted, brief drafted, CTO signs
H+0:30    Research kicked off (parallel — @researcher + @architect + @data-engineer)
H+2:00    Research complete; architecture proposed
H+2:30    CTO architecture review (gate)
H+3:00    Plan locked; work decomposed into 8-16 vertical slices; assigned to 4 implementers
H+3:00    First slices start (parallel, worktree-isolated)
H+12:00   ~half slices complete; mid-mission stand-up; CTO check-in
H+18:00   All slices complete; @tests-verifier + @security-verifier + @reliability-verifier (parallel)
H+19:00   Verifier findings; remediation (back to implementers, capped at H+22:00)
H+22:00   PR opened against main; @pr-reviewer (Gemini) reviews
H+23:00   @docs-author finalizes README/changelog; @release-manager preps release
H+24:00   CTO final approval; merge; release; mission closed
```

### Phase budgets — what happens at overrun

| Phase | Budget | Soft deadline (warn) | Hard deadline (CTO escalation) |
|---|---|---|---|
| Brief | 30 min | 25 min | 45 min |
| Research | 90 min | 75 min | 2h 30m |
| Architecture review | 30 min | — (CTO-controlled) | — |
| Plan | 30 min | 25 min | 45 min |
| Implementation | 15 h | 14 h (mid-mission CTO check-in) | 16 h |
| Verification | 1 h | 50 min | 1h 30m |
| Remediation | 3 h | 2h 30m | 4 h |
| PR review | 1 h | 45 min | 1h 30m |
| Docs + release prep | 1 h | 45 min | 1h 30m |
| CTO final approval | up to 30 min | — | — |

The clock is **real** — driven by wall time, not by tool-call count. The cost meter (already specified in `ANVIL_DESIGN_SYSTEM.md` §5.3) runs continuously. The dashboard shows the clock and budget burn-down.

### What gets cut when overrun is imminent

The orchestrator (VP Eng) has a fixed precedence order for scope-cutting decisions. CTO can override.

1. Cut nice-to-have slices (anything labeled `priority: nice-to-have` in the plan).
2. Cut secondary verifiers (drop performance and reliability if the change doesn't touch those surfaces).
3. Cut docs to "draft" (release-manager can finalize after merge).
4. Cut release; merge as draft PR with `do-not-deploy` label.
5. **Never cut** tests-verifier or security-verifier on changes touching §17 sensitive surfaces. If running out of time, the mission misses its 24h target rather than ship insecure or untested code. This is a CTO-only override.

### Mode triggers

You enter 24-Hour Mode by:

- Explicit: `/mission start --24h --name=<>` in Forge command palette
- Implicit: when a mission brief contains a `target_deadline:` within 24-30 hours

The orchestrator confirms the mode in the brief and won't proceed without your sign-off.

### Standard Mode is the default for everything else

Standard Mode runs the engineering-excellence-v6 loop calibrated to task size. A one-line typo fix takes 5 minutes; a payment refactor takes a day. Both run the same loop, just at different ceremony levels. The buddy wraps both. The team is assembled lazily — for a typo fix, you have @vp-engineering + 1 implementer, period.

### What gets recorded after every mission

Mission outcome — completed at H+24 or earlier — is written to:

- `journal.md` — one entry per mission, with outcome, key decisions, what was hard.
- `decisions.md` — every decision that was made; per `decision-ledger` skill (§15).
- `conventions.md` — anything stable enough to become a convention.
- `playbooks.md` — if a sequence of steps worked and would work again.

The buddy Phase B fires at mission end and produces the debrief. The CTO reviews. The mission closes.

---

## 8. Buddy Engineering Mode — The Feature

The buddy is a **feature** — an explicit mode that wraps a mission. It does exactly what `prompt-buddy/SKILL.md` describes, integrated into Team Mode.

### Two phases, two events

**Phase A — Pre-flight intake** runs once when a mission is accepted. The VP Engineering agent runs the buddy. Output is the **Mission Brief** (§15 has the `mission-brief` skill spec). The CTO confirms or corrects, then the engineering loop starts.

**Phase B — Post-loop debrief** runs once when the mission completes. The same buddy reviews delivered output against the original brief's intent. Output is the **Mission Debrief**.

### Why this is a *mode* and not just a skill

Three reasons it earns the "mode" framing:

1. **It changes the UI.** In buddy mode, the AI Surface shows the brief at the top of the composer pane (the "contract" between CTO and team). Every agent's output references the brief.
2. **It changes the workflow.** The loop cannot start without a confirmed brief. The loop cannot end without a debrief. These are hard gates.
3. **It changes the dashboard.** The dashboard's primary view in buddy mode is **brief-vs-progress**: how much of the brief is done, what's drifted, what's at risk.

### Buddy is not a critic

The most important thing about buddy mode is what it *doesn't* do. **It doesn't run during the loop.** No continuous AI watching another AI's work. The research literature is unambiguous on why (see §3). Quality during the loop comes from ground-truth gates: tests, lint, type-check, scenario, cross-LLM PR review by Gemini.

### Cross-LLM buddy variant (optional)

For high-stakes missions (production deploys, schema changes), you can enable **Cross-LLM Buddy**: Phase A runs in Claude *and* Gemini, and both intakes are surfaced. If they disagree on intent, the disagreement is presented to CTO as an open question. This costs more (two intakes instead of one) but catches drift Claude alone wouldn't catch. Disabled by default; opt-in per mission via `mission --cross-llm-buddy`.

### Buddy fatigue

The skill's hard-skip list applies. Buddy does not run on:

- Trivial prompts ("fix typo on line 22")
- Continuations of an in-flight task
- Conversational questions
- Prompts containing "just do it," "skip planning," "no preamble"

The skill documents this carefully. We honor it. Buddy that wakes too often is exactly the friction that gets disabled.

---

## 9. Universal Knowledge System

A single in-memory knowledge layer that every agent reads from. No agent's context is "what it's seen this session." Every agent reads from the same source.

### Three components

```
┌─────────────────────────────────────────────────────────────┐
│  KNOWLEDGE GRAPH (structured)                              │
│  Nodes: File, Symbol, Decision, Ticket, PR, Commit,        │
│         Convention, Playbook, Mission, Verifier-Finding    │
│  Edges: contains, defines, references, depends_on,         │
│         decided_by, fixed_by, blocks, supersedes           │
│  Lives: in-memory (Rust, petgraph), rebuilt on project open│
└─────────────────────────────────────────────────────────────┘
            ▲                                  ▲
            │                                  │
┌───────────┴────────────┐         ┌──────────┴──────────────┐
│  BM25 INDEX (lexical)  │         │  VECTOR INDEX (semantic) │
│  tantivy (Rust)         │         │  Voyage 3-Large         │
│  symbols, identifiers,  │         │  natural-language        │
│  exact terms            │         │  intent matching         │
│  ~1ms p99               │         │  ~30ms p99 (local cache) │
└─────────────────────────┘         └──────────────────────────┘

                        Retrieval pipeline
                                │
                                ▼
   1. Parse query → intent + symbols
   2. BM25 fetches 200-500 candidates by lexical match
   3. Vector index re-ranks to top 50 by semantic similarity
   4. Cross-encoder reranks to top 20
   5. Diversity constraint reduces to top 8-15
   6. Graph expansion: pull connected nodes (callers/callees/decisions)
   7. Return packed context (< 30k tokens)
```

### Why three components, not just embeddings

**Code search breaks dense-only retrieval.** A query like `UserService.findById` is an exact identifier. Embeddings will return things "similar in vibe" — that's not what you want. BM25 returns the actual match.

**Decisions aren't embeddings-friendly.** "Why did we choose Drizzle over Prisma?" — the answer lives in `decisions.md` as a structured entry. The graph knows it. Embeddings would semi-match.

**Relationships matter.** If you ask "what calls `SkillLoader.load`?", you need the call graph, not a vector similarity. The graph has it.

### The graph schema

Entities (nodes) and their attributes:

| Type | Key | Attributes | Source |
|---|---|---|---|
| `File` | path | language, loc, last_modified, owner_role | filesystem walk |
| `Symbol` | qualified_name | kind (class/fn/var), file, line, signature | tree-sitter parse |
| `Decision` | id | summary, why, when, who_decided, status | `decisions.md` |
| `Ticket` | jira_id | title, status, assignee, epic, points | JIRA MCP server |
| `PR` | github_id | title, status, reviewer, base, head | GitHub MCP server |
| `Commit` | sha | message, author, files, parent | git log |
| `Convention` | id | rule, rationale, scope | `conventions.md` |
| `Playbook` | id | name, steps, when_to_use | `playbooks.md` |
| `Mission` | mission_id | name, status, mode, deadline, cost | mission directory |
| `Finding` | finding_id | severity, type, location, mission_id | verifier outputs |

Edges:

| From | Edge | To |
|---|---|---|
| File | `contains` | Symbol |
| Symbol | `defines` | (none — leaf) |
| Symbol | `references` | Symbol |
| Symbol | `depends_on` | File |
| Decision | `decided_by` | (cto or role-name) |
| Decision | `supersedes` | Decision |
| Mission | `produced` | PR, Commit |
| Mission | `cited` | Decision, Convention |
| PR | `reviewed_by` | (role — typically pr-reviewer) |
| Ticket | `implemented_by` | Mission |
| Finding | `found_by` | (verifier role) |
| Finding | `blocks` | PR |

### Retrieval as a tool

Every agent has access to a single retrieval tool:

```typescript
forge.knowledge.query({
  intent: string,              // natural language
  symbols?: string[],          // exact identifiers to BM25-prioritize
  types?: NodeType[],          // restrict to certain node types
  scope?: string,              // path prefix to restrict scope
  k?: number,                  // default 12
  include_graph?: boolean      // pull connected nodes (default true)
}) => RetrievedContext
```

The tool returns ranked chunks, citations (`file:line` form), graph-expanded context, and a confidence score. Every retrieval is recorded in the mission's `whiteboard.md` so you can see what context an agent was given.

### Memory tiers (matches `project-memory` skill)

```
Working set  (mission-scoped, ~5 entries)     → in mission whiteboard
Episodic     (timeline of events)             → journal.md, append-only
Semantic     (stable conventions)             → conventions.md, curated
Procedural   (repeatable operations)          → playbooks.md, curated
Decisions    (immutable ledger)               → decisions.md, append-only
Graph        (entity-relation, all of above) → in-memory, rebuilt
Vector       (semantic embeddings of above)   → in-memory cache, rebuilt
```

All durable layers live in `.claude/memory/` and are committed to the repo. The graph and vector index are rebuilt on project open from the durable layers + a filesystem walk. Build time targets: <3s on a 100k-file project (cold), <200ms incremental on file save.

### Why in-memory only (your requirement)

Pros:
- No external service to manage. No Pinecone, no Qdrant Cloud, no managed Postgres.
- Single-user latency is excellent (RAM is fast).
- Air-gappable.

Cons:
- Rebuild on project open. Mitigated by fast incremental builds.
- RAM usage grows with project size. For a 500k-LOC repo, expect ~1-2GB for the graph + vector index. Acceptable for your machine.
- No cross-machine sync. We commit the durable files to git (memory/), so the next time you open the project elsewhere, it rebuilds.

### Where Voyage 3-Large vs alternatives

You said "world best embedding models." The 2026 consensus for code is:

- **Primary**: Voyage 3-Large (or Voyage 4-Large MoE if your budget allows). API-based; ~$0.12/1M tokens; best NDCG@10 on code retrieval benchmarks.
- **Fallback (offline)**: BGE-M3 self-hosted via Ollama. ~677M params; runs on your machine; no API dependency.
- **Cost-optimized**: Google text-embedding-005 at $0.006/1M tokens (20× cheaper than OpenAI 3-large). Good for non-critical indexing.

The system supports all three. The default is Voyage 3-Large. Switch via `forge config knowledge.embedder=bge-m3` or similar.

---

## 10. The Project Dashboard

A Forge view (`F4`, sibling to the Mission Control view from `ANVIL_DESIGN_SYSTEM.md` §5.3). The dashboard is per-project. It shows the team in real time.

### Top-level layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Project: Mandalore                  Mission: bakstage-skill-loader   24H Sprint │
│ Clock: H+12:34   Budget: $4.20 / $20.00   Status: ON TRACK                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────────────────────┐   │
│  │  Org Chart           │    │  Mission Swimlanes (live)                   │   │
│  │  • You (CTO)         │    │  ──────────────────────────────────────►     │   │
│  │  • @vp-engineering   │    │  vp-eng    plan ─────────────► coord         │   │
│  │  • @architect ✓      │    │  arch      ███ done                          │   │
│  │  • @data-eng ✓       │    │  data-eng  ███ done                          │   │
│  │  • @impl-a ◐ 63%     │    │  impl-a    ━━━━━━━━━━━━━ ◐                   │   │
│  │  • @impl-b ⚠ blocked │    │  impl-b    ━━━ ⚠ rejected ─→ retry           │   │
│  │  • @impl-c idle      │    │  impl-c    (idle)                            │   │
│  │  • @impl-d idle      │    │  impl-d    (idle)                            │   │
│  │  • @tests-ver idle   │    │  tests     (waiting)                         │   │
│  │  • @sec-ver idle     │    │  security  (waiting)                         │   │
│  │  • @rel-ver idle     │    │  reliab.   (waiting)                         │   │
│  │  • @release-mgr idle │    │  release   (idle)                            │   │
│  └──────────────────────┘    └──────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────┐  ┌─────────────────────────┐  │
│  │  CTO Inbox  (3 items)                        │  │  Decision Ledger (live) │  │
│  │  ─────────────────────────────────────────── │  │  ──────────────────────│  │
│  │  ⚠ @impl-b critic-rejected diff (HIGH risk)  │  │  H+11:23 architect     │  │
│  │     proposes: rewrite-from-scratch           │  │     chose Drizzle over │  │
│  │     evidence: tsc 2 errors, vitest 1 fail    │  │     Prisma (why...)    │  │
│  │     [Approve]  [Reject + retry]  [Take over] │  │  H+09:14 @impl-a       │  │
│  │  ─────────────────────────────────────────── │  │     decided not to add │  │
│  │  ⚠ @architect proposes adding 'jose' dep     │  │     jose dep — used    │  │
│  │     license: MIT, last release: 14d ago      │  │     existing crypto    │  │
│  │     bundle impact: +18KB gzipped             │  │  H+06:42 vp-eng        │  │
│  │     [Approve]  [Reject]  [Ask alt]           │  │     locked plan: 12    │  │
│  │  ─────────────────────────────────────────── │  │     vertical slices    │  │
│  │  ℹ @vp-eng mid-mission check-in              │  │  ...                   │  │
│  │     7/12 slices done; ETA H+22:30; on track  │  └─────────────────────────┘  │
│  │     [Acknowledge]                            │                              │
│  └──────────────────────────────────────────────┘                              │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  Knowledge Graph (mini-viz, click to expand)                             │  │
│  │  [graph showing files, symbols, decisions, and connecting edges]         │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Panel-by-panel

**Header strip** — project name, mission name, mode, clock, budget burn, overall status (`ON TRACK`, `AT RISK`, `OFF TRACK`, `BLOCKED`, `COMPLETE`).

**Org Chart** — every role's state at a glance. Active roles top, idle roles bottom. State dots match `ANVIL_DESIGN_SYSTEM.md` §3.1: planning (info-blue), running (accent-amber), blocked (warning-yellow), success (success-green), failed (danger-red). Click a role: opens the role's transcript in the AI Surface.

**Mission Swimlanes** — the Gantt-style swimlane view from `ANVIL_DESIGN_SYSTEM.md` §5.3, scoped to the current mission. Already designed; we reuse the component.

**CTO Inbox** — the approval queue. Each item shows: who proposed, what's proposed, evidence (links to artifacts), recommended decision, and inline approve/reject/escalate buttons. Sorted by leverage (impact × time-sensitivity). Older items move up the queue.

**Decision Ledger** — append-only stream of decisions made during the mission. Newest at top. Each entry has: timestamp, who decided, summary, link to full rationale. Drives a forward audit trail you can use later to ask "why did we do this?"

**Knowledge Graph viz** — a mini visualization of the relevant subgraph for the current mission. Hover any node: see attributes. Click: open in the editor. This is the dashboard's "Devin Wiki equivalent" — the project's accumulated understanding made visible.

### Cross-mission view

Above the per-mission dashboard, a `Projects` sidebar shows all projects with active missions. You can switch contexts; each project has its own knowledge graph, org chart configuration, and CTO inbox.

### What the dashboard *doesn't* show

By design:

- **Per-tool-call detail.** That's noise. The dashboard shows roles, missions, decisions. Tool-call detail lives in the AI Surface transcripts (open on click).
- **A chat log.** The dashboard isn't a Slack. Communication between agents is artifact-based; the artifacts are linked from the swimlanes.
- **A code editor.** Forge has one. The dashboard sends you to it.

### Sound + notification (your choice)

The dashboard is silent by default. The CTO Inbox can optionally:

- Ping (subtle sound) when an item appears
- Show OS notification when an item is `HIGH` severity or older than 30 min
- Push to your phone (via Anthropic's Push API if you wire it up; out of scope for v1)

---

## 11. Multi-LLM Orchestration

You said: "FOr PR review we use gemini modal than claude." Generalizing: different LLMs for different roles, picked deliberately, not by aesthetic preference.

### The model assignment matrix

| Role | Model | Why |
|---|---|---|
| @vp-engineering | Claude Opus 4.7 | High-reasoning orchestration; long context for synthesizing artifacts |
| @architect | Claude Opus 4.7 | Design decisions need strong reasoning |
| @data-engineer | Claude Opus 4.7 | Schema and migration decisions are high-stakes |
| @researcher | Claude Sonnet 4.6 | Speed matters more than depth at this phase |
| @impl-a / @impl-b | Claude Sonnet 4.6 | Default; fast iteration |
| @impl-c / @impl-d | Claude Opus 4.7 OR GPT-5.4 | Diverse: when implementer outputs disagree, you get genuine difference |
| @stylist | Claude Sonnet 4.6 | UI work; Sonnet is sufficient |
| @tests-verifier | Claude Sonnet 4.6 | Verification; Sonnet is sufficient |
| @security-verifier | Claude Sonnet 4.6 | Same |
| @performance-verifier | Claude Sonnet 4.6 | Same |
| @reliability-verifier | Claude Sonnet 4.6 | Same |
| @release-manager | Claude Sonnet 4.6 | Structured output, no novel reasoning |
| @docs-author | Claude Sonnet 4.6 | Writing; Sonnet is great at this |
| **@pr-reviewer** | **Gemini 2.5 Pro** | **Different lineage; catches Claude's blind spots** |

### Three cases for using a different LLM

1. **Cross-LLM verification** (your @pr-reviewer case). Gemini reviews Claude's diffs. Different model, different blind spots. This is the single most important multi-LLM use.
2. **Best-of-N tournaments** for high-stakes slices. Two implementers, one Claude Opus, one GPT-5.4. Compare outputs. Pick best. The verifier picks via objective criteria (tests passing, perf, simplicity), not via aesthetic vote.
3. **Tie-breaking**. When Claude and Gemini disagree at the PR review gate, GPT-5.4 is the tiebreaker. Used rarely; cost-managed.

### How model selection ties to cost

Every model has a per-1M-token cost. Every agent reports its cost per session. The dashboard sums them. Per-mission budget caps are enforced — if a mission is about to exceed budget, the orchestrator must escalate to CTO before continuing.

Rough cost model for a 24-hour mission (12 slices, 4 implementers, full verification, PR review):

| Phase | Tokens (est) | Model | Cost (est) |
|---|---|---|---|
| Brief | 50k | Opus | $0.75 |
| Research | 800k | Sonnet | $2.40 |
| Architecture | 200k | Opus | $3.00 |
| Plan | 100k | Opus | $1.50 |
| Implementation (4 parallel) | 4M | Sonnet (mostly) | $12.00 |
| Verification (4 verifiers) | 600k | Sonnet | $1.80 |
| Remediation | 600k | Sonnet | $1.80 |
| PR review (Gemini) | 200k | Gemini 2.5 Pro | $0.50 |
| Docs + release | 100k | Sonnet | $0.30 |
| **Total** | **~6.6M tokens** | | **~$24** |

Add the embedder ($0.12/1M tokens × indexed code ≈ $5-10 one-time per project). Plus an estimated 30% margin for retries, off-target work, and ad-hoc subagent spawns.

**One 24-hour mission ≈ $30-40 in API costs.** This is the cost ceiling you should expect. The dashboard tracks it live.

### Provider selection by sensitivity

- **Default**: API providers (Anthropic, Google, OpenAI). Fastest, cheapest, best quality.
- **Sensitive code** (auth, payments, customer data, secrets): you can opt to route specific roles through self-hosted Ollama models (Llama 4, Qwen 3 Coder, DeepSeek V3). Configurable per project in `.forge/config.yaml`.

The framework doesn't dictate this — it gives you the switch. By default you use the APIs.

---

## 12. The CTO Approval Architecture

You said "human approvals to CTO always to everything." That phrasing is right *in spirit* but wrong in implementation — you do not want to be paged for every tool call. We make this precise.

### What requires CTO approval (the gates)

These are non-negotiable. The orchestrator pauses and queues a CTO Inbox item:

| Gate | Severity | Why |
|---|---|---|
| Mission brief (Phase A intake) | required | The contract for the work |
| Architecture choices (new framework, new dep, new pattern) | required | Two-way-door cost is high |
| Schema change / data migration | required | Irreversible |
| Public API change | required | Wire-format break |
| Production push (deploy to prod) | required | Affects real systems |
| Scope expansion beyond the brief | required | Trust contract |
| Spend over 80% of mission budget | required | Cost discipline |
| Cross-team file edit (touching a service not declared in the brief) | required | Blast radius |
| Verifier finding: HIGH severity | required | Quality floor |
| Verifier finding: MEDIUM, when severity-weighted >= threshold | optional | Tunable |
| External integration auth/credential | required | Security |

### What does NOT require CTO approval (the autonomy budget)

The orchestrator can act without you on:

- File creation / edit inside the planned scope
- Test writing
- Commit creation (per slice)
- Local test execution
- Subagent spawning within the planned team
- Internal API design choices that don't break public contracts
- Refactor decisions inside a single file
- Documentation updates
- Local lint/format
- Worktree management

This is the autonomy budget. Without it, every mission grinds to a halt with you in the loop.

### What the CTO Inbox item looks like

Every item has a fixed structure:

```yaml
id: cto-inbox-2026-05-16-014
created_at: 2026-05-16T13:42:00Z
mission_id: skill-loader-refactor
severity: high  # low | medium | high | critical
type: architecture_change
proposer: '@architect'
summary: "Add 'jose' npm dependency for JWT verification"
proposal:
  what: "Add jose@5.x as a runtime dependency in packages/skill-loader"
  why: "Current code uses node-jsonwebtoken which has known TS type issues and slower verification"
  alternative_considered: |
    1. Stay with node-jsonwebtoken (current cost: 2 type-cast workarounds, 14% slower verify)
    2. Use native crypto (cost: ~80 LOC of JWT spec handling)
    3. Add jose (cost: +18KB gzipped, +1 dep)
  recommendation: "Option 3 (jose)"
evidence:
  - "performance bench: bench/jwt-verify.bench.ts (15ms→3ms)"
  - "license: MIT"
  - "maintenance: last release 14d ago, weekly downloads 12M"
  - "audit: npm audit clean, snyk clean"
time_sensitivity: "blocks H+3:00 plan-lock gate"
decision_options:
  - { id: approve, label: "Approve", consequence: "architecture moves on" }
  - { id: reject, label: "Reject", consequence: "@architect picks alt; +30min" }
  - { id: defer, label: "Defer to next mission", consequence: "ship with current; revisit" }
expires_at: null  # optional auto-decision if you don't respond
```

### Auto-decision on expiry (optional, per item)

Some items have an `expires_at` and a default decision. If you don't respond before the deadline, the default applies and the system continues. Example: a `low` severity dep upgrade defaults to approve after 1h. You can disable auto-decision globally or per type. By default, `high` and `critical` items never auto-decide.

### Approval persistence

Every approval (and rejection) is recorded in the decision ledger with full evidence. You can grep `decisions.md` for "approved by cto" and see the full trail. This becomes the basis for the project's playbooks — patterns of decisions you've approved.

### Approval surface — three places to act

You can act on inbox items from:

1. **The dashboard** (`F4`) — primary surface, full context, all actions inline.
2. **The Forge command palette** (`Cmd+K → inbox`) — quick approve/reject without leaving editor.
3. **CLI** (`forge inbox`) — when you're in the terminal, you don't have to switch contexts.

(Optional, post-v1: Slack / iMessage / Push — wire up later if you want.)

---

## 13. Inter-Agent Communication Protocol

You said agents "talk to each other." Here's how, precisely. Not chat. Not RPC. Async, file-based, durable.

### The three communication primitives

1. **Mission directory** (the shared workspace)
2. **Findings artifacts** (per-agent reports)
3. **Agent Cards** (capability discovery)

That's the entire protocol. No synchronous messaging. No streaming chat. No RPC.

### Why no synchronous chat

Cascade timeouts. If `@impl-a` calls `@architect` synchronously for clarification and `@architect` is busy, `@impl-a` blocks. If `@architect` has called `@vp-engineering`, you have a stall. With 12 roles, the surface area for stalls is enormous. We bypass it by going async.

### Mission directory structure

```
.claude/missions/<mission-id>/
├── context.md              # the brief, signed by CTO
├── plan.md                 # the decomposed plan
├── whiteboard.md           # shared scratch, all roles write
├── artifacts/
│   ├── architect_design.md
│   ├── data-engineer_schema.md
│   ├── impl-a_slice-3.md      # per-slice working notes
│   ├── impl-a_slice-3.diff    # the actual diff
│   ├── tests-verifier_findings.md
│   ├── security-verifier_findings.md
│   ├── pr-reviewer_review.md  # the Gemini cross-LLM review
│   └── ...
├── decisions.md            # decisions made during mission
├── transcript/
│   ├── architect.jsonl
│   ├── impl-a.jsonl
│   └── ...                 # per-agent transcript stream
├── dashboard.json          # live state for the dashboard
└── status.md               # human-readable summary
```

### Communication examples

**A: implementer needs clarification from architect**

`@impl-a` writes to `whiteboard.md`:

```markdown
## Question — @impl-a — H+5:23
**For:** @architect
**Re:** slice-3 (JWT verification flow)
**Question:** The brief says "validate signatures before parsing." Does this mean: (a) verify signature on raw bytes before JSON.parse, or (b) parse then verify the signature claim? They have different security profiles — (a) protects against malformed JSON, (b) is standard JWT flow.
**Need by:** H+5:45 to stay on plan
**Default if no answer:** Going with (a), the safer option
```

The orchestrator (`@vp-engineering`) sees the question on its next poll of the whiteboard. It either:
- Routes the question to `@architect` if architect is idle.
- Surfaces it to the CTO inbox if the architect is busy and the answer matters.
- Lets `@impl-a` proceed with the default after the "need by" passes.

`@architect` (when it runs) reads the whiteboard, answers below, and continues its own work:

```markdown
## Answer — @architect — H+5:38
**To:** @impl-a
**Re:** JWT verification flow (slice-3)
**Answer:** (b) is correct — standard JWT flow. The "validate signature before parsing" phrasing in the brief is loose; what we mean is signature verification happens before the *application* parses the payload. JSON parsing of the structure is fine; just don't trust the contents until verified.
**Citation:** decisions.md#dec-2026-05-16-002 (we chose jose; same flow)
```

`@impl-a` reads the answer on its next read of the whiteboard and continues.

This is async but durable. The whiteboard is the truth. The transcripts are the journal.

**B: verifier finds something and needs the implementer to fix it**

`@security-verifier` writes to `artifacts/security-verifier_findings.md`:

```markdown
## Security findings — @security-verifier — H+18:45

### HIGH — slice-7 — path traversal risk
**Location:** packages/skill-loader/src/manifest.ts:48
**Evidence:**
```typescript
const skillPath = path.join(workspaceRoot, manifest.path);
```
**Issue:** `manifest.path` is user-supplied via the SKILL.md file. No validation that the resolved path stays within `workspaceRoot`. Can escape via `../`.
**Recommended fix:** Use `path.relative()` to confirm the resolved path stays under workspaceRoot; reject if not.
**Severity rationale:** A poisoned skill could read any file the editor process can read. Critical for marketplace skills.

### No other findings.
```

Orchestrator reads the findings file. Severity HIGH → routes back to `@impl-a` (the original implementer of slice-7) with the finding inline. `@impl-a` reads, fixes in worktree, commits. Verifier reruns. Pass.

### Agent Cards

Every role publishes a card describing what it does, what tools it has, what skills it preloads, what it accepts, what it produces. Lives at `.forge/agents/<role>.card.json`. Generated from `org-chart.yaml`.

```json
{
  "id": "architect",
  "title": "Architect",
  "description": "Designs system architecture; produces ADRs; selects dependencies; rejects bad tech choices",
  "accepts": ["mission_brief", "research_summary"],
  "produces": ["architecture.md", "adrs/*.md"],
  "tools": ["Read", "Grep", "Glob", "WebFetch", "WebSearch"],
  "skills": ["research-first", "plan-then-execute", "right-sized-engineering", "production-readiness", "unbiased-development"],
  "model": "claude-opus-4-7",
  "isolation": "none",
  "max_turns": 30,
  "color": "purple",
  "reports_to": "vp-engineering",
  "can_escalate_to": "cto"
}
```

Agent Cards are loaded by the dashboard, the orchestrator, and any other agent that needs to know "who can do X?" Inspired by Google's A2A protocol; we use the schema, not the synchronous calling.

### Why this design beats chat

- **Durable.** A crash in the middle of a 24-hour mission doesn't lose state. The mission directory is on disk.
- **Auditable.** You can read every artifact after the fact. There's no "what did the architect say at H+5:38?" — it's in the whiteboard.
- **Composable.** Adding a new role doesn't require updating chat routing — just drop a new file in `.claude/agents/`.
- **Single-writer-per-section.** Each agent writes to its own artifact files; the whiteboard has structured sections. No race conditions on shared state.
- **No cascade.** If one role is slow, others continue.

---

## 14. Tool Integrations

External services the system reads and writes. All via MCP servers.

### GitHub

| Operation | Who | When |
|---|---|---|
| Read repo, branches, files | All roles | Continuously |
| Create branch | @impl-* | Per slice (worktree-isolated) |
| Commit | @impl-* | After each slice's tests pass |
| Open PR | @release-manager | After all slices verified |
| Run CI | (GitHub Actions) | On every push |
| Request review | @release-manager | Tags @pr-reviewer (Gemini) |
| Merge PR | @release-manager | Only after CTO approval |
| Create issue | @vp-engineering | When verifier finding > MEDIUM and not blocking |
| Read PR comments | @vp-engineering | For surfacing to CTO |

MCP server: GitHub's official MCP (`github-mcp-server`). Already in the architecture.

### JIRA

| Operation | Who | When |
|---|---|---|
| Read epic / story / task | @vp-engineering | At mission brief time |
| Create story under epic | @vp-engineering | When breaking down a mission |
| Update task status | @impl-* | On slice completion |
| Log time | (auto from mission clock) | Continuous |
| Attach mission artifacts | @release-manager | At mission close |
| Create release ticket | @release-manager | At H+22:00 |

MCP server: Atlassian's official MCP (`atlassian-mcp`). Configure in `.forge/integrations.yaml`.

**JIRA hierarchy mapping:**

```
JIRA Epic        ↔  Forge Project
JIRA Story       ↔  Forge Mission
JIRA Sub-task    ↔  Mission slice (one per impl agent's work)
JIRA Bug         ↔  Verifier finding (HIGH severity)
JIRA Tech-debt   ↔  Convention violation flagged by buddy debrief
```

This mapping is encoded in `.forge/integrations.yaml`. You can swap Linear or GitHub Projects for JIRA by editing the mapping — the rest of the system is agnostic to which PM tool you use.

### Gemini (for PR review)

The @pr-reviewer role uses Gemini 2.5 Pro instead of Claude. Configured via a small adapter MCP server (`gemini-review-mcp`):

```yaml
# .forge/integrations.yaml
gemini_review:
  model: gemini-2-5-pro
  api_key_env: GEMINI_API_KEY
  context:
    - the PR diff (full)
    - the mission brief
    - the verifier findings (for context, not for re-doing)
    - the decision ledger entries cited in the mission
  prompt_template: prompts/pr-review.md
  output: structured (severity-tagged findings + summary)
  blocking_severities: [high, critical]
```

The output is parsed and posted as a PR comment. If Gemini flags HIGH or CRITICAL, the merge is blocked until the CTO reviews. Disagreements between Claude (during implementation/verification) and Gemini (at PR review) are valuable signal — they're surfaced explicitly to the CTO inbox.

### Forge config

```yaml
# .forge/config.yaml — per project
project:
  name: mandalore
  primary_language: java
  secondary_languages: [typescript, kotlin]

team:
  org_chart: .forge/org-chart.yaml
  default_mode: standard  # or "24h"

knowledge:
  embedder: voyage-3-large
  vector_dim: 1024
  bm25_engine: tantivy
  rerank: bge-reranker-v2

integrations:
  github:
    repo: bakstage-ai/mandalore
    mcp: github-mcp-server
  jira:
    project_key: MAND
    mcp: atlassian-mcp
  gemini:
    enabled: true
    role: pr-reviewer

budgets:
  per_mission_default_usd: 20
  per_mission_24h_usd: 50
  cto_alert_at_pct: 80
```

This single file is the project's bridge to the wider system. Edit it; everything reconfigures.

---

## 15. New Skills to Add to Engineering-Excellence

Your uploaded engineering-excellence-v6 has 16 skills. Team Mode needs six more. Each is a `SKILL.md` with `name`, `description`, and content. They follow the same style guide as the existing skills.

### Skill 17 — `mission-brief`

**Description:** Creates and maintains MISSION_BRIEF.md at mission kickoff. The single contract document between CTO and team. Used by `@vp-engineering` (Phase A buddy) and read by every agent on the mission. Triggers when a new mission starts; updates only on CTO-approved scope changes; otherwise immutable.

**Contents specified:**
- Problem statement
- Success criteria (measurable)
- Out-of-scope (what we're explicitly NOT doing)
- Constraints (time, cost, tech, compliance)
- Risks (known unknowns)
- Team assembled (the roles for this mission)
- Architecture summary (1 paragraph; details in architecture.md)
- Phase budget (H+timestamps for each phase)
- Approval signature: CTO + ISO 8601 timestamp

### Skill 18 — `org-chart`

**Description:** Reads `.forge/org-chart.yaml` at session start; generates / verifies `.claude/agents/*.md`; surfaces role-change diffs to CTO. Triggers at session start, before any mission planning. The org chart is configuration-as-code — this skill enforces that.

### Skill 19 — `stand-up`

**Description:** Once per phase (not continuous), every active role produces a one-line status update. Aggregated into the dashboard. Format: `[role] [state] [current action] [eta]`. Triggers on phase transitions, on CTO request (`/standup`), and at the 12-hour mark of a 24-hour mission. **Does not trigger more often than every 15 minutes** — frequent stand-ups become noise. Rate-limited.

### Skill 20 — `knowledge-graph`

**Description:** Builds and maintains the project knowledge graph (files, symbols, decisions, tickets, PRs, conventions, missions). Triggers at session start (cold build), on file save (incremental), on commit (graph snapshot), on mission close (lessons absorbed). Provides the retrieval tool `forge.knowledge.query()` that every role uses. The structural backbone of the universal memory system.

### Skill 21 — `decision-ledger`

**Description:** Records every decision made by any role during a mission. Append-only. Each entry: timestamp, who decided, decision summary, why, evidence, citations to other entries. Triggers whenever any role makes a decision the next session needs to know about — including dependency additions, framework choices, schema choices, scope cuts, scope expansions, deferral of work. Hard rule: a decision the team makes that isn't in the ledger by mission end is treated as not having been made.

### Skill 22 — `cto-inbox`

**Description:** Manages the CTO Inbox queue. Creates an inbox item when a gate is hit (per §12 gates list). Items have a fixed schema (severity, type, proposer, summary, proposal, evidence, recommended decision, decision options, time-sensitivity). Items are sorted by leverage. Items persist until decided or auto-decided per policy. Read by the dashboard. Triggers any time an agent in any role hits a gate.

### How these integrate with the existing 16

The new skills slot into the engineering-excellence loop without replacing anything. They're orthogonal to the existing 16:

```
session start
  ├── engineering-excellence loads (orchestrator)
  ├── org-chart verifies the team           ← NEW
  ├── knowledge-graph builds the index      ← NEW
  └── project-memory reads memory/

mission kickoff
  ├── prompt-buddy Phase A (intake)
  └── mission-brief produces the brief      ← NEW

during the loop
  ├── research-first, plan-then-execute, surgical-edits, etc.
  ├── decision-ledger records decisions     ← NEW
  ├── stand-up emits status (rate-limited)  ← NEW
  └── cto-inbox queues approvals            ← NEW

mission close
  ├── prompt-buddy Phase B (debrief)
  ├── project-memory persists lessons
  └── decision-ledger seals the mission     ← NEW (finalize phase)
```

We update `engineering-context.md` §13 to add the new memory files (`decisions.md`) and §17 to reference the new skills in the multi-agent section.

---

## 16. The Genuinely Novel Pieces

You asked for innovation. Beyond stacking known patterns well (which is most of the value), here are the design moves that are *not* in existing tools:

### 1. The Org Chart as Code

Most multi-agent frameworks have hardcoded roles (MetaGPT's 5; ChatDev's 7). Even when roles are configurable, they're not first-class artifacts. Here, the org chart is a YAML file in your repo. Changes are git-tracked. Adding a `@migrations-specialist` for a 3-month database overhaul project is a 30-line YAML diff. Removing it after the project is over is the inverse. You can see the team evolve like you see a codebase evolve.

### 2. Buddy at every phase boundary, never in between

Most "AI critic" features run continuously and degrade quality (the research is clear). The buddy here runs exactly twice per mission: at the start and at the end. In between, ground-truth gates do the work (tests, lint, type-check, scenario, cross-LLM PR review). This is the disciplined version of what most systems get wrong by adding watchdog agents.

### 3. Cross-LLM verification as a structural choice, not a feature flag

@pr-reviewer is Gemini. Period. The role is named, configured, and modeled differently from every other role. This isn't "you can switch models if you want." It's "this role must use a different LLM than the implementer it's reviewing." The structural enforcement matters — feature flags get disabled when you're tired; structural enforcement holds.

### 4. The 24-Hour Sprint with hard phase budgets

The 24-hour mode isn't "do as much as you can in 24 hours." It has phase budgets (research H+2, plan H+3, implementation H+18, etc.) and *the dashboard surfaces overrun in real time*. The orchestrator knows the budget and surfaces overrun risks before they materialize. Plus a strict precedence order for scope cuts (drop nice-to-haves first; never drop tests/security on sensitive surfaces). This is more aggressive than any tool currently ships.

### 5. The Universal Working Set + Knowledge Graph

When a new task arrives, the orchestrator computes the **working set** — the K entities/files/decisions relevant to this task. The same working set is provided to every agent on the task. They start aligned. Plus the knowledge graph provides relationships (call graph, decision lineage) that pure embeddings miss. This is closer to how a real engineering team works ("we all read the design doc before we start coding") than how most AI tools work ("each agent fetches what it needs ad-hoc").

### 6. The Decision Ledger as an immutable side-effect of the loop

Most AI tools have logs. Few have **decisions** as a first-class artifact. Here, every decision made during a mission is recorded immutably with: who decided, what, why, evidence, when. You can grep your project for "decisions about authentication" and find every choice your team made about auth, ever. This compounds over time — month 6 of using the system, your project's decision ledger is the most valuable artifact you own.

### 7. The CTO Inbox: structured, leverage-sorted, decision-options-included

You don't just get notified that an agent is stuck. You get: who proposed what, why, evidence, the alternatives considered, the recommended decision, the time sensitivity, and inline approve/reject/escalate. The agent did the homework so your decision is fast. This is "the briefing memo" pattern from real org design — push decisions up with the data already gathered.

### 8. The Stand-up that doesn't trigger constantly

Stand-up runs once per phase, at most every 15 minutes, at the 12h mark, and on demand. It's rate-limited specifically because constant status updates are noise. Real engineering teams don't stand up every 5 minutes; neither does this team.

### 9. Mission as first-class entity in the knowledge graph

A mission isn't just a folder. It's a node in the project's knowledge graph, with edges to the decisions it produced, the PR it became, the tests it added, the conventions it created, the verifier findings it generated. You can ask "show me every mission that touched the auth surface" and get a structured answer.

### 10. The Distinction between "no-tools orchestrator" and "tool-rich specialists"

The Orchestrator (@vp-engineering) has no `Edit`, no `Write`, no `Bash`. It cannot do work — it can only delegate and synthesize. This is the production-tested pattern from the 2026 enterprise literature: the orchestrator must not be a single point of correctness failure. We structurally enforce it via the `tools:` allowlist.

---

## 17. Build Plan

Phased. Calibrated. Each phase is a 24-hour-mode mission you run with the system you've built so far (eat your own dogfood).

### Phase 0 — Foundation (Week 1, ~5 days)

**Goal:** Working dashboard + 3-role team + Standard Mode + Buddy.

- Drop the engineering-excellence-v6 skills into `.claude/skills/`.
- Author the 6 new skills (§15) and drop them in.
- Author the first 3 role files (`@vp-engineering`, `@architect`, `@impl-a`) in `.claude/agents/`.
- Build the minimum dashboard (`F4` view) showing: org chart, mission swimlanes (reuse from `ANVIL_DESIGN_SYSTEM.md`), CTO inbox, decision ledger.
- Wire the mission directory pattern (`.claude/missions/<id>/`).
- Wire Standard Mode end-to-end.
- Build the `forge org-chart sync` CLI to generate `.claude/agents/*.md` from `org-chart.yaml`.

**Exit criteria:** You can run a non-trivial mission (e.g., "add an endpoint to Mandalore") end-to-end with one orchestrator, one architect, one implementer. Dashboard updates live. CTO inbox catches a deliberate gate (you trigger a fake dep-add and see the item).

### Phase 1 — Full team (Week 2, ~5 days)

**Goal:** All 12 roles. Verification fan-out works.

- Author the remaining 9 role files (`@data-engineer`, `@researcher`, `@impl-b/c/d`, `@stylist`, `@tests-verifier`, `@security-verifier`, `@performance-verifier`, `@reliability-verifier`, `@release-manager`, `@docs-author`, `@pr-reviewer`).
- The 4 verifier roles inherit from engineering-excellence-v6's pre-built subagents (already in `.claude/agents/`).
- Wire the verification fan-out (orchestrator spawns verifiers; aggregates findings).
- Add the standup skill and rate-limited stand-up emission.

**Exit criteria:** A mission spawns 4 implementers and 3 verifiers; findings aggregate; remediation loops to the right implementer; the dashboard shows all of it.

### Phase 2 — Knowledge Graph + Embeddings (Week 3, ~5 days)

**Goal:** Universal knowledge system live.

- Wire BM25 indexing via tantivy (Rust crate; bind via napi-rs).
- Wire Voyage 3-Large embedding generation (API; cached locally).
- Wire the cross-encoder reranker (BGE-Reranker-v2 self-hosted or Cohere Rerank 3 API).
- Build the graph backing store (in-memory, petgraph in Rust).
- Wire incremental updates on file save.
- Wire the `forge.knowledge.query()` tool exposed to every role.
- Build the knowledge graph mini-viz panel in the dashboard.

**Exit criteria:** A role asks "find me all the places where SkillLoader is referenced and what decisions we've made about it" and gets a packed context in under 100ms.

### Phase 3 — 24-Hour Mode (Week 4, ~5 days)

**Goal:** 24H mode end-to-end.

- Wire the phase clock and budget enforcement.
- Wire the precedence-ordered scope cuts.
- Build the H+N timeline visualization in the dashboard.
- Run a deliberate 24-hour sprint mission (build a small internal tool — could be Forge feature itself).

**Exit criteria:** A 24-hour mission completes, all phases hit their budgets or escalate per policy.

### Phase 4 — Integrations (Week 5, ~5 days)

**Goal:** JIRA + GitHub + Gemini PR review live.

- Wire the GitHub MCP server. Test branch / commit / PR / merge.
- Wire the JIRA MCP server. Test ticket sync.
- Wire the Gemini-review MCP adapter. Run a real PR through it.
- Verify the dashboard's CTO Inbox surfaces external-tool actions correctly.

**Exit criteria:** A 24-hour mission's PR gets reviewed by Gemini and the result lands in the CTO Inbox; on approval, the PR merges; the JIRA ticket transitions to Done.

### Phase 5 — Polish & dogfood (Week 6, ~5 days)

**Goal:** Use the system for actual Bakstage work for a week.

- Run 3-5 real missions (small ones — bug fixes, small features).
- Capture friction. Add or remove skills as you find what works.
- Tune the role definitions based on what actually happens.
- Tighten the budget and gate thresholds.

**Exit criteria:** You'd use the system over the status quo for at least 50% of your weekly work.

### Total: ~6 weeks for v1

This is the calibrated build. Phase 0 alone gives you working value (dashboard + standard mode + buddy). The system pays for its own remaining build via dogfooding starting Phase 1.

### What this build plan deliberately doesn't include

- A cloud control plane. Single-user; local-only.
- Plugin marketplace. Single-user; you write your own skills.
- Multi-tenancy. Single-user; not relevant.
- Public docs site. In-house only.
- SOC2 / SSO / billing. Not for sale.
- A separate "mobile app." Use the existing CTO Inbox in Forge.

---

## 18. Open Questions and Decisions Required

Items that need your input before / during the build.

### Decided by you to start the build

1. **JIRA, Linear, or GitHub Projects** for ticket tracking? Each is wirable. Default: JIRA (you mentioned it explicitly).
2. **Which Gemini model for PR review** — Gemini 2.5 Pro (default) vs Gemini 3 Flash (faster, cheaper) vs Gemini 3 Pro (newest)? Default: 2.5 Pro for v1; revisit when 3 Pro stabilizes.
3. **Per-mission budget defaults** — $20 (Standard), $50 (24-Hour). Adjust based on first dogfood missions.
4. **Self-host embedder fallback**? BGE-M3 via Ollama on your machine, for the times Voyage rate-limits or you want offline mode. Default: yes.
5. **Auto-decision policy** for low-severity CTO Inbox items? Default: never. You can enable per-type later.
6. **Slack / iMessage / Push notifications** for high-severity inbox items? Default: no for v1; OS notifications only.

### Decisions to make during the build (Phase 0-2)

7. **What constitutes a "slice" for impl agents** — file-count? line-count? feature? My current default: a slice is a vertically-shippable unit (handler + service + tests + docs for one feature), typically 4-15 files, ≤500 LOC of new code. Tune in Phase 1.
8. **How to handle agent contention on the whiteboard** — single writer per section seems to work; if two impl agents write to the same section, what happens? My current default: separated sections per agent + a `whiteboard.shared` section for orchestrator-only writes. Validate in Phase 1.
9. **Knowledge graph rebuild trigger** — on every save? on commit? on demand? Default: incremental on save, full rebuild on project open + on commit.
10. **Cost cap behavior** — at 100% budget, hard-stop or escalate-and-continue? Default: escalate-and-continue with a 50% extension headroom. Hard-stop at 150%.

### Open after Phase 5

11. **Cloud spillover for long-running 24h missions** — when a mission's verifier sweep would take 90 min on your laptop, can it spill to cloud compute? Possibly, but adds infra. Defer.
12. **Multi-model best-of-N for the verifier tier** — would 3 verifiers (Claude + Gemini + GPT-5) be meaningfully better than 1 Claude verifier? Worth a 1-week experiment. Defer.
13. **Shared knowledge graph across all projects (your "global Bakstage brain")** — the per-project KG is isolated; should a meta-KG span all projects? Useful but expensive. Defer.

---

## 19. Known Failure Modes and Mitigations

Documented failure modes of multi-agent systems (2026 literature) and how this design avoids them.

| Failure mode | Description | Our mitigation |
|---|---|---|
| Hallucination propagation | Agent A produces a wrong output; agents B and C build on it; the error compounds. | Ground-truth gates between phases (tests, lint, types, scenario). Cross-LLM PR review by Gemini catches Claude's compound errors. |
| Cascade timeouts | Agent A waits on agent B which waits on agent C; one slow API stalls everything. | Async file-based coordination; no synchronous calls between agents. Agents poll the whiteboard rather than wait on RPCs. |
| Privilege escalation | An agent gets manipulated via prompt injection to access systems it shouldn't. | Per-role tool allowlists; verifiers read-only; orchestrator no-tools; per-project credentials; agent activity audited via mission transcripts. |
| Reflection poisoning | A bad self-critique steers the agent away from a correct answer it had reached. | No continuous self-critique. Buddy fires twice (pre/post), never mid-loop. Verification is ground-truth, not opinion. |
| Cost runaway | A mission cycles in retries; cost balloons. | Per-mission budget caps; CTO Inbox escalation at 80% spend; orchestrator maxTurns; verifier maxTurns. |
| Shadow agents | Agents accumulate that aren't in the org chart; nobody owns them. | Org chart is single source of truth; `.claude/agents/` is generated from it; un-listed agents fail to spawn. |
| Drift from brief | The team solves a different problem than the brief specifies. | The brief is immutable except via CTO-approved scope changes. The buddy Phase B explicitly checks intent-vs-output. The mission can't close without the debrief. |
| Verifier rubber-stamping | The verifier always says "looks good" and never finds issues. | The "no finding, no report" rule with empty-output expected; `unbiased-development` skill loaded by every verifier; cross-LLM PR review at the gate. |
| Orchestrator-becomes-bottleneck | Orchestrator can't keep up with 4 implementers + 3 verifiers. | Orchestrator has no editing tools (lightweight role); polls every 30s; specialist completes by writing artifacts (orchestrator doesn't have to interrupt them). |
| Memory pollution | Bad lessons get into conventions.md; future sessions follow them. | Memory has tiers; the journal is append-only ground truth; conventions are curated, not auto-summarized; the buddy doesn't write to memory directly. |

---

## 20. What This Plan Deliberately Does Not Include

Stating non-goals so they don't accrete into scope later.

- **A "10X engineer" agent role.** No agent is named "10X engineer." Quality of output comes from the skill stack and verification, not from a marketing-coded role name.
- **Real-time agent-to-agent chat.** Cascade timeout failure mode. We use async file-based coordination.
- **Continuous AI critique during the loop.** Research-validated bad idea. Buddy fires at exactly two events; nowhere else.
- **A web-based dashboard.** Forge has a native dashboard view (`F4`); you don't need a separate URL.
- **Multi-tenancy.** Single user. The "permissions" inside the system are role-based, not security-based.
- **A marketplace of pre-built teams.** You define your team in `org-chart.yaml`; you don't shop for one.
- **A "manager" who manages the managers.** The org has two levels (CTO → VP Eng → specialists). Beyond that and the system becomes its own management challenge.
- **Auto-merge of CTO-approved PRs without final sign-off.** Approval at the inbox approves the *proposal*; the merge is still a deliberate action. Two-step. Always.
- **Long-term agent memory across projects.** Memory is per-project. Cross-project learning happens via you, not via a meta-agent.
- **Models other than the ones specified in §11 by default.** Adding new models is a config change. The defaults are the ones we trust.

---

## Closing note

This plan is calibrated to what you described: in-house, single-user, hierarchical, ground-truth-anchored, buddy-wrapped, 24-hour-capable, multi-LLM, JIRA + GitHub + Gemini integrated, with a knowledge graph, with a dashboard, with a CTO Inbox.

It deliberately rejects three popular ideas: continuous AI critique (research-bad), flat agent meshes (production-bad), and tool-rich orchestrators (architecture-bad).

It deliberately accepts three less-popular ideas: org-chart-as-code, async-file coordination, and cross-LLM verification as a structural choice.

The build is 6 weeks for v1. Phase 0 alone gives you working value. The rest pays for itself via dogfooding.

Open the file. Tell me which assumptions are wrong. The plan is wrong in places — every plan this size is. The point is to make the wrongness visible so we can fix it cheaply.

— *FORGE Team Mode plan, v0.1, May 16, 2026.*
