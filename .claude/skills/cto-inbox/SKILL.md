---
name: cto-inbox
description: Manages the CTO Inbox queue — the surface where AI agents push items requiring CTO decision. Creates an inbox item when a gate is hit (architecture choice, dep addition, schema change, public API change, prod push, scope expansion, budget threshold, verifier finding storm, scope_change, role_change, etc.). Items have a fixed schema (severity, type, proposer, summary, proposal, evidence, recommended decision, decision options, time-sensitivity). Sorted by leverage. Persists until decided or auto-decided per policy. Read by the dashboard, by Slack alerts, by the CLI.
---

# CTO Inbox

The structured queue of items requiring CTO decision. The push mechanism by which AI agents escalate, not a notification feed.

## Why this exists

Without a structured inbox, escalations to the CTO look like chat messages: "Hey, can you approve adding jose?" Five chat messages later, you're context-switching constantly. With an inbox, each item is structured: the agent did the homework (evidence, alternatives, recommendation), the item has a severity, you can act on it in 30 seconds or defer with a known consequence.

This is the "briefing memo" pattern from real org design — push decisions up *with the data already gathered*, not as open-ended questions.

## When this skill triggers (item-creation triggers)

A new inbox item is created when any role hits a gate. The §12 gates from `FORGE_TEAM_MODE.md`:

| Gate | Severity | Type |
|---|---|---|
| Mission brief (Phase A intake) | required | `mission_brief_signoff` |
| Architecture choice (new framework / new dep / new pattern) | required | `architecture_change` |
| Schema change / data migration | required | `schema_change` |
| Public API change | required | `api_change` |
| Production push | required | `prod_push` |
| Scope expansion | required | `scope_change` |
| Budget over 80% | required | `budget_alert` |
| Cross-team file edit (out of brief scope) | required | `out_of_scope_edit` |
| Verifier finding HIGH/CRITICAL | required | `verifier_finding` |
| External integration auth/cred | required | `integration_auth` |
| Cross-LLM disagreement (Claude vs Gemini at PR review) | high | `cross_llm_disagreement` |
| Team modification proposal (orchestrator-proposed addition) | medium | `role_change_proposed` |
| Skill update proposal (from continuous-learning) | low/medium | `skill_update_proposed` |
| Mission going off-track (overrun risk) | medium | `mission_at_risk` |
| Self-healing event (CRITICAL) | high | `self_healing_event` |
| Grounded re-verification regression | medium | `regression_detected` |

## Hard skip (don't create an inbox item)

- Routine work inside scope: file creation, edit, test running, local commit, subagent spawn within plan
- Internal API design decisions that don't break public contracts
- Refactor decisions inside a single file
- Doc updates
- Local lint/format
- Worktree management
- Stand-up status updates (those go to the dashboard, not the inbox)

These are the autonomy budget. Without it, every mission grinds to a halt.

## Item schema

```yaml
id: cto-inbox-2026-05-16-014
created_at: 2026-05-16T13:42:00Z
mission_id: skill-loader-refactor               # null for non-mission items
severity: high                                  # low | medium | high | critical
type: architecture_change                       # from controlled vocab above
proposer: '@architect'                          # role-id or 'system'
summary: "Add 'jose' npm dependency for JWT verification"

proposal:
  what: "Add jose@5.x as a runtime dependency in packages/skill-loader"
  why: |
    Current node-jsonwebtoken has known TS type issues and slower verification.
    jose is industry-standard, MIT, 18KB gzipped.
  alternatives_considered: |
    1. Stay with node-jsonwebtoken (cost: 2 type-cast workarounds, 14% slower)
    2. Native crypto (cost: ~80 LOC of JWT spec handling)
    3. Add jose (cost: +18KB gzipped, +1 dep) ← recommendation
  recommendation: "Option 3 (jose)"

evidence:
  - "Benchmark: bench/jwt-verify.bench.ts (15ms → 3ms)"
  - "License: MIT"
  - "Maintenance: last release 14d ago, weekly downloads 12M"
  - "Audit: npm audit clean, snyk clean"

time_sensitivity: "blocks H+3:00 plan-lock gate"
deadline: 2026-05-16T15:00:00Z                  # null if not time-sensitive

decision_options:
  - id: approve
    label: "Approve"
    consequence: "architecture proceeds with jose"
    default_if_expired: false
  - id: reject
    label: "Reject"
    consequence: "@architect picks alternative; +30min phase impact"
    default_if_expired: false
  - id: defer
    label: "Defer to next mission"
    consequence: "Ship with current node-jsonwebtoken; revisit"
    default_if_expired: false

expires_at: null                                # if set, auto-decision applies
auto_decision: null                             # which option if expires
notification_sent_to:
  - dashboard
  - slack: '#forge-cto-inbox'                  # if severity >= configured threshold

status: pending                                 # pending | decided | expired
decided_at: null
decided_option: null
decision_recorded_in: null                      # decisions.md entry ID after CTO acts
```

