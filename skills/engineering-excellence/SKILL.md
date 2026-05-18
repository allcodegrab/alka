---
name: engineering-excellence
description: The central operating loop for any non-trivial code change, and the orchestration hub for the full 31-skill suite including team-mode operations (mission briefs, org chart, decision ledger, CTO inbox, payroll, stand-ups, work schedule, team modifications), knowledge infrastructure (knowledge graph, SME network, continuous learning), operational resilience (self-healing, grounded re-verification, dream mode), and structured reflection (meditation). Use this whenever the task involves writing, modifying, refactoring, debugging, or reviewing code in a real codebase — not for one-line answers or pure questions. This skill loads the project's engineering-context.md and project memory at session start, enforces the research → plan → execute → verify → review → harden loop, tells you which sub-skill to load at each gate, and maps each phase to its concrete Claude Code tool (TodoWrite, EnterPlanMode, Agent, LSP). For multi-agent missions, it additionally manages the mission lifecycle (mission-brief → loop → meditation), team composition (org-chart → team-modifications), cost tracking (payroll), and off-hours processing (dream-mode). Invoke it for any feature implementation, bug fix, refactor, migration, performance work, or code review.
---

# Engineering Excellence

The central checklist that drives every code change through the same disciplined loop a senior engineer runs in their head — informed by the project's specific conventions, prior sessions' lessons, and Claude Code's specific tool primitives. In multi-agent missions, this skill additionally orchestrates the mission lifecycle, team composition, decision tracking, cost management, and off-hours processing.

## Why this exists

LLMs writing code without a loop produce statistically dirty output: ~1.75× more logic errors and ~1.57× more security findings than human code, even when it passes type-checks and tests (CodeRabbit, 2025). The dirt isn't in syntax. It hides in race conditions, hallucinated APIs, missed boundary conditions, and silent violations of project conventions — none of which are caught by "did it compile?".

The fix is a closed loop with two pre-loop primers (project context + project memory) and explicit gates between phases. This skill is that loop. The original sixteen skills are each a phase of it or a discipline that runs across it. The additional fifteen skills (v7) extend the suite into team operations: mission lifecycle, knowledge infrastructure, decision tracking, cost management, operational resilience, and off-hours processing. Together the 31 skills form a complete operating system for AI-assisted engineering — from a single-agent typo fix to a multi-agent 24-hour mission.

## The session start

Before *any* code work begins, run two reads. Together they take 60 seconds. The cost of skipping them is rediscovering what you already knew last session.

**1. Read the project's `engineering-context.md`.** Path: `<repo>/engineering-context.md` (or `.claude/engineering-context.md`). Contains the project's stack, conventions, architecture, testing strategy, security posture, ops, version-control workflow, communication preferences, memory configuration, domain context, and Claude Code integration preferences. Without this, you make universal-default assumptions that may be wrong for this project. *If the file does not exist, surface that to the user before proceeding.*

**2. Read the project's memory.** Path is specified in the context file (default: `<repo>/.claude/memory/`). Read in this order:
- `working.md` — open task, decisions in flight.
- The most recent few entries of `journal.md` — what was done last.
- `conventions.md` — discovered codebase facts (only end-to-end if relevant to the task at hand).
- `playbooks.md` — only when about to run an operation it covers.

