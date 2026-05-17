---
name: self-healing
description: Automatic recovery from a defined set of failure conditions (mission crash, KG corruption, cost runaway, verifier finding storm, stuck role, MCP failure, model outage, worktree conflict). NOT "the agent fixes its own bugs" — that's the reflection-poisoning trap. Each failure has a deterministic detection signal and a prescribed recovery action. Max 3 retries per failure type; after exhaustion, escalate to CTO Inbox. Every healing action logged to journal. Healing addresses infrastructure failures, not logic failures.
---

# Self-Healing

Concrete recovery from concrete failures. Always logged, never silent. Deterministic; no AI judgment in the loop.

## Why this exists

A 24-hour mission can't have a single transient failure terminate it. A flaky MCP server, a model-provider outage, a knowledge graph that desyncs after a partial write — these are infrastructure failures that have prescribed recoveries. Without self-healing, you wake up to a dead mission. With it, you wake up to a journal entry: "Healed X at 03:14 via Y; continued."

What this skill is NOT: an agent that decides "the code looks wrong, let me fix it." That's logic-level intervention; it's the implementer's job (with verifier review). Self-healing handles *infrastructure*.

## When this skill triggers

A failure detection signal fires. The signals are deterministic — not AI-judged:

| Failure | Detection signal |
|---|---|
| Mission crash mid-flight | Orchestrator heartbeat times out (>3 min no progress) |
| Knowledge graph corruption | Schema validation fails on node OR inconsistent neighbors on query |
| Cost runaway | Mission spend crosses configured cap |
| Verifier finding storm | >5 HIGH severity findings on a single slice |
| Stuck role | Same `working` state for 2× phase budget |
| MCP server failure | API call retries exhausted |
| Model provider outage | API call retries exhausted |
| Worktree conflict | git lock error on commit |

## Hard skip

- **Logic failures.** A failing test is not infrastructure. Self-healing doesn't re-run tests hoping they'll pass.
- **Verifier findings (singular).** Findings go to the implementer for fix, not to the healer for retry.
- **CTO-rejected items.** If CTO rejected something, healing doesn't re-propose. Move on.

## Recovery actions (deterministic)

| Failure | Recovery action |
|---|---|
| Mission crash | Resume from last consistent state in `mission/whiteboard.md`; if state corrupt, escalate to CTO Inbox |
| KG corruption | Rebuild graph from durable sources (`.claude/memory/` + filesystem walk); log gap to journal |
| Cost runaway | Pause mission (not abort); emit CTO Inbox item |
| Verifier finding storm | Stop new slice assignments; emit CTO Inbox item; allow current slices to complete |
| Stuck role | Soft-restart (re-spawn from template, preserve scope); after retry exhaustion, escalate |
| MCP failure | Disable that integration for the mission; escalate; mission continues with available tools |
| Model outage | Switch to fallback model per `.forge/llm-router-fallbacks.yaml`; log decision-ledger entry |
| Worktree conflict | Soft-abort the slice; reassign in fresh worktree |

## Configuration — `.forge/self-healing.yaml`

```yaml
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
    on_failure: pause_mission         # idempotent
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

## Auditability

Every healing action writes to `journal.md`:

```
[2026-05-16 03:14] [self-healing] mcp_failure detected on integration=notion-mcp-server
  Recovery: disable_for_mission (mission=skill-loader-refactor)
  Outcome: mission continues with available tools; notion publishing deferred
  Retry attempt: 1/3
  CTO inbox: cto-inbox-2026-05-16-022 created (severity=medium)
```

Grep for `[self-healing]` to see every action the system took without your direct involvement. This is the audit floor.

## What healing does NOT do

- **Doesn't rewrite code based on test failures.** That's the implementer's job.
- **Doesn't silently roll back changes.** Every healing action logged.
- **Doesn't loop forever.** Max 3 retries per failure type. After that, escalate.
- **Doesn't auto-correct based on AI judgment.** Deterministic pattern-match only.
- **Doesn't re-run the same failed work without changing inputs.** A failed test won't "heal" by re-running. Healing addresses crashes, corruption, locks, outages — not logic.

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `detect` | Continuous monitoring loop | Match incoming signal against failure types |
| `recover` | Detection match | Apply prescribed recovery action |
| `retry` | Same failure recurs | Increment counter; if >3, escalate |
| `escalate` | Retry budget exhausted | Create CTO Inbox item (severity matches failure) |
| `log` | Every action | Append to `journal.md` with `[self-healing]` prefix |

## Anti-patterns

- **Silent healing.** Every action logged. Exception is fatal — turn off self-healing if you can't audit it.
- **Infinite retries.** Max 3. After that escalate.
- **Logic-failure "healing."** A failing test means a bug. Healing doesn't fix bugs; it fixes infrastructure.
- **Healing that hides the cause.** When a model provider outage triggers a switch to fallback, the journal entry names the provider and the fallback so you can pursue the root cause.
- **Healing without retries cap.** Without a cap, an environmental flap can burn budget without progress.

## See also

- `engineering-context.md` §9 (ops) and §17.5 (production-critical paths)
- `FORGE_TEAM_OPERATIONS.md` §5 (full self-healing spec)
- `cto-inbox` — destination for escalated failures
- `decision-ledger` — records model-switching decisions
- `grounded-reverification` — adjacent skill that catches regressions, not infrastructure failures
