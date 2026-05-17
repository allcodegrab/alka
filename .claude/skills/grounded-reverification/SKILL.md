---
name: grounded-reverification
description: Periodic deterministic regression check. Re-runs tests on production-critical paths; re-evaluates whether past decisions still hold; surfaces drift. Triggers daily (during dream mode) for tests/audits, weekly for decision-drift, monthly for skill-citation re-checks. NOT auto-rollback — surfaces findings; CTO decides. Catches the slow drift that ad-hoc verification misses: a library cited as "maintained" 3 months ago whose last release is now 5 months old; a test that passed then now flakes; a convention that worked then no longer fits.
---

# Grounded Re-Verification

The system's regression sensor. Re-runs deterministic checks on a schedule; surfaces findings; CTO decides what to do.

## Why this exists

Decisions are made in a moment. The world changes. A library used three months ago is now deprecated. A test that passed last quarter now flakes. A convention worked then but no longer fits.

Without grounded re-verification, drift accumulates silently. Mission N succeeds because mission N-1 succeeded; meanwhile, the foundation slowly cracks. This skill surfaces drift before it causes a mission failure.

The "grounded" in the name is doing work — every check is against ground-truth signals (test pass/fail, dep release dates, benchmark numbers). Not "the agent thinks the code looks fine."

## When this skill triggers

| Cadence | Operation |
|---|---|
| Daily (in dream mode) | Re-run tests on production-critical paths (`§17.5` from engineering-context); npm audit + cargo audit re-runs |
| Weekly | Re-check decision validity (citations, dependency liveness); performance benchmark re-run; latency-drift report |
| Monthly | Re-fetch URLs cited in skills; detect content drift |
| On dependency-upgrade PR | Pre-merge re-run to detect introduced regression |

## Hard skip

- Tests already flaky and quarantined (per §6 testing rules)
- URLs that were Tier 4 source (no re-verification on signal-only)
- Decisions explicitly marked `evergreen: true` (e.g., "we use TypeScript")
- Production environments (read-only from agent processes)

## What gets re-verified

### Daily

1. **Production-critical-path tests.** Run the full test suite for paths in §17.5 (permission-system, skill-loader, mcp-broker, hooks-engine, capability-graph, team-mode, llm-router, indexer, knowledge-graph). Any new failure → CTO Inbox.
2. **Dependency audit.** `npm audit` + `cargo audit`. New HIGH/CRITICAL → CTO Inbox.
3. **Benchmark sanity.** Top-10 hot-path benchmarks. Latency regression >20% from rolling baseline → CTO Inbox.

### Weekly

4. **Decision validity.** For each decision in `decisions.md` of last 90 days, re-check evidence:
   - Dependency decisions: re-fetch package metadata. If last-release date > 6 months and decision cited "actively maintained" → drift detected.
   - Benchmark-justified decisions: re-run cited benchmark. If gap closes by >50% → drift.
   - URL-citation decisions: re-fetch URL. If content changed substantially → drift.
5. **Performance regression.** Compare this week's mission-walkthrough bench to 4-week rolling avg. >15% regression on any metric → CTO Inbox.
6. **Convention adherence audit.** For each convention with measurable enforcement (e.g., "no Express; use Fastify"), grep codebase. Violations → CTO Inbox.

### Monthly

7. **Skill citation re-check.** For each URL cited in any skill, re-fetch. Detect: 404, substantial content change, version-pinned URL pointing to deprecated content.
8. **Threat-model freshness.** If `docs/security/threat-model.md` last-updated >90 days, emit reminder.

## What grounded re-verification does NOT do

- **Doesn't auto-rollback decisions.** Drift → CTO informed. The team doesn't unmake choices.
- **Doesn't auto-upgrade dependencies.** Renovate-style automation for non-runtime deps only; runtime deps require a mini-mission.
- **Doesn't "improve" past code.** Surfaces facts; doesn't act.
- **Doesn't re-run failed tests hoping they pass.** That's not re-verification, that's hiding flakes.
- **Doesn't run on production.** Test env or local snapshots only.

## Configuration — `.forge/reverification.yaml`

```yaml
version: 1
enabled: true

daily:
  enabled: true
  window: dream-mode
  test_paths:
    - packages/permission-system/
    - packages/skill-loader/
    - packages/mcp-broker/
    - packages/hooks-engine/
    - packages/capability-graph/
    - packages/team-mode/
    - packages/llm-router/
    - native/indexer/
    - native/knowledge-graph/
  audit_commands:
    - "pnpm audit --audit-level=high"
    - "cargo audit"
  bench_regression_threshold_pct: 20

weekly:
  enabled: true
  decision_lookback_days: 90
  url_change_threshold: substantial   # ignore minor formatting
  convention_audit:
    - rule: "no Express imports"
      grep: "from ['\"]express['\"]"
      severity: high

monthly:
  enabled: true
  skill_citation_check: true
  threat_model_age_days: 90
```

## Output

| Trigger | Output |
|---|---|
| Test regression | CTO Inbox item (severity: high or critical based on path) |
| Audit finding | CTO Inbox item (severity per audit) |
| Bench regression | CTO Inbox item (severity: medium); decision-ledger annotation |
| Decision drift | CTO Inbox item (severity: medium); decision annotated `evidence-drift-detected` |
| Convention violation | CTO Inbox item (severity per rule) |
| URL drift | CTO Inbox item (severity: low or medium); skill annotated |

Every output is the structured proposal pattern: detection signal, evidence, recommendation, decision options.

## Anti-patterns

- **Continuous re-verification.** Daily/weekly cadence. Continuous = noise.
- **Acting on drift without CTO approval.** Surface, don't unilaterally fix.
- **Testing in production.** Test env / snapshots only.
- **Suppressing flaky tests as "not regressions."** Flaky tests are themselves a finding — they need fixing, not ignoring.
- **Bench regressions blamed on "noisy environment" without investigation.** A 20%+ regression is a finding even if you suspect noise; the investigation produces evidence.

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `run_daily_checks` | Dream mode | Tests + audits + bench sanity |
| `run_weekly_checks` | Weekly schedule | Decision drift + perf regression + convention audit |
| `run_monthly_checks` | Monthly schedule | Skill citation + threat model freshness |
| `report` | After each run | Aggregated findings to CTO Inbox |
| `annotate_decision` | Drift detected | Add `evidence-drift-detected` to the decision (immutable: a new annotation entry, not a rewrite) |

## See also

- `engineering-context.md` §17.5 (production-critical paths) and §11 (testing)
- `FORGE_TEAM_OPERATIONS.md` §9 (full spec) and §1 (ground-truth discipline)
- `self-healing` — adjacent skill that handles infrastructure failures, not regressions
- `decision-ledger` — drift annotations recorded here
- `cto-inbox` — destination for all findings
- `dream-mode` — runs the daily/weekly checks