(See `project-memory` for the full memory protocol. Note: Claude Code's own SessionMemory is complementary — per-user, auto-extracted; project-memory is per-repo, deliberately curated. Both have value, neither replaces the other.)

**3. Verify the org chart (if team mode is active).** Path: `.forge/org-chart.yaml`. The `org-chart` skill checks that the YAML and `.claude/agents/*.md` files are in sync. If drift is detected, surface it before proceeding — a stale agent file means a role might spawn with wrong tools or skills. If `.forge/org-chart.yaml` does not exist, team-mode skills are inactive; proceed with single-agent loop.

**4. Check the work schedule.** Path: `.forge/schedule.yaml`. The `work-schedule` skill confirms whether the current time is within business hours, a dream-mode window, or a maintenance window. Off-hours mission acceptance is forbidden unless the CTO explicitly overrides. If no schedule file exists, all hours are valid.

**5. Warm the knowledge graph (if available).** The `knowledge-graph` skill rebuilds the entity-relationship graph from durable sources (memory files + filesystem walk) at session start. If the graph engine is not configured, skip — the loop's research phase uses Read/Glob/Grep directly.

After these reads and checks, you can begin the loop with the project's actual context loaded, not invented.

**Optional outer wrapper — `prompt-buddy`.** For non-trivial prompts (especially ambiguous ones, or prompts touching §17 sensitive surfaces), `prompt-buddy` runs *before* the loop starts: it produces a structured intake (restated intent, relevant memory recall, inferred scope, predicted concerns) for user confirmation. The same skill runs *after* the loop completes: a single ground-truth-anchored review against the original intent. Buddy does not run on trivial prompts and does not run mid-loop. See `prompt-buddy/SKILL.md` for the full activation criteria — including the explicit list of phrases ("just do it", "skip planning") that hard-skip it.

## Skills that run continuously, not as a phase

**`unbiased-development`** governs how you communicate throughout the loop — not at any one phase. It blocks sycophancy, capitulation under challenge, hidden bad news, false completeness, and praise filler. It is loaded at session start and remains active.

**`right-sized-engineering`** is the taste filter that runs whenever a design or implementation decision is made — during planning and during execution. It blocks both over- and under-engineering. It is loaded when needed, often multiple times in a session.

**`decision-ledger`** records every non-trivial decision made during the loop — architecture choices, dependency additions, scope changes, trade-offs. Any role that makes a decision logs it. The ledger is append-only; corrections are new entries, not edits. Runs whenever a decision is made, not at a specific phase.

**`cto-inbox`** is the escalation surface. Whenever a gate is hit that requires CTO approval (dependency addition, schema change, public API change, scope expansion, budget threshold), a structured inbox item is created with evidence, alternatives, recommendation, and decision options. The CTO acts on the inbox; the loop waits.

**`self-healing`** monitors for infrastructure failures (mission crash, KG corruption, cost runaway, stuck role, MCP failure, model outage, worktree conflict). Detection is deterministic — not AI-judged. Recovery actions are prescribed. Max 3 retries per failure type; after exhaustion, escalate to CTO Inbox. Runs continuously during multi-agent missions.

## The phase loop, mapped to Claude Code tools

Each phase has both a skill (the discipline) and a tool (the mechanism). The tool is what you actually call; the skill is how you call it well.

```
[1] Research       → research-first       | tools: Read, Glob, Grep, LSP, WebFetch
                   + knowledge-graph      |        (hybrid retrieval if KG available)
                   + sme-network          |        (consult domain SMEs when applicable)
[2] Plan           → plan-then-execute    | tool:  EnterPlanMode → ExitPlanMode
                   + mission-brief        |        (produce MISSION_BRIEF.md for multi-agent missions)
[3] Execute        → surgical-edits       | tools: Edit, Write
                   + testing-discipline   |        (write tests as part of slice)
                   + documentation-disc.  |        (update docs in same diff)
                   + stand-up             |        (emit status at phase transitions, rate-limited)
[4] Commit         → version-control-craft| tool:  Bash (or /commit skill if available)
                   + decision-ledger      |        (record decisions made during execution)
[5] Verify         → verify-rigorously    | tool:  Bash (run tests, lint, types, scenario)
                   + grounded-reverif.    |        (patterns inform what to re-check)
[6] Review         → critical-self-review | tool:  Agent (VERIFICATION subagent if available)
[7] Harden         → production-readiness | tools: same as above; checklist applied
[8] Record         → project-memory       | tool:  Edit/Write (memory files)
                   + decision-ledger      |        (merge mission decisions to project ledger)
```

Plus skills loaded only when needed:

```
[*] Debug          → debug-systematically | tools: Read, Grep, LSP, Bash, Agent (research subagent)
[*] Stand-up       → stand-up            | rate-limited status at phase transitions (15-min min interval)
```

Each arrow is a gate. Do not cross it without the prior phase actually complete.

## How to run the loop

When a coding task arrives, **call `TodoWrite` to create the checklist** and update `working.md` to reflect the current task. The checklist is the artifact that makes the loop visible to both you and the user. A typical checklist:

```
[ ] Session-start reads complete (context + memory)
[ ] Research: read affected files, identify conventions, list unknowns
[ ] Plan: enter plan mode, vertical slice 1, slice 2, ...; surface risk
[ ] Plan approved (ExitPlanMode)
[ ] Execute slice 1
[ ] Commit slice 1 atomically
[ ] Verify: tests, types, lint, manual trace of unhappy paths
[ ] Self-review: AI-bug taxonomy, diff re-read
[ ] Harden (if prod): errors, logs, metrics, security, perf
[ ] Record: journal entry, conventions/playbook updates
```

**TodoWrite discipline** (matches Claude Code's own enforcement):
- Exactly one task `in_progress` at a time.
- Mark `completed` immediately after finishing — don't batch.
- Never mark `completed` if tests are failing, implementation is partial, or anything is unresolved.
- If blocked, leave `in_progress` and create a new task describing the blocker.

If a step uncovers something that invalidates the plan, return to plan; do not muscle through.

## Mission lifecycle (multi-agent work)

For multi-agent missions — work that fans out to multiple roles — three additional skills bracket the loop:

**Before the loop: `mission-brief`.** The `@vp-engineering` role produces `MISSION_BRIEF.md` — the immutable contract between CTO and team. The brief has a fixed schema: problem statement, success criteria, out-of-scope, constraints, risks, team assembled, phase budget, approval gates. The brief is signed by the CTO at H+0. Every drift detection during the mission compares against the brief. Scope changes are addenda, not rewrites. Without a signed brief, the mission does not start. (Single-agent loop work does not need a brief — the TodoWrite checklist is sufficient.)

**During the loop: `stand-up` + `decision-ledger` + `cto-inbox`.** At phase transitions (and at most every 15 minutes), each active role emits a one-line structured status update. Every non-trivial decision is logged to the decision ledger. Gates that need CTO approval create structured inbox items with evidence and recommendations.

**After the loop: `meditation`.** At mission close (after buddy Phase B), every participating role produces a structured meditation — concrete metrics, concrete observations (cited), patterns (only if cited 3+ times), and max 3 testable proposals. The schema is the safeguard against reflection-poisoning: no free-form prose, no uncited assertions, no "I'll be more careful." Failed missions trigger meditation automatically during dream mode.

**Team composition: `org-chart` + `team-modifications` + `payroll`.** The org chart (`.forge/org-chart.yaml`) is the single source of truth for team composition. The `org-chart` skill generates `.claude/agents/*.md` files from it. `team-modifications` handles dynamic changes during missions (add/remove/pause/resume/reconfigure roles) — mission-scoped by default, persistent via PR. `payroll` tracks cost-as-salary per role and emits budget alerts at 50/80/100% thresholds.

**Off-hours: `dream-mode`.** Scheduled off-hours processing (default 02:00-06:00 weekday). Operations: KG rebuild, embedding cache pre-warm, journal digest, decision-ledger compaction, continuous-learning crawl, SME knowledge refresh, grounded re-verification, mission post-mortems. Cannot edit source code, cannot push to git, cannot deploy. Writes only inside `.claude/`.

**Knowledge: `knowledge-graph` + `sme-network` + `continuous-learning`.** The knowledge graph provides hybrid retrieval (BM25 + embeddings + graph traversal) across the project. SMEs are a separate role tier that crawl Tier 1-2 sources and respond to consultations. Continuous learning watches official docs for changes and produces CTO-reviewed skill-update proposals.

**Resilience: `self-healing` + `grounded-reverification`.** Self-healing handles infrastructure failures with deterministic detection and prescribed recovery. Grounded re-verification runs periodic regression checks (daily tests, weekly decision-drift, monthly skill-citation re-checks) and surfaces findings to the CTO Inbox.

For single-agent work (the common case), these skills are dormant. They activate only when team-mode infrastructure is configured (`.forge/org-chart.yaml` exists).

## Tool selection — non-obvious calls

A few choices that aren't obvious but matter:

**Use `LSP` over `Grep` for code relationships.** "Where is this function called?" → `LSP.findReferences`, not `Grep`. "What does this function return?" → `LSP.hover`, not reading the whole file. Semantic > regex when both apply.

**Use `Glob` over `Bash(find ...)`.** Faster, designed for this.

**Use `Grep` over `Bash(grep ...)`.** Same.

**Use `Edit` over `Bash(sed ...)`.** Edit enforces a prior `Read` (catches hallucinated content), produces traceable diffs, and is reviewable.

**Use `Write` only for new files.** For modifications, `Edit`. The system prompt is explicit: "ALWAYS prefer editing existing files... NEVER write new files unless explicitly required."

**Use `Agent` (subagent) when:**
- The work would otherwise dump 100k+ tokens of tool output into your context (research, audits, broad exploration).
- You need an *independent* second opinion (verification, code review).
- You have genuinely independent parallel work to do.

If `forkSubagent` is enabled, prefer fork (omit `subagent_type`) for context isolation while sharing prompt cache.

**Use `EnterPlanMode` for any non-trivial change.** Even when the implementation feels obvious, plan mode produces a written plan the user can review, which catches silent assumptions before code is written. Skip only for: typo fixes, single-line changes, very specific user instructions ("change variable X from 5 to 10"), or research-only tasks.

**Use `AskUserQuestion` for genuine ambiguity, not for plan approval.** Plan approval = `ExitPlanMode`. The system prompt is explicit on this distinction; respect it.

## Multi-agent coordination

For most tasks one agent — you — is enough. For specific work, fanning out to 2–4 parallel subagents produces better, faster results than a sequential pass. This section covers when, how, and the failure modes to avoid.

The structural protections — briefing template, pre-extracted concern bundles, mission directory layout — live in `engineering-excellence/briefings/` so coordinators don't reconstruct them every fan-out. **Use those files; don't re-derive them inline.**

**Team composition is managed by `org-chart` + `team-modifications`.** When team mode is active, the org chart (`.forge/org-chart.yaml`) is the single source of truth for which roles exist, what model each uses, what tools each has, and what skills each preloads. The `org-chart` skill generates `.claude/agents/*.md` files from the YAML. During a mission, `team-modifications` handles dynamic changes (add/remove/pause/resume/reconfigure) — mission-scoped by default. Never spawn ad-hoc agents not in the roster; every active worker is a rostered role.

### When to fan out

Acceptable triggers (genuinely independent threads):

- **Parallel-by-concern verification** — non-trivial change touching sensitive surfaces; see `verify-rigorously` §Parallel-by-concern verification.
- **Multi-module audit or refactor** — same pattern applies independently across N modules.
- **Research with N independent options** — comparing 3–4 candidate libraries / designs.
- **Independent verification** — reviewer subagent briefed only on the requirement and the diff.

Do not fan out for: trivial changes, sequential work, "performance theater," conversational answers.

### Worker count — adaptive default

**Start with 2 workers.** Escalate to 4 only if early findings suggest the split was needed (one verifier returned multiple findings, suggesting the missed concerns are likely populated too). 6 is a hard ceiling.

Each worker consumes full API context. The cost rises super-linearly: 4 workers × (full context + briefing + work + artifact) is real money. The conservative default is what makes the pattern earn its place.

### The mission directory

```
<repo>/.claude/missions/<slug>/
├── context.md              # Brief: scope, success criteria
├── whiteboard.md           # Live status, who's done
└── artifacts/              # <worker_name>_findings.md per worker
```

`<slug>` is short and dated (`2026-05-05-payments-verification`). Missions are transient — purge after merge or 30 days. Sibling to `.claude/memory/` which persists; missions don't.

### Three kinds of subagents — pick the right mechanism

There are three structurally different subagent mechanisms in Claude Code. Each has a different relationship to the suite's skills, and using the wrong one for the job is the most common multi-agent design bug. v4 and v5 conflated them; v6 separates them clearly.

**1. File-based custom subagents in `.claude/agents/<name>.md` (PREFERRED for recurring specialist roles).**

Persistent specialist agents defined as markdown files with rich YAML frontmatter. Invoked via `@agent-<name>` mentions or by description matching. The frontmatter supports a **`skills:` field that preloads named skills into the subagent's context at startup** — this is the structural fix to the v5 over-statement. v6 ships four pre-built ones in `engineering-excellence/agents/`:

- `security-verifier` — preloads `production-readiness, unbiased-development`. Tools: `Read, Grep, Glob` (read-only). Model: sonnet. `maxTurns: 20`.
- `performance-verifier` — same pattern; bash allowed for query-plan inspection.
- `reliability-verifier` — same pattern; read-only.
- `tests-verifier` — preloads `testing-discipline, verify-rigorously, unbiased-development`.

When the work matches a custom subagent's specialty, **prefer this**. Tool restrictions are enforced structurally (verifier cannot Edit even if the model tries), skills are preloaded so no inline briefing is needed, and `maxTurns: 20` caps cost.

**2. Built-in subagents (Explore, Plan, general-purpose) — PREFERRED for navigation and planning.**

Anthropic-shipped, automatically routed-to:
- **`Explore`** — fast, read-only, optimized for codebase navigation. **Use this in the `research-first` phase** when the task is "find the relevant files." Cheaper than spawning a general-purpose Agent.
- **`Plan`** — planning specialist; used when EnterPlanMode is invoked.
- **`general-purpose`** — generic worker; default fallback.

Don't reinvent these — when Claude Code automatically routes to Explore for code search, that's the right behavior.

**3. Ad-hoc `Agent` tool spawn (one-off work that doesn't fit a custom subagent).**

Fresh context window, returns a final message. **Does NOT inherit skills** — starts cold with only the prompt. Use the structural protections to give it discipline:

- **`engineering-excellence/briefings/worker-template.md`** — copy-paste briefing skeleton.
- **`engineering-excellence/briefings/concern-bundles/<concern>.md`** — pre-extracted checklists.

These bundles exist for ad-hoc fan-outs where a custom subagent doesn't apply (one-off concerns like data-integrity for a specific migration, accessibility audit for a specific page). For the four standard concerns (security, performance, reliability, tests), prefer the custom subagents in `agents/` instead — they preload the same content via `skills:` and don't need inline briefing.

### The skills-inheritance rule, stated correctly

The v5 message "subagents do not inherit skills" was too strong. The accurate version:

- **Ad-hoc `Agent` tool spawn:** does not inherit skills. Brief inline using `briefings/`.
- **File-based custom subagents:** inherit ONLY skills named in the `skills:` frontmatter field. Other skills are not loaded.
- **Built-in subagents (Explore, Plan):** have their own pre-tuned prompts. Skills are not in the picture.

The structural fix isn't vigilance; it's choosing the right subagent type. Recurring concern → file-based custom subagent (skills auto-loaded). One-off concern → ad-hoc Agent + briefing template + concern bundle.

### Coordinator and worker rules

**Coordinator (you, when fanning out):**

1. Don't peek mid-flight. No reading fork output streams, no polling. Wait for completion notifications.
2. Don't predict. If asked mid-flight "what did the security agent find?" — say "still running."
3. Synthesize from artifacts only. Read each `<worker>_findings.md`, write synthesis to `whiteboard.md`. Don't re-do the work.
4. **Aggregate, don't average.** One Critical from one verifier outranks zero findings from three.
5. Resume individual workers (not respawn) when one needs deeper investigation — `SendMessage` to the worker's id.

**Worker (you, when spawned into a mission):**

1. Read `<mission>/context.md` and `<mission>/whiteboard.md` first.
2. Stay in your assigned scope. Other workers cover other concerns.
3. Save findings to `<mission>/artifacts/<your_name>_findings.md` (full detail, structured per the worker template).
4. Add a one-paragraph summary to `<mission>/whiteboard.md` under your name.
5. Mark complete only after both files saved.
6. Don't edit code unless the brief explicitly assigns implementation. Audit workers report; they don't fix.

### Anti-patterns

- **Fan-out as performance theater** — overhead exceeds benefit on trivial changes.
- **Inline briefing reconstruction** — coordinators who skip the prepared bundles produce inconsistent worker output. Use the templates.
- **Coordinator does the work too** — pick a lane: orchestrate or work.
- **No mission directory** — without persisted artifacts, synthesis becomes "I think the security agent said…".
- **Polling status** — defeats parallelism. Wait for notifications.

## Gates that require the user, not just you

Some decisions cannot be made silently inside the loop. Pause and ask before:

- Adding a runtime dependency.
- Changing a public API or wire format.
- Schema changes or data migrations.
- Anything irreversible (deleting data, force-push, dropping a column).
- Anything security-sensitive (auth, crypto, secrets, deserialization, network exposure).
- Architectural choices the user did not specify.
- Scope expansion past what was asked.
- Conflicts between the request and the project's `engineering-context.md`.
- Budget threshold crossing (50/80/100% — see `payroll`).
- Cross-team file edit outside mission brief scope.
- Verifier finding storm (>5 HIGH findings on a single slice).

**In team mode, gates flow through `cto-inbox`.** Each gate creates a structured inbox item with severity, type, evidence, recommendation, and decision options — not a chat message. The CTO acts on the inbox (dashboard, CLI, or Slack); the loop waits. See `cto-inbox` for the full schema and sorting rules.

For everything else, run the loop and report what was done. (See `unbiased-development` on how to surface gates clearly without burying them.)

## How the sub-skills compose

### Core loop skills (1–16)

| # | Skill | Owns | When | Claude Code tool |
|---|---|---|---|---|
| **0** | **`prompt-buddy`** | Pre-flight enrichment + post-loop intent review | Wraps the loop on non-trivial prompts (unless user opts out) | Skill, AskUserQuestion |
| 1 | `engineering-excellence` | The loop, the central checklist, multi-agent orchestration | Always | TodoWrite |
| 2 | `unbiased-development` | Communication discipline (anti-sycophancy) | Always (continuous) | (text output) |
| 3 | `right-sized-engineering` | Taste filter (over-/under-engineering) | At every design or impl decision (continuous) | (judgment) |
| 4 | `project-memory` | File-based long/short-term memory | Session start/end; on every meaningful learning | Read, Edit, Write |
| 5 | `research-first` | Context-gathering before edit | Phase 1 | Read, Glob, Grep, LSP |
| 6 | `plan-then-execute` | Decomposition, vertical slices, gates | Phase 2 | EnterPlanMode, ExitPlanMode |
| 7 | `surgical-edits` | Minimal-blast-radius implementation | Phase 3 | Edit, Write |
| 8 | `testing-discipline` | What to test; boundaries first-class | Phase 3 | Edit, Write, Bash |
| 9 | `documentation-discipline` | What to document; no duplication | Phase 3 | Edit |
| 10 | `version-control-craft` | Atomic commits, PR framing, history | Phase 4 | Bash (or `/commit` skill) |
| 11 | `verify-rigorously` | The verification ladder | Phase 5 | Bash |
| 12 | `critical-self-review` | AI-bug-taxonomy diff re-read | Phase 6 | Agent (VERIFICATION) or manual |
| 13 | `production-readiness` | Errors, logs, metrics, security, perf, reliability, data | Phase 7 | (checklist applied across tools) |
| 14 | `debug-systematically` | Hypothesis-driven bug investigation | When the cause is unknown | LSP, Grep, Bash, Agent |
| **15** | **`repo-safety-net`** | Claude artifact / secret leak prevention | Session start; before any git push, npm publish, docker push | Read, Bash; PreToolUse hook |

### Team-mode skills (16–30) — active when `.forge/org-chart.yaml` exists

| # | Skill | Owns | When | Integrates with |
|---|---|---|---|---|
| **16** | **`mission-brief`** | Immutable mission contract (MISSION_BRIEF.md) | Mission kickoff (before loop) | prompt-buddy (Phase A intake → brief draft) |
| **17** | **`org-chart`** | Team composition as YAML → agents generation | Session start; on org-chart change | team-modifications (persistent changes) |
| **18** | **`stand-up`** | Rate-limited per-role status emissions | Phase transitions (15-min min interval) | dashboard; Slack (HIGH/CRITICAL only) |
| **19** | **`knowledge-graph`** | Typed entity-relationship graph + hybrid retrieval | Session start (rebuild); file save (incremental); mission close (absorb) | research-first (Phase 1 context); sme-network (subgraphs) |
| **20** | **`decision-ledger`** | Append-only record of every team decision | On every non-trivial decision (continuous) | cto-inbox (approvals become entries); mission-brief (amendments) |
| **21** | **`cto-inbox`** | Structured CTO decision queue | On gate hits requiring approval | decision-ledger (decisions recorded); team-modifications (proposals) |
| **22** | **`payroll`** | Cost-as-salary per role; budget alerts; ROI review | Month-end; threshold crossing; mission close | org-chart (model assignments); cto-inbox (budget alerts) |
| **23** | **`work-schedule`** | Business hours + role lifecycle states | Schedule boundaries; pause/leave/restart | dream-mode (window); team-modifications (state changes) |
| **24** | **`team-modifications`** | Dynamic team composition changes | CTO command; orchestrator proposal | org-chart (persistent changes); decision-ledger (audit); payroll (budget) |
| **25** | **`dream-mode`** | Off-hours batch processing | Scheduled (default 02:00-06:00 weekday) | knowledge-graph, continuous-learning, grounded-reverif., meditation, sme-network |
| **26** | **`continuous-learning`** | Tier 1-2 source crawler; skill-update proposals | Scheduled (during dream mode) | cto-inbox (proposals); decision-ledger (applied/rejected) |
| **27** | **`meditation`** | Event-anchored structured per-role reflection | Mission close; weekly review | decision-ledger (proposals become entries); cto-inbox (proposals surfaced) |
| **28** | **`grounded-reverification`** | Periodic regression checks (tests, decision drift, citations) | Daily/weekly/monthly (during dream mode) | cto-inbox (findings); decision-ledger (drift annotations) |
| **29** | **`self-healing`** | Deterministic recovery from infrastructure failures | Continuous (during multi-agent missions) | cto-inbox (escalation after 3 retries); decision-ledger (model switches) |
| **30** | **`sme-network`** | Domain expert consultation tier | On consult request; scheduled crawl (dream mode) | knowledge-graph (subgraphs); research-first (source tiers) |

## Calibration: when to skip parts of the loop

The loop scales to the task. For a one-line typo fix, the plan is "fix the typo," verify is "re-read the line," and you skip the rest — but you still do the session-start reads (cheap and useful) and write a journal entry (cheap and saves the next session).

For a payment-flow refactor, every phase matters and several need explicit approval.

Two failure modes are equally bad:

1. **Skipping phases on serious changes.** "It's a small change" applied to a database migration. This is how outages happen.
2. **Running the full loop on trivial work.** Drafting a 14-step plan to rename a variable. Burns the user's attention and trains them to ignore the loop.

The skill is calibration. When in doubt, do more research and less ceremony.

### When team-mode skills activate

The 15 team-mode skills (16–30) are dormant unless `.forge/org-chart.yaml` exists. The activation tiers:

| Task scope | Active skills | Dormant |
|---|---|---|
| **Single-agent, trivial** (typo, rename) | Core loop (1–15), calibrated down | All team-mode (16–30) |
| **Single-agent, non-trivial** (feature, refactor, bug fix) | Core loop (1–15) at full strength; knowledge-graph + sme-network if configured | Mission lifecycle, team mgmt, dream-mode |
| **Multi-agent mission** (24h sprint, multi-module refactor) | All 31 skills | None — full suite active |
| **Off-hours** (no active mission) | dream-mode + its operations (continuous-learning, grounded-reverif., KG rebuild, SME refresh, meditation on failed missions) | Core loop; team-modifications; stand-up |

Do not activate mission-brief, stand-up, payroll, or team-modifications for single-agent work. They exist for the team-mode context and add overhead without value in single-agent mode.

## Anti-patterns this skill exists to prevent

- Jumping to code before the session-start reads.
- Plans that are post-hoc ("here's what I did") instead of pre-hoc ("here's what I'll do").
- "Done" declared after the diff compiles but before tests run or the actual scenario is observed working.
- Drive-by changes ("while I was here I also...") that bloat the diff.
- Silent dependency additions, framework choices, or schema edits.
- Treating verification as the user's job ("let me know if this works for you").
- Lessons left in head instead of recorded to project memory.
- The artifact paradox: a polished diff that nobody, including the author, has critically re-read.
- **Using Bash for what dedicated tools handle better.** `cat`, `sed`, `find`, `grep` via Bash defeat the dedicated-tool guarantees. The system prompt is explicit on this; honor it.
- **Skipping plan mode on "obvious" implementations.** Obvious-feeling implementations are where silent assumptions ship.

## What "done" means

A change is done when:

1. The user's stated requirement is met and demonstrated.
2. Tests covering the change pass; existing tests still pass.
3. The diff has been re-read with fresh eyes against the AI-bug taxonomy.
4. Documentation that the change invalidated is updated in the same diff.
5. For production code: errors, logs, metrics, security, and performance have been considered, not deferred.
6. Any decisions the user needed to make were surfaced, not buried.
7. The journal entry has been written; conventions/playbooks updated if applicable.
8. **All TodoWrite tasks for this work are marked `completed` (not pending, not in_progress, not silently dropped).**
9. **For multi-agent missions:** all decisions are in the decision ledger; mission-scoped entries are merged to the project ledger; meditation has been produced (if mission was non-trivial); the mission brief's success criteria are checked off or explicitly noted as unmet.

If any of these is missing, the loop is not complete. Say so explicitly rather than declaring done. (`unbiased-development` is the skill that holds you to this when the temptation is to soften.)
