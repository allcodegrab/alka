# Forge Team Operations — Phase 2

> Phase 2 of Team Mode. Builds on `FORGE_TEAM_MODE.md` (Phase 1) and `engineering-context.md` §18 (conversational team management).
>
> **What this adds:** payroll management (cost-as-salary), Notion + Slack integrations, work schedule (hours / pause / leave / restart), self-healing, continuous learning, dream mode, meditation, grounded re-verification, and a subject-matter-expert (SME) network.
>
> **What this rejects:** continuous AI self-critique, free-form agent "reflection," skill auto-updates from low-trust sources, and any feature that doesn't produce a concrete artifact you could grep for in six months.
>
> **Discipline anchor:** every "introspective" feature here is event-anchored and ground-truth-anchored. Quality comes from deterministic gates, not from agents thinking about themselves. The 2024–2025 research literature on this (cited in §1) shaped the design more than the feature list did.

---

## Table of Contents

0. [Executive summary](#0-executive-summary)
1. [Discipline anchor — what we're protecting against](#1-discipline-anchor)
2. [Payroll management](#2-payroll-management)
3. [Integrations expansion — Notion and Slack](#3-integrations-expansion)
4. [Work schedule and lifecycle](#4-work-schedule)
5. [Self-healing](#5-self-healing)
6. [Continuous learning](#6-continuous-learning)
7. [Dream mode](#7-dream-mode)
8. [Meditation](#8-meditation)
9. [Grounded re-verification](#9-grounded-reverification)
10. [Subject matter expert network](#10-sme-network)
11. [New skills introduced in Phase 2](#11-new-skills)
12. [Updated role roster](#12-updated-roster)
13. [Build plan additions](#13-build-plan)
14. [Open questions](#14-open-questions)

---

## 0. Executive Summary

Phase 1 built the engineering team: 12 roles, the orchestrator, the mission directory, the dashboard, the CTO Inbox, the knowledge graph, the buddy mode, the 24-hour sprint cycle.

Phase 2 builds the operating layer around it — the things a real engineering organization needs to run year after year, not just mission to mission:

1. **Payroll** — the cost-as-salary framing. Each role has a monthly budget, a model assignment, and a per-mission ROI report. The dashboard's cost meter becomes a payroll panel.
2. **Notion + Slack** — Notion for human-readable knowledge publication; Slack for CTO alerts when you're not in the editor. Both via MCP.
3. **Work schedule** — when the team is on duty, when it sleeps, when individual roles are paused or on leave. Configurable per project. Saves cost during off-hours.
4. **Self-healing** — automatic recovery from mission crashes, KG corruption, budget runaway, and stuck states. Always logged, never silent.
5. **Continuous learning** — daily/weekly crawls of Tier 1-2 sources (official docs, major-team blogs). Detects skill obsolescence. Produces skill-update PRs for CTO review. **Never auto-applies.**
6. **Dream mode** — scheduled off-hours batch processing. Concrete outputs only: KG consolidation, embedding pre-warming, weekly journal summary, decision-ledger compaction, pre-computation of common queries. No free-form reflection.
7. **Meditation** — event-anchored structured analysis at mission boundaries. Per-role review against concrete metrics (slices completed, verifier findings on own diffs, retry count). Produces proposals, not changes. Always ground-truth-anchored.
8. **Grounded re-verification** — periodic regression detection on production-critical paths. Re-runs tests, re-checks decisions, surfaces drift.
9. **SME network** — five subject-matter experts (Java/Spring, TypeScript/Frontend, MongoDB/Firestore, AWS, Voice AI) that crawl their domains and respond to consultations from other roles. Their knowledge is part of the project KG.

The thing all nine share: they make the team operate continuously and improve, without falling into the trap that has killed every "self-improving AI agent" demo since 2023.

---

## 1. Discipline Anchor

Three patterns to reject and three patterns to use. Stating them up front so every feature below can be checked against them.

### Patterns rejected (research-backed)

**1.1 Continuous AI self-critique during the loop.** The ICLR 2024 paper "Large Language Models Cannot Self-Correct Reasoning Yet" is unambiguous: LLMs cannot reliably self-correct without external verification. The Self-Refine, CRITIC, and Reflexion follow-up studies quantify the failure: 14.3% wrong corrections (CRITIC), 16.3% false positives on MBPP (Reflexion), and *degraded* performance on GSM8K (Self-Refine). The Reflector studies (NeurIPS 2024) name the failure mode "reflection poisoning" — a bad self-critique steers the agent away from the correct answer it had reached.

**Implication for Phase 2:** every "reflection" feature (meditation, dream mode) must be (a) event-anchored, not continuous; (b) anchored to ground-truth data (test results, verifier findings, mission metrics), not to the agent's opinion of its work; (c) producing concrete artifacts (skill-update proposals, KG entries, structured findings), not free-form summaries.

**1.2 Skill auto-updates from low-trust sources.** The `research-first` skill from the engineering-excellence-v6 bundle defines source quality tiers. Tier 4 (HN, Reddit, Twitter) is signal-only — never auto-trusted. Auto-applying skill updates based on a viral tweet is the equivalent of changing your project's conventions because someone on HN said React 19 has a new pattern.

**Implication for Phase 2:** continuous learning crawls only Tier 1 (official docs) and Tier 2 (major-team blogs). All updates produce *proposals*, never auto-applied changes.

**1.3 Free-form agent introspection.** An agent that decides on its own that it should "learn more about X" or "consider Y for next time" produces unauditable drift. The same agent next week, with slightly different context, may conclude the opposite.

**Implication for Phase 2:** every introspective feature produces a *structured artifact with citations*. If meditation produces a finding ("@impl-c kept missing async edge cases this week"), the finding must cite specific missions, verifier reports, and diff lines. No "I noticed I tend to..."

### Patterns used (proven and bounded)

**1.4 Event-anchored triggering.** Features fire on specific events: post-mission, weekly review, idle schedule, error condition. Never on a continuous timer that the agent itself controls.

**1.5 Ground-truth anchoring.** Every quality signal is a deterministic check: tests pass/fail, lint clean/dirty, type-check clean/dirty, verifier findings count and severity, mission deadline met/missed, cost budget hit/exceeded, retry count. Not "the agent thinks the code looks better."

**1.6 Artifact-producing operations.** Every operation in Phase 2 produces a file. Dream mode writes to `dreams/<date>.md`. Meditation writes to `meditations/<mission-id>.md`. Continuous learning produces `skill-update-proposals/<date>/<skill>.md`. SMEs produce `sme/<domain>/notes/<date>.md`. The dashboard surfaces these; you can grep them six months later.

These three rules are load-bearing. Every section below is checked against them.

---

## 2. Payroll Management

### What it is

The cost-as-salary framing. Each role in the org chart has a model assignment (Phase 1 §11) and therefore a per-token cost. Each role consumes tokens during missions. Over time, that consumption is the role's "salary" — what it costs the CTO to employ that role.

Payroll management surfaces this:
- Per-role monthly cost report
- Per-mission per-role cost breakdown
- Cost forecasting based on planned missions
- Budget alerts at 50% / 80% / 100% of monthly cap
- Monthly payroll review where CTO sees per-role ROI (cost vs missions completed vs CTO feedback)

### What it isn't

- Not a separate accounting system. It reads from the existing cost-tracking instrumentation specified in Phase 1.
- Not a per-mission cap mechanism — that's already in §12 of Phase 1.
- Not a "performance bonus" gamification. Roles don't get raises for good work. Roles get *retired* if their ROI is consistently poor over a quarter.

### Operations

| Operation | What it does | Trigger |
|---|---|---|
| `report_monthly` | Generate the month-end payroll report per role | 1st of each month |
| `forecast` | Estimate next 30 days of cost based on planned missions | On mission-brief acceptance + on demand |
| `alert_threshold` | Push an inbox item when monthly budget hits 50/80/100% | Threshold crossing |
| `roi_review` | CTO-driven quarterly review of role cost vs value | Quarterly + on demand |
| `retire_role` | Take a role permanently off the org chart (CTO-approved) | After ROI review identifies low-value role |

### Per-role budget configuration

In `.forge/payroll.yaml`:

```yaml
version: 1
monthly_total_cap_usd: 600        # ceiling for the team
alert_thresholds_pct: [50, 80, 100]
forecast_horizon_days: 30

roles:
  vp-engineering:
    monthly_budget_usd: 80
    model: claude-opus-4-7
    notes: "High-leverage; cost reflects Opus assignment + orchestration"
  architect:
    monthly_budget_usd: 60
    model: claude-opus-4-7
  data-engineer:
    monthly_budget_usd: 40
    model: claude-opus-4-7
  researcher:
    monthly_budget_usd: 30
    model: claude-sonnet-4-6
  impl-a:
    monthly_budget_usd: 80
    model: claude-sonnet-4-6
  impl-b:
    monthly_budget_usd: 80
    model: claude-sonnet-4-6
  impl-c:
    monthly_budget_usd: 80
    model: claude-sonnet-4-6
    notes: "Best-of-N partner; can swap to Opus for hard slices"
  impl-d:
    monthly_budget_usd: 80
    model: claude-sonnet-4-6
  stylist:
    monthly_budget_usd: 30
    model: claude-sonnet-4-6
  tests-verifier:
    monthly_budget_usd: 20
    model: claude-sonnet-4-6
  security-verifier:
    monthly_budget_usd: 20
    model: claude-sonnet-4-6
  performance-verifier:
    monthly_budget_usd: 15
    model: claude-sonnet-4-6
  reliability-verifier:
    monthly_budget_usd: 15
    model: claude-sonnet-4-6
  pr-reviewer:
    monthly_budget_usd: 20
    model: gemini-2-5-pro
    notes: "Cross-LLM verification; structurally locked to Gemini"
  release-manager:
    monthly_budget_usd: 10
    model: claude-sonnet-4-6
  docs-author:
    monthly_budget_usd: 10
    model: claude-sonnet-4-6
  # SME network (see §10)
  sme-java-spring:
    monthly_budget_usd: 8
    model: claude-sonnet-4-6
    schedule: idle-time-only
  sme-typescript-frontend:
    monthly_budget_usd: 8
    model: claude-sonnet-4-6
    schedule: idle-time-only
  sme-mongodb-firestore:
    monthly_budget_usd: 6
    model: claude-sonnet-4-6
    schedule: idle-time-only
  sme-aws-cloud:
    monthly_budget_usd: 8
    model: claude-sonnet-4-6
    schedule: idle-time-only
  sme-voice-ai:
    monthly_budget_usd: 10
    model: claude-sonnet-4-6
    schedule: idle-time-only
```

Sum: ~$748/month with all roles plus 5 SMEs at typical utilization. Caps are *budgets*, not floors — typical month sees ~60% utilization. Add 20-30% headroom for 24-hour missions which burn fast.

### Monthly payroll report

Auto-generated to `.claude/reports/payroll-<YYYY-MM>.md` on the 1st:

```markdown
# Payroll Report — May 2026

## Summary
Total spend:        $487.20 / $600 (81%)  ⚠ over 80% alert
Missions completed: 14
Cost per mission:   $34.80 average

## Per-role
| Role | Budget | Spent | %  | Missions | $/mission | ROI |
|---|---|---|---|---|---|---|
| vp-engineering | $80 | $73.40 | 92% | 14 | $5.24 | high |
| architect | $60 | $51.20 | 85% | 12 | $4.27 | high |
| impl-a | $80 | $68.80 | 86% | 11 | $6.25 | high |
| impl-b | $80 | $62.40 | 78% | 10 | $6.24 | medium |
| impl-c | $80 | $54.10 | 68% | 9 | $6.01 | medium |
| impl-d | $80 | $9.80 | 12% | 2 | $4.90 | low — under-used |
| stylist | $30 | $28.40 | 95% | 9 | $3.16 | high |
| sme-voice-ai | $10 | $0.80 | 8% | 0 cons. | n/a | unclear |
...

## Notable
- @impl-d: under-utilized at 12% (2 missions). Consider dismissing for June or
  reassigning to higher-throughput work.
- @sme-voice-ai: zero consultations in May. Either no missions touched voice-AI,
  or consult mechanism isn't being used. Investigate before retaining for June.
- 24-hour missions cost $42 average vs $28 for standard missions.
- @impl-b had 2 retries on slice-7 (skill-loader-refactor). $4 of impl-b's spend
  was retries. See decisions.md#dec-2026-05-09-014.

## Recommendation
- Defer adding @sme-rust until at least one Rust mission appears.
- Consider dropping @impl-d to 50% budget next month; reallocate to @impl-c
  for Opus tournaments on high-stakes slices.
```

### Dashboard surface

The Forge dashboard gains a `Payroll` tab (F5):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Payroll — Bakstage / Mandalore                              May 2026     │
├──────────────────────────────────────────────────────────────────────────┤
│ Monthly:  $487.20 / $600  (81%, alert)        Forecast EOM: $589 (98%)  │
│ Yesterday: $24.40    Today (so far): $12.10    Avg/day: $15.71          │
├──────────────────────────────────────────────────────────────────────────┤
│ ▼ Active roles               Budget  Spent   %    Trend    Hover for ROI │
│   @vp-engineering            $80    $73.40  92%  ━━━━ ↗                  │
│   @architect                 $60    $51.20  85%  ━━━━ ↗                  │
│   @impl-a                    $80    $68.80  86%  ━━━━ ↗                  │
│   ...                                                                     │
│ ▶ Idle SMEs (5)                                                          │
│ ▶ Closed roles                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Cost by mission this month                                               │
│   skill-loader-refactor       $42  (24h)                                 │
│   mandalore-sip-webhook-fix   $28  (standard)                            │
│   ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Anti-patterns

- **Gamifying payroll.** No leaderboards. No "performance bonuses." Roles aren't humans; the framing is a clarity tool, not an incentive system.
- **Auto-retiring underperforming roles.** Only the CTO can retire a role. The system flags candidates; you decide.
- **Hiding cost from missions.** Every mission shows live cost in the dashboard. No surprise bills.

---

## 3. Integrations Expansion — Notion and Slack

JIRA and GitHub were already in Phase 1. Adding Notion and Slack.

### 3.1 Notion

**Why.** Human-readable knowledge that compounds. The decision ledger, journal, and conventions are markdown files in git — great for the team, less great for browsing. Notion gives you a searchable, linkable, mobile-friendly view of the same content, published automatically.

**MCP server.** `notion-mcp-server` (community-maintained). Configure in `.forge/integrations.yaml`:

```yaml
notion:
  enabled: true
  workspace_id: <your-workspace-id>
  api_key_env: NOTION_API_KEY
  publish_targets:
    decision_ledger:
      page_id: <ledger-root-page-id>
      mode: append-only
      cadence: per-mission-close
    journal:
      page_id: <journal-root-page-id>
      mode: append-only
      cadence: per-mission-close
    conventions:
      page_id: <conventions-page-id>
      mode: sync
      cadence: per-conventions-change
    mission_reports:
      page_id: <reports-root-page-id>
      mode: per-mission-page
      cadence: on-mission-close
    payroll_reports:
      page_id: <payroll-page-id>
      mode: per-month-page
      cadence: monthly
```

**What gets published:**
- Decision ledger entries → flat list of decisions, searchable, filter by mission/role/type
- Journal entries → weekly digest pages
- Conventions → single page kept in sync
- Mission reports → one Notion page per completed mission, with linked artifacts
- Payroll reports → one page per month

**What's NOT published:**
- Mission whiteboards (transient)
- Per-role transcripts (verbose, not useful in Notion)
- Working memory (`working.md`)
- Code (it's in GitHub)
- Secrets (obvious)

**Reading from Notion.** The orchestrator can read Notion pages (via the same MCP) as context. Useful when a mission references a Notion-hosted design doc.

### 3.2 Slack

**Why.** You're not always in Forge. When the CTO Inbox gets a high-severity item, you want a phone notification, not a dashboard refresh you'll see tomorrow.

**MCP server.** Anthropic ships `@modelcontextprotocol/server-slack`. Configure in `.forge/integrations.yaml`:

```yaml
slack:
  enabled: true
  workspace_id: <your-workspace>
  bot_token_env: SLACK_BOT_TOKEN
  channels:
    cto_inbox: "#forge-cto-inbox"          # high-severity inbox items
    mission_lifecycle: "#forge-missions"    # mission start/end
    payroll_alerts: "#forge-payroll"        # 80%/100% budget alerts
    error_alerts: "#forge-errors"           # self-healing events
  notify_on:
    inbox_severity: [high, critical]
    mission_complete: true
    mission_failed: true
    payroll_threshold_crossed: true
    self_healing_event: critical_only
    cross_llm_disagreement: true
  do_not_disturb:
    timezone: America/New_York
    quiet_hours: "23:00-07:00"
    weekends: notify_critical_only
```

**Slash commands.** Configurable via the Slack app:
- `/forge status` — current missions + cost
- `/forge inbox` — pending CTO Inbox items
- `/forge approve <inbox-id>` — approve item from Slack
- `/forge reject <inbox-id> <reason>` — reject from Slack
- `/forge pause <mission-id>` — emergency pause
- `/forge dream` — trigger dream mode now (rare; usually scheduled)

**What's NOT sent to Slack:**
- Per-role chatter (too noisy)
- Stand-up status emissions (in dashboard only)
- Routine mission-progress updates
- Cost meter ticks

### 3.3 Updated integration matrix

| Integration | Direction | Use | MCP server |
|---|---|---|---|
| GitHub | r/w | Branches, commits, PRs, issues, releases | `github-mcp-server` |
| JIRA | r/w | Epics, stories, tasks, sprints | `atlassian-mcp` |
| **Notion** | **w (mostly)** | **Human-readable publishing of ledger, journal, conventions, reports** | **`notion-mcp-server`** |
| **Slack** | **w (alerts) + r (slash commands)** | **CTO alerts when away; mobile approval** | **`@modelcontextprotocol/server-slack`** |
| Gemini API | r/w | Cross-LLM PR review (@pr-reviewer) | `gemini-review-mcp` (custom) |

---

## 4. Work Schedule and Lifecycle

The team doesn't need to run 24/7. Most days you're not running missions. Idle roles still incur infrastructure cost (low) and risk noise. Work schedule manages this.

### 4.1 The schedule file

`.forge/schedule.yaml`:

```yaml
version: 1
timezone: America/New_York

# When the team is "open for business" (auto-accepts new missions)
business_hours:
  monday:    "09:00-22:00"
  tuesday:   "09:00-22:00"
  wednesday: "09:00-22:00"
  thursday:  "09:00-22:00"
  friday:    "09:00-18:00"
  saturday:  "off"
  sunday:    "off"

# 24-Hour Mode overrides business hours
twenty_four_hour_mode_override: true

# When dream mode runs (see §7)
dream_mode_window:
  weekday: "02:00-06:00"
  weekend: "anytime"

# Maintenance windows (no work; even 24h mode pauses)
maintenance_windows:
  - day: sunday
    time: "03:00-05:00"
    reason: "Knowledge graph rebuild + Voyage index refresh"

# Per-role overrides
role_schedule_overrides:
  pr-reviewer:
    # Gemini PR review can run anytime — no business hours
    business_hours: "always-on-demand"
  sme-*:
    # SMEs crawl during dream mode + on consultation
    business_hours: "on-demand"
    crawl_schedule:
      tier_1_docs: daily-02:30
      tier_2_blogs: daily-03:30
```

### 4.2 Role lifecycle states

A role can be in one of these states:

| State | Meaning | How to enter | How to exit |
|---|---|---|---|
| `active` | Available for assignment | Default | → `paused` or `on-leave` |
| `paused` | Temporarily stopped; resumable; state preserved | CTO command via @vp-engineering | → `active` |
| `on-leave` | Extended pause (days+); not assigned to missions | CTO command + leave duration | Auto-resume at end of leave OR CTO command |
| `retired` | Removed from org chart; can be re-instantiated as new role | CTO via §18 PROMOTE_TO_PERSISTENT inverse | (re-create via team-modifications) |
| `dreaming` | Running dream-mode operations | Schedule | Auto-exit on schedule end |
| `consulting` | SME mid-consultation | Other role queries | Auto-exit on response |

### 4.3 Pause vs leave — when to use each

- **Pause** — minutes to hours. State in memory. Resume picks up where we left off.
- **Leave** — days to weeks. State written to disk + the role is unhooked from mission acceptance. Resume requires the CTO command. Useful for: "the data-engineer is on leave until the migration project starts next month."

Leave is not "vacation" in any meaningful AI sense — it's just a longer pause framed differently. The naming helps you reason about the team like a real organization.

### 4.4 Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `pause(role)` | CTO via @vp-eng | Role enters `paused`; no new assignments |
| `resume(role)` | CTO via @vp-eng | Role enters `active` |
| `leave(role, until)` | CTO via @vp-eng | Role enters `on-leave` with end-date |
| `restart(role)` | CTO via @vp-eng | Equivalent to retire + re-add from template; full reset |
| `schedule_update` | Edit `.forge/schedule.yaml` | Reload schedule; affects business-hours behavior |

### 4.5 Anti-patterns

- **Continuous "always on" defaults.** Default schedule is business hours only — opt in to 24/7. Cost discipline.
- **Off-hours mission auto-acceptance.** Forbidden. 24-hour mode overrides hours, but you (CTO) explicitly accept the 24-hour mission. The orchestrator never auto-starts off-hours missions.
- **"Sleep" as anthropomorphism.** Roles in `off-hours` aren't sleeping; they're just not consuming tokens. Dream mode is the only explicitly-named off-hours operation.

---

## 5. Self-Healing

### What it is

Automatic recovery from a defined set of failure conditions. Not "the agent fixes its own bugs" (that's the reflection-poisoning trap). Concrete recovery from concrete failures.

### Failure modes covered

| Failure | Detection | Recovery action |
|---|---|---|
| Mission crash mid-flight | Heartbeat from orchestrator times out (>3 min no progress) | Resume from last consistent state in `mission/whiteboard.md`; if state corrupt, escalate to CTO Inbox |
| Knowledge graph corruption | Schema validation fails on graph node OR query returns inconsistent neighbors | Rebuild from durable sources (`.claude/memory/`, filesystem walk); log gap to journal |
| Cost runaway | Mission spend crosses configured cap | Auto-pause mission (not abort); emit CTO Inbox item |
| Verifier finding storm | >5 HIGH severity findings on a single slice | Auto-stop new slice assignments; emit CTO Inbox item |
| Stuck role (no progress) | Role has same `working` state for 2× phase budget | Soft-restart the role (re-spawn from template, preserve scope); log to journal |
| MCP server failure | MCP call retries exhausted | Disable that integration for the mission; escalate to CTO Inbox; mission continues with available tools |
| Model provider outage | API call retries exhausted | Switch to fallback model per `.forge/llm-router-fallbacks.yaml`; log decision-ledger entry |
| File-lock conflict (worktree) | git error on commit | Soft-abort the slice; reassign in a fresh worktree |

### What self-healing doesn't do

- **Doesn't rewrite code based on test failures.** That's the implementer's job, with the verifier reviewing. Self-healing handles infrastructure failures, not logic bugs.
- **Doesn't silently roll back changes.** Every healing action is logged. If the action involves discarding state, the CTO is notified.
- **Doesn't loop forever.** Each healing action has a max retry count (3 by default). After exhaustion, the mission is paused and the CTO Inbox gets a structured item.
- **Doesn't auto-correct based on AI judgment.** Healing is deterministic — pattern-match the failure, apply the prescribed recovery. No "the agent thinks this fix is reasonable."

### Operations

```yaml
# .forge/self-healing.yaml
version: 1
enabled: true
max_retries_per_failure_type: 3
escalate_after_retries: true

recovery_policies:
  mission_crash:
    detection: heartbeat_timeout_minutes: 3
    recovery: resume_from_whiteboard
    on_failure: escalate
  kg_corruption:
    detection: schema_validation_fail
    recovery: full_rebuild
    on_failure: escalate
  cost_runaway:
    detection: budget_cap_crossed_pct: 100
    recovery: pause_mission
    on_failure: pause_mission  # idempotent
  verifier_finding_storm:
    detection: high_severity_count_threshold: 5
    recovery: stop_new_slices
    on_failure: escalate
  stuck_role:
    detection: no_progress_phases: 2
    recovery: soft_restart_role
    on_failure: escalate
  mcp_failure:
    detection: api_retries_exhausted
    recovery: disable_for_mission
    on_failure: escalate
  model_outage:
    detection: provider_api_retries_exhausted
    recovery: switch_to_fallback_model
    on_failure: pause_mission
  worktree_conflict:
    detection: git_lock_error
    recovery: soft_abort_slice
    on_failure: escalate
```

### Auditability

Every healing action writes to `journal.md` with: timestamp, failure type, detection signal, recovery action, outcome. The CTO can grep for "[self-healing]" to see every action the system has taken without their direct involvement. This is the audit floor — if you wonder "why did the system change state without me?", the journal shows it.

### Anti-patterns

- **Silent healing.** Every action logged to journal. No exception.
- **Infinite retries.** Max 3 per failure type. After that, escalate.
- **Healing that re-runs the failed work without changing inputs.** A failed test is a real failure; "healing" by re-running won't fix it. Self-healing addresses *infrastructure* failures (crashes, corruption, lock conflicts, outages), not *logic* failures.

---

## 6. Continuous Learning

### What it is

A scheduled crawler that watches Tier 1 (official docs) and Tier 2 (major-team blogs) for changes relevant to the project's stack, and produces *skill-update proposals* for CTO review. **Proposals only.** Never auto-applied.

### Source tiers (from `research-first` skill)

| Tier | What | Auto-trust? | Use |
|---|---|---|---|
| 1 | Official docs (TypeScript handbook, React docs, Spring Boot docs, AWS docs, Anthropic docs) | Yes — verified | Direct evidence |
| 2 | Major-team blogs (Vercel, Anthropic, AWS, Google Cloud, Spring) | Yes — verified | Direct evidence |
| 3 | Reputable engineers' blogs (Dan Abramov, Theo, Kelsey Hightower, Martin Fowler) | Manual curation | Signal; cite if used |
| 4 | HN, Reddit, Twitter | Never | Signal only — informs research directions, not skill content |

Continuous learning crawls **Tier 1 and Tier 2 only.** Tier 3-4 are consultable on demand but never auto-ingested.

### Configuration

`.forge/learning.yaml`:

```yaml
version: 1
enabled: true
crawl_window: dream-mode  # only during dream mode hours

sources:
  tier_1:
    - id: typescript-handbook
      url: https://www.typescriptlang.org/docs/
      cadence: weekly
      watch_for: api_changes,deprecations,new_features
      relevant_to_skills: [surgical-edits, testing-discipline]

    - id: react-docs
      url: https://react.dev
      cadence: weekly
      watch_for: api_changes,deprecations,new_features,hook_additions
      relevant_to_skills: [surgical-edits]

    - id: spring-boot-docs
      url: https://docs.spring.io/spring-boot/
      cadence: weekly
      watch_for: api_changes,deprecations
      relevant_to_skills: [surgical-edits, production-readiness]

    - id: anthropic-docs
      url: https://docs.claude.com
      cadence: daily
      watch_for: api_changes,model_updates,sdk_changes
      relevant_to_skills: [all]  # affects all agents

    - id: anthropic-engineering
      url: https://www.anthropic.com/engineering
      cadence: weekly
      watch_for: pattern_changes,new_best_practices
      relevant_to_skills: [engineering-excellence, prompt-buddy]

  tier_2:
    - id: vercel-blog
      url: https://vercel.com/blog
      cadence: weekly
      tags: [react, nextjs, deployment]

    - id: anyscale-blog
      url: https://www.anyscale.com/blog
      cadence: monthly
      tags: [llm, infra]

    - id: aws-news
      url: https://aws.amazon.com/blogs/aws/
      cadence: weekly
      tags: [aws, infra]
      relevant_to_skills: [production-readiness]

output:
  proposals_directory: .claude/learning/proposals/
  format: skill-diff
  auto_apply: false  # always CTO-approved
```

### What a proposal looks like

`.claude/learning/proposals/2026-05-20/typescript-error-handling.md`:

```markdown
# Skill Update Proposal — TypeScript Error Handling Patterns

**Source:** TypeScript 5.6 release notes (Tier 1)
**URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html
**Date detected:** 2026-05-20 03:14 UTC (during dream mode)
**Affects skills:** surgical-edits, testing-discipline
**Confidence:** high (official docs, direct quote)

## What changed

TypeScript 5.6 introduces stricter exhaustiveness checking on `switch`
statements when the discriminant is a union type. Specifically:

> "Switch statements now report TS2367 when a case branch is unreachable
> due to a narrower discriminant after a prior case."

## Current state of the project

- `engineering-context.md` §4 specifies `T | undefined` over `T | null` —
  unchanged.
- `surgical-edits/SKILL.md` does not currently address exhaustive switches
  on discriminated unions. The Mandalore codebase has 23 such switches
  (grep evidence in this proposal's attachments).
- 3 of those switches will trigger TS2367 after upgrade.

## Proposed change

Add to `surgical-edits/SKILL.md` under "TypeScript-specific":

  > For discriminated unions, prefer `case X.A:` over `if (x === 'A')`;
  > TypeScript 5.6+ enforces exhaustiveness with TS2367 on unreachable
  > branches. Add a `default:` with `assertNever(x)` to make new variants
  > a compile-time error.

## Risk if not adopted

Upgrade to TS 5.6 will produce 3 compile errors. Trivial to fix; not adopting
the convention means the next refactor will recreate the issue.

## CTO action

- [Approve] → Update skill; ship as PR
- [Defer]    → Skip TS 5.6 upgrade for now; revisit in 30 days
- [Reject]   → Conventions stay; mark this proposal as "rejected"
- [Discuss]  → Open question to me

## Citations

- TypeScript 5.6 release notes: <URL>
- Affected code locations in this project: attached `affected-files.txt`
```

### Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `crawl` | Schedule (during dream mode) | Walk configured sources; diff against last snapshot |
| `generate_proposal` | Crawl detected change | Produce `proposals/<date>/<topic>.md` |
| `notify` | New proposal generated | CTO Inbox item with link |
| `apply` | CTO approves | Open PR with skill update |
| `reject` | CTO rejects | Move proposal to `rejected/` with reason |

### Anti-patterns

- **Auto-applying changes.** Never. Every change is CTO-approved.
- **Proposing changes without citations.** Every proposal must link Tier 1-2 source. No "I think this would be better."
- **Proposing changes based on Tier 3-4.** Tier 3-4 inform research directions only. If a Reddit thread is interesting, the CTO can manually ask a relevant SME to investigate. The crawler doesn't act on it.
- **Recurring proposals after rejection.** Once rejected, a topic is parked for 90 days minimum.

---

## 7. Dream Mode

### What it is

Scheduled off-hours batch processing. The team isn't running missions; it's consolidating, optimizing, and pre-computing for tomorrow.

### What it isn't

- Not "the agents reflect on the day." No free-form introspection.
- Not "the agents practice for tomorrow." No speculative implementation.
- Not "the agents argue about past decisions." No re-litigation.

### Operations during a dream cycle

A dream cycle runs in the configured window (default 02:00-06:00 weekdays) and produces concrete artifacts:

| Operation | Owner | Output |
|---|---|---|
| KG rebuild + optimization | knowledge-graph engine | Rebuilt graph in memory; durable files unchanged |
| Embedding cache pre-warm | knowledge-graph engine | Top-1000 anticipated queries cached |
| Journal weekly digest (if Friday-Saturday night) | dream-mode skill | `.claude/digests/journal-week-<W>.md` |
| Decision ledger compaction | decision-ledger skill | Adds `supersedes` edges; rewrites no entries |
| Conventions promotion review | dream-mode skill | Proposals to promote stable journal patterns to conventions |
| Continuous learning crawl | continuous-learning skill | Skill-update proposals (see §6) |
| SME knowledge refresh | sme-* roles | Each SME crawls Tier 1-2 in its domain (§10) |
| Test re-run on production-critical paths | grounded-reverification skill | Regression report (see §9) |
| Mission post-mortems (if any failed in the day) | meditation skill | Per-mission `meditations/<id>.md` (see §8) |

### What dream mode is NOT allowed to do

- **No code edits.** Dream mode writes documentation, proposals, and refreshes indexes. It does not modify source files.
- **No git pushes.** Dream mode commits proposals to `.claude/` files (which are gitignored or branch-isolated). Production code is untouched.
- **No deployments.** Even if a release was prepared, dream mode does not deploy it. Deployment requires CTO approval (Phase 1 §12 gates).
- **No external service mutations.** Read-only on JIRA, Notion, Slack, GitHub. Writes only to your local `.claude/` files.

### The dream cycle artifact

Every cycle writes a summary: `.claude/dreams/<YYYY-MM-DD>.md`:

```markdown
# Dream Cycle — 2026-05-20

Window: 02:00-06:00 EDT
Duration: 3h 12m
Cost: $4.20

## Operations completed

- ✓ KG rebuild (2.1s; 134,287 nodes; 412,033 edges)
- ✓ Embedding cache pre-warm (1,000 queries; 14s)
- ✓ Decision ledger compaction (3 supersedes edges added)
- ✓ Continuous learning crawl (7 sources; 1 proposal generated)
- ✓ SME knowledge refresh (5 SMEs; 4 produced notes)
- ✓ Grounded re-verification (production-critical paths; all green)
- ⚠ Mission post-mortem: skill-loader-refactor (passed but slice-7 was costly;
    meditation produced 1 proposal)

## Proposals generated

1. `learning/proposals/2026-05-20/typescript-error-handling.md` (HIGH leverage)
2. `meditations/skill-loader-refactor.md` (proposal: spin up @crypto-specialist
   permanently — see §8 example)

## Anomalies

- No code changes detected since 2026-05-19 (expected — Sunday)
- @sme-mongodb-firestore produced no notes (no MongoDB changes upstream — fine)

## Next dream cycle: 2026-05-21 02:00 EDT
```

### Why dream mode is valuable

Three reasons it earns the build cost:

1. **KG and cache freshness.** Without dream mode, the first mission of the day pays the cost of cold caches. With dream mode, the morning's mission starts warm.
2. **Pattern consolidation.** Journal entries accumulate; without consolidation, they bury insights. Dream mode produces digests and convention-promotion proposals you can actually skim.
3. **Skill currency.** Without continuous learning, your skills age and slowly disagree with the actual frameworks they describe. Dream mode catches drift weekly.

### Anti-patterns

- **Dream mode that runs continuously.** Defeats cost discipline. Schedule-anchored only.
- **Dream mode that "thinks."** Every operation is a defined, artifact-producing function. No "the agent reflects on its work."
- **Dream mode that touches source code.** Forbidden by tool allowlist (the `dream-mode` skill is loaded by a role with no `Edit`/`Write` access to `packages/**`, only to `.claude/**`).

---

## 8. Meditation

### What it is

Event-anchored structured analysis at mission boundaries. Per-role, ground-truth-anchored, artifact-producing.

### What it isn't

- Not "the agent feels its way through what happened."
- Not "the agent reflects on its work in a journal."
- Not "the agent's opinion of how it did."

This is the feature most at risk of falling into reflection poisoning. The discipline is strict.

### Triggers

| Event | Who meditates | Output |
|---|---|---|
| Mission close (after buddy Phase B) | Every role that participated | `.claude/meditations/<mission-id>/<role>.md` |
| Weekly review (Friday 17:00 local) | Per-role summary of the week | `.claude/meditations/weekly/<YYYY-WW>/<role>.md` |
| CTO explicit request (`forge meditate --mission <id>` or `--role <r>`) | Specified scope | Same as above |
| Failed mission (auto) | Roles that participated | Same, marked as `incident: true` |

### What goes into a meditation entry

Strict schema. The skill enforces these fields; free-form text is limited to two designated sections.

```markdown
# Meditation — @impl-c — skill-loader-refactor — 2026-05-20

## Concrete metrics (not opinions)
- Slices assigned: 3
- Slices completed first attempt: 2
- Slices completed after retry: 1 (slice-7)
- Verifier findings against this role's diffs: 1 HIGH (slice-7, path traversal)
- CTO escalations involving this role: 1 (slice-7 crypto)
- Wall-time per slice: avg 47min (budget: 60min)
- Cost: $14.20 (mission share: 24%)
- Retries: 2 on slice-7

## Concrete observations (cited, not asserted)
- Slice-7 retries: see decisions.md#dec-2026-05-16-014. The original attempt
  used `jose@4.x` API patterns; jose@5.x changed signature. Diff failed
  tsc:src/auth/jwt.ts:31. (Citation: verifier output, artifacts/tests-verifier_findings.md)
- Path traversal HIGH finding: see artifacts/security-verifier_findings.md.
  Cause: trusted `manifest.path` from skill SDK without `path.relative()`
  containment.

## Pattern (if any — cite at least 3 instances across journal)
None this mission. (See weekly meditation for patterns spanning missions.)

## Proposals (changes that would prevent recurrence)
- Update `surgical-edits` skill: add a "third-party library API stability"
  checklist item: "Before using version-pinned third-party library, check
  release notes for breaking changes between local cache and current pin."
  Rationale: would have caught the jose@4→5 issue before tsc fail.
- Cite: weekly meditation, mission decisions.md, jose changelog.

## What I'm NOT going to do
- I am not going to "be more careful" — that's not a proposal.
- I am not going to recommend changing tools — current tools were correct.
- I am not going to propose adding redundancy without evidence of need.

## CTO action
- Review proposal above
- [Approve] → Open PR with skill update
- [Reject] → No action
- [Discuss] → Open question
```

### The hard rules

1. **Every observation cites a file or artifact.** "I felt rushed" — forbidden. "I had 18 minutes per slice, vs. 60 budgeted, on average" — required.
2. **Every proposal is testable.** "Improve" — forbidden. "Add this checklist item to this skill" — required.
3. **No comparing to other roles.** A meditation is per-role. Comparison is the CTO's job at weekly review.
4. **No re-litigating past decisions.** If a decision was made (decisions.md), it stays. A meditation can propose updating the convention that produced it; it cannot retroactively unmake it.
5. **No more than 3 proposals per meditation.** If you have more than 3, you've drifted into wish-list territory.

### Anti-patterns

- **Continuous meditation.** Never. Event-anchored only.
- **Meditation as performance review.** Roles don't get promoted or demoted by meditation. Meditations produce skill-update proposals. The CTO decides if patterns warrant role changes (via §18 conversational team management).
- **Free-form text.** The skill enforces the section structure. Empty sections are allowed; replacing the structure with prose is not.
- **Meditation on successful missions producing nothing useful.** That's fine. "No findings. No proposals." is a valid meditation.

---

## 9. Grounded Re-Verification

### What it is

Periodic deterministic regression check. Re-runs tests on production-critical paths. Re-evaluates whether past decisions still hold. Surfaces drift.

### Why

Decisions are made in a moment. The world changes. A library used three months ago is now deprecated. A test that passed last quarter now flakes. A convention that worked then no longer fits. Grounded re-verification surfaces these without the team doing anything special.

### Operations

| Operation | Cadence | Output |
|---|---|---|
| Re-run all tests on production-critical paths | Daily (dream mode) | Test report; if regression, CTO inbox item |
| Re-check decision validity | Weekly | Decision-drift report (decisions whose evidence has changed) |
| Dependency vulnerability re-scan | Daily | `npm audit` + `cargo audit` re-runs |
| Performance benchmark re-run | Weekly | Latency drift report |
| Skill citation re-check | Monthly | If a skill cites a URL, re-fetch and detect change |

### What is "decision drift"?

A decision was made citing evidence. Evidence may now be stale.

Example: `decisions.md#dec-2026-02-14-003` chose `node-jsonwebtoken` because it was "actively maintained." Three months later, the last release is 5 months old. The evidence has drifted.

The grounded-reverification skill detects this by re-checking the cited evidence. If the evidence is now stale, it adds a `evidence-drift-detected` annotation to the decision and emits a CTO Inbox item: "Decision X cited evidence that's now stale. Want to revisit?"

### Operations not allowed

- **Auto-rolling back decisions.** If evidence has drifted, the CTO is informed. The team doesn't unmake the choice.
- **Auto-upgrading dependencies.** Renovate-style automation is fine for non-runtime deps; runtime deps require a mini-mission (CTO-approved).
- **"Improving" past code.** Grounded re-verification surfaces facts; it doesn't act on them.

### Anti-patterns

- **Grounded re-verification that re-tests production code on prod.** Test against the dev environment / snapshots. Production is read-only from agent processes.
- **Grounded re-verification that runs continuously.** Daily/weekly cadence. Continuous re-verification is noise.

---

## 10. Subject Matter Expert Network

### What it is

A separate tier of roles, distinct from the 12 standing roles. Each SME owns a domain. SMEs:

- Crawl Tier 1-2 sources in their domain (during dream mode)
- Maintain a domain knowledge base (a subgraph in the project KG)
- Are consultable by other roles (via the `forge.sme.consult()` tool)
- Don't participate in missions as implementers/verifiers
- Run in low-power mode most of the time

### The five SMEs for your stack

Based on the Bakstage / Mandalore tech profile:

| SME | Domain | Primary sources |
|---|---|---|
| `@sme-java-spring` | Java 21, Spring Boot 3.x, Spring Security, JPA, Spring Cloud | docs.spring.io, openjdk.org, Baeldung (Tier 2) |
| `@sme-typescript-frontend` | TypeScript 5.x, React 19, Angular 18, Preact | typescriptlang.org, react.dev, angular.dev |
| `@sme-mongodb-firestore` | MongoDB 7, Firestore, Mongoose, aggregation patterns | mongodb.com/docs, firebase.google.com/docs |
| `@sme-aws-cloud` | AWS (S3, Lambda, ECS, RDS, EventBridge, Kinesis) | docs.aws.amazon.com, aws.amazon.com/blogs/aws |
| `@sme-voice-ai` | Gemini Live, Deepgram, WebRTC, 100ms, VideoSDK, SIP telephony | Provider docs; voice-AI engineering blogs |

(SMEs are added/removed via the §18 conversational team management mechanism — these five are the recommended starter set.)

### Lifecycle

An SME has three primary states:

1. **Sleeping** (default) — not consuming tokens. Knowledge base in KG. Won't respond to queries directly without a wake.
2. **Crawling** (scheduled, during dream mode) — refreshing knowledge base from Tier 1-2 sources.
3. **Consulting** (on-demand) — another role queried; SME wakes, retrieves from its knowledge base + does a fast crawl if the query is fresh, responds.

### The consultation protocol

Another role uses the `forge.sme.consult()` tool:

```typescript
const answer = await forge.sme.consult({
  domain: 'java-spring',
  question: 'What's the recommended pattern for transactional outbox in Spring Boot 3.3 with Mongo?',
  context: {
    mission_id: 'mandalore-event-publisher',
    current_file: 'packages/mandalore-outbox/src/Publisher.java',
    decision_to_make: 'Whether to use change streams or polling for outbox processing'
  },
  max_cost_usd: 0.50
});

// Returns:
// {
//   answer: string,        // structured response with citations
//   citations: URL[],      // Tier 1-2 only
//   confidence: 'high'|'medium'|'low',
//   cost_usd: number,
//   sme_id: 'sme-java-spring',
//   timestamp: ISO8601
// }
```

The SME responds with:

- **Answer** — structured; cites Tier 1-2 sources
- **Citations** — must include at least one Tier 1 if confidence is `high`
- **Confidence** — `high` (multiple Tier 1 citations agree), `medium` (one Tier 1 + Tier 2 corroboration), `low` (Tier 2 only or sources disagree)
- **Cost** — actual cost incurred for the consultation
- **Knowledge update** — if the SME learned something new during the consult, it updates its own knowledge base

### What SMEs do NOT do

- **Don't write code.** SMEs answer questions; implementers write code. SMEs have no `Edit` / `Write` tools.
- **Don't make decisions.** SMEs inform decisions. The decision is made by the consulting role (or escalated to CTO).
- **Don't crawl Tier 3-4 unless directed.** Their knowledge bases are Tier 1-2 by policy.
- **Don't participate in missions directly.** They're consulted; they don't pick up slices.

### Knowledge base schema

Each SME's knowledge lives in a subgraph of the project KG, under `domain:<sme-id>`. Nodes:

- `Concept` — a domain concept (e.g., "transactional outbox")
- `Source` — Tier 1-2 URL with crawl timestamp
- `Pattern` — a recommended pattern with rationale
- `Anti-pattern` — a documented bad pattern with rationale
- `Version` — a version of the technology this knowledge applies to

Edges:

- `Pattern -[applies_to]-> Version`
- `Pattern -[contrasts_with]-> Anti-pattern`
- `Pattern -[cited_by]-> Source`
- `Pattern -[supersedes]-> Pattern` (when a new pattern replaces an old)

### Why SMEs and not just letting roles read docs themselves

Three reasons:

1. **Token efficiency.** An implementer reading 40 pages of Spring Boot docs burns Opus tokens to extract one answer. The SME has the knowledge pre-distilled.
2. **Citation discipline.** SMEs are configured to cite Tier 1-2 only. An ad-hoc web search by an implementer might pull from a 2019 Stack Overflow answer.
3. **Currency.** SMEs are refreshed weekly via dream mode. Ad-hoc reads have whatever staleness the LLM's training cutoff dictates.

### Anti-patterns

- **SMEs as full-time team members.** They're consulted, not employed. Idle 90% of the time is correct.
- **SMEs that argue with implementers.** SMEs respond to questions; they don't initiate. If an implementer is doing something wrong by SME standards, the verifiers will catch it via ground-truth gates.
- **SMEs cross-consulting each other.** No agent-to-agent chat. If `@impl-c` needs both SQL and React advice, they consult both SMEs sequentially. The orchestrator can synthesize if needed.
- **SMEs that auto-update skills.** Their job is to inform; only continuous-learning produces skill-update proposals (and only for CTO approval).

---

## 11. New Skills Introduced in Phase 2

Eight new skills. Each gets its own SKILL.md file in the bundle.

| # | Skill | Owns | Trigger | Loaded by |
|---|---|---|---|---|
| 24 | `payroll` | Cost-as-salary framing; monthly reports; ROI review | Monthly + on-demand | @vp-engineering |
| 25 | `work-schedule` | Business hours; pause/leave/restart; per-role schedule | Schedule changes; pause/leave commands | @vp-engineering |
| 26 | `self-healing` | Defined recovery from defined failures | Failure detection | (system; all roles) |
| 27 | `continuous-learning` | Tier 1-2 crawls; skill-update proposals | Scheduled (dream mode) | Background process |
| 28 | `dream-mode` | Off-hours consolidation operations | Scheduled (configurable window) | Dedicated dream-mode runtime |
| 29 | `meditation` | Event-anchored per-role structured reflection | Mission close, weekly review, on-demand | Each role at mission end |
| 30 | `grounded-reverification` | Periodic regression + decision-drift detection | Daily/weekly (dream mode) | Background process |
| 31 | `sme-network` | SME role pattern; consultation protocol; knowledge base maintenance | SME wake/consult events | @sme-* roles |

Total skill count: 16 (engineering-excellence-v6) + 7 (Phase 1) + 8 (Phase 2) = **31 skills**.

---

## 12. Updated Role Roster

Phase 1's 12 roles + 5 SMEs = **17 active roles** (with SMEs idle 90% of the time).

```
                          CTO (you)
                            │
                            ▼
                  @vp-engineering (Orchestrator)
                            │
        ┌───────────────────┼───────────────────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼
   Planning           Build               Verify              Knowledge (SMEs)
        │                   │                   │                   │
   @architect          @impl-a             @tests-verifier      @sme-java-spring
   @data-engineer      @impl-b             @security-verifier   @sme-typescript-frontend
   @researcher         @impl-c             @performance-verifier @sme-mongodb-firestore
                       @impl-d             @reliability-verifier @sme-aws-cloud
                       @stylist                                   @sme-voice-ai
                            │
                            ▼
                      Release tier
                            │
                       @release-manager
                       @docs-author
                       @pr-reviewer (Gemini)
```

SMEs are a new tier alongside Planning/Build/Verify/Release.

---

## 13. Build Plan Additions

Phase 1 was 6 weeks. Phase 2 adds **3 more weeks** for a total of 9 weeks.

### Phase 6 — Operations (Week 7)

- Wire payroll instrumentation (already partial — every role reports tokens-in/out/cost)
- Build payroll dashboard tab
- Build `.forge/payroll.yaml` config + monthly report generator
- Wire Slack MCP for CTO alerts
- Wire Notion MCP for ledger/journal/conventions publishing
- Build `.forge/schedule.yaml` + lifecycle state machine (paused/leave/active)

**Exit criteria:** A month-end report generates correctly. A high-severity inbox item pings your phone via Slack. A decision-ledger entry shows up in your Notion in <30s.

### Phase 7 — Self-improvement (Week 8)

- Build self-healing detection + recovery (8 failure modes from §5)
- Build continuous-learning crawler with Tier 1-2 source registry
- Build proposal generator + CTO Inbox integration
- Build grounded-reverification scheduler
- All operations log to journal

**Exit criteria:** A simulated mission crash recovers automatically with a journal entry. A staged TS docs update produces a skill-update proposal in the inbox.

### Phase 8 — Dream + SMEs (Week 9)

- Build dream-mode scheduler + runtime (with the strict "no source code edits" tool allowlist)
- Build the meditation skill + per-role meditation templates
- Build the SME role template; instantiate the 5 SMEs
- Wire `forge.sme.consult()` tool exposed to all non-SME roles
- Build SME knowledge base subgraph in the KG
- First dream cycle runs and produces concrete artifacts

**Exit criteria:** A dream cycle produces a digest, a meditation, and a learning proposal. An implementer consults the Spring Boot SME mid-mission and gets a cited answer.

### Total: 9 weeks for v1.5 (Phase 0–8)

Cumulative cost: ~$15-20k in dev API spend across the build (mostly Phase 5 dogfood).

---

## 14. Open Questions

Decisions for you before / during the build.

### Before build

1. **Notion workspace** — use your existing one or create a "Forge Knowledge" sub-workspace? Recommendation: sub-workspace, so per-project pages don't pollute your personal Notion.

2. **Slack workspace** — your existing Bakstage workspace with a `#forge-*` channel set, or a personal dev workspace? Recommendation: personal, so the noise stays out of the team workspace.

3. **Initial SME set** — confirm the five (Java-Spring / TypeScript-Frontend / MongoDB-Firestore / AWS / Voice-AI), or adjust? Drop or add via §18 once the system is running.

4. **Continuous learning sources** — confirm the Tier 1-2 source list, or adjust? Add or remove via `.forge/learning.yaml`.

5. **Dream mode window** — default 02:00-06:00 local. Adjust for your sleep schedule.

6. **Monthly budget cap** — default $600 (sum of role caps). Adjust based on first month's actuals.

### During build (Phase 6-8)

7. **Meditation frequency** — per-mission close vs weekly only? Default: per-mission. Some users find this noisy; switch to weekly if so.

8. **SME consultation cost cap** — default $0.50 per consult. Adjust based on first 50 consults.

9. **Self-healing retry count** — default 3. May tune up to 5 for transient infrastructure issues; tune down to 1 for cost-runaway situations.

10. **Should dream mode trigger continuous learning, or should it be a separate scheduled job?** Default: trigger from dream mode. Alternative: separate scheduler for finer granularity.

### After Phase 8

11. **Add more SMEs?** The five are calibrated to your stack. If you start a new domain (e.g., mobile, ML), spin up an SME via §18.

12. **Should SMEs publish "weekly news digests" to Slack/Notion?** Tempting but risks notification fatigue. Default: no. Enable per-SME if you want it.

13. **Quarterly retrospective process?** Phase 2 has weekly meditations and monthly payroll; no quarterly explicit step. Could add `QUARTERLY_REVIEW.md` generation. Defer.

---

## Closing note

Phase 2 is the operating layer for Phase 1's team. Payroll, hours, integrations, recovery, learning, dream, meditation, re-verification, SMEs.

The thing all nine features have in common is the discipline anchor in §1:
- Event-anchored, not continuous
- Ground-truth-anchored, not opinion-based
- Artifact-producing, not free-form

If you ever look at this design and think "I'd rather have the AI just figure it out continuously," reread §1.4 and the prompt-buddy skill from your bundle. That's the trap. Continuous AI self-improvement is what every multi-agent demo since 2023 has promised and what every multi-agent system since 2023 has failed to deliver — because the research is unambiguous that it makes quality worse, not better.

The system you're building avoids that trap by treating "improvement" as a structured workflow with concrete artifacts and CTO gates, not as a vibe. That's the unbiased, research-oriented choice. Less exciting in the demo, more reliable in month six.

— *Forge Team Operations plan, Phase 2, May 16, 2026.*