## Sorting and surfacing

Items appear in the dashboard sorted by **leverage** = `impact_score × time_sensitivity_score`:

- `impact_score`: critical=4, high=3, medium=2, low=1
- `time_sensitivity_score`: blocks-current-phase=4, blocks-next-phase=3, this-mission=2, next-mission=1

This means a `critical` item that blocks the current phase sits at top. A `low` item with no deadline sits at the bottom.

Within the dashboard, items expand inline; from Slack, you tap a button; from CLI (`forge inbox <id> approve`), you decide remotely.

## Auto-decision on expiry

Some items have an `expires_at` + `auto_decision`. If the CTO doesn't respond before the deadline, the default applies.

**By default:**
- `critical` items: never auto-decide
- `high` items: never auto-decide
- `medium` items: auto-decide per item config (e.g., a "skill update proposal" might auto-defer after 7 days)
- `low` items: auto-approve after 24h if config allows

The CTO can disable auto-decision globally or per type.

## Persistence

Items live in `.claude/inbox/<status>/<id>.yaml`:

```
.claude/inbox/
├── pending/
│   ├── cto-inbox-2026-05-16-014.yaml
│   ├── cto-inbox-2026-05-16-018.yaml
│   └── ...
├── decided/
│   └── (moved here on decision; tagged with date)
└── expired/
    └── (moved here when expires_at passed; auto_decision applied if any)
```

Items moved out of `pending/` are kept indefinitely for audit. After 90 days, decided/expired items can be archived to `.claude/inbox/archive/<YYYY-MM>/`.

## Three places to act

1. **Dashboard (F4)** — full context, inline approve/reject
2. **Forge command palette (Cmd+K → inbox)** — quick action without leaving editor
3. **CLI (`forge inbox`)** — `list`, `show <id>`, `approve <id>`, `reject <id> --reason`, `defer <id>`
4. **Slack (`/forge approve <id>`)** — from your phone

All four routes write the same decision-ledger entry.

## What the inbox is NOT

- **Not a chat with agents.** Items are structured; the agent did the homework. The CTO acts, doesn't converse.
- **Not a notification feed.** Stand-up status emissions don't go to the inbox.
- **Not a ticket tracker.** Use JIRA for work tracking. The inbox is for decisions.
- **Not editable.** Items are append-only metadata. To change a proposal, the proposer creates a new item that supersedes the old.

## Anti-patterns

- **Inbox bloat.** If every routine decision becomes an inbox item, the inbox becomes noise. Use the gates list strictly.
- **Items without a recommendation.** Every item must have a `recommendation:` field. If the agent can't recommend, the brief is incomplete — the item should be a research request, not a decision.
- **Vague decision options.** Each option must have a `consequence:`. "Approve" without saying what happens after approval is missing the point.
- **Inbox items the CTO can never act on.** If something requires CTO action and the CTO has no clear next step, the item is malformed. Send it back to the proposer for clarification.

## See also

- `engineering-context.md` §14 (CTO Inbox concept) and §17 (Team Mode gates)
- `FORGE_TEAM_MODE.md` §12 (full CTO Approval Architecture)
- `decision-ledger` — every CTO decision generates a ledger entry
- `team-modifications` — generates role-change inbox items
- `continuous-learning` — generates skill-update inbox items
