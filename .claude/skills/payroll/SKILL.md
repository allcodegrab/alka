---
name: payroll
description: Manages cost-as-salary for the AI team. Tracks token cost per role; produces monthly reports per role + per mission; forecasts upcoming spend; emits alerts at 50/80/100% of monthly budget; supports CTO-driven ROI review and role retirement. Configuration in `.forge/payroll.yaml`. Triggers on month-end, on threshold crossing, on mission close, and on demand. Cost discipline is a quality of the system — every role reports tokens-in/out/cost; every mission shows live cost in the dashboard. No surprise bills.
---

# Payroll

The cost-as-salary framing. Each role has a model assignment and therefore a per-token cost. Over time, role cost is its salary. Payroll manages this: budgets, reports, alerts, ROI review, retirement.

## Why this framing matters

"Token cost tracking" is administrative. "Payroll" is operational — it makes you reason about the team like an org. When @impl-d burned $80 this month and completed 2 missions, you instinctively ask the same question you'd ask of a human employee at that ROI: do they earn their seat?

The framing also makes cost visible to every role. A role that knows it has a $30 budget self-regulates differently than a role with no budget at all.

## When this skill triggers

| Trigger | Action |
|---|---|
| Month-end (UTC midnight on 1st) | Generate `payroll-<YYYY-MM>.md` report |
| 50% / 80% / 100% threshold crossed | Emit CTO Inbox item |
| Mission close | Update per-mission cost breakdown in the dashboard |
| Quarterly mark | Generate ROI summary; flag low-ROI roles for retirement review |
| CTO command `forge payroll` | On-demand report |

## Hard skip

- Within-mission cost ticks (those go to the dashboard's cost meter, not payroll)
- Single API call cost (aggregated at the mission level)
- Internal cost-tracking for non-Forge tools (out of scope)

## Configuration — `.forge/payroll.yaml`

```yaml
version: 1
monthly_total_cap_usd: 600
alert_thresholds_pct: [50, 80, 100]
forecast_horizon_days: 30

roles:
  vp-engineering:
    monthly_budget_usd: 80
    model: claude-opus-4-7
  architect:
    monthly_budget_usd: 60
    model: claude-opus-4-7
  data-engineer:
    monthly_budget_usd: 40
    model: claude-opus-4-7
  researcher:
    monthly_budget_usd: 30
    model: claude-sonnet-4-6
  impl-a: { monthly_budget_usd: 80, model: claude-sonnet-4-6 }
  impl-b: { monthly_budget_usd: 80, model: claude-sonnet-4-6 }
  impl-c: { monthly_budget_usd: 80, model: claude-sonnet-4-6 }
  impl-d: { monthly_budget_usd: 80, model: claude-sonnet-4-6 }
  stylist: { monthly_budget_usd: 30, model: claude-sonnet-4-6 }
  tests-verifier: { monthly_budget_usd: 20, model: claude-sonnet-4-6 }
  security-verifier: { monthly_budget_usd: 20, model: claude-sonnet-4-6 }
  performance-verifier: { monthly_budget_usd: 15, model: claude-sonnet-4-6 }
  reliability-verifier: { monthly_budget_usd: 15, model: claude-sonnet-4-6 }
  pr-reviewer: { monthly_budget_usd: 20, model: gemini-2-5-pro }
  release-manager: { monthly_budget_usd: 10, model: claude-sonnet-4-6 }
  docs-author: { monthly_budget_usd: 10, model: claude-sonnet-4-6 }
  # SMEs (see sme-network)
  sme-java-spring: { monthly_budget_usd: 8, schedule: idle-time-only }
  sme-typescript-frontend: { monthly_budget_usd: 8, schedule: idle-time-only }
  sme-mongodb-firestore: { monthly_budget_usd: 6, schedule: idle-time-only }
  sme-aws-cloud: { monthly_budget_usd: 8, schedule: idle-time-only }
  sme-voice-ai: { monthly_budget_usd: 10, schedule: idle-time-only }
```

Cap is a budget, not a floor. Typical month sees ~60% utilization.

## Monthly report — `.claude/reports/payroll-<YYYY-MM>.md`

Auto-generated on the 1st. Format:

```markdown
# Payroll Report — May 2026

## Summary
Total spend:        $487.20 / $600 (81%)  ⚠ over 80%
Missions completed: 14
Cost per mission:   $34.80 avg

## Per-role
| Role | Budget | Spent | %  | Missions | $/mission | ROI signal |
|---|---|---|---|---|---|---|
| vp-engineering | $80 | $73.40 | 92% | 14 | $5.24 | high |
| architect      | $60 | $51.20 | 85% | 12 | $4.27 | high |
| impl-a         | $80 | $68.80 | 86% | 11 | $6.25 | high |
| impl-d         | $80 |  $9.80 | 12% |  2 | $4.90 | low — under-used |
| sme-voice-ai   | $10 |  $0.80 |  8% |  0 cons. | n/a | unclear |

## Notable
- @impl-d: under-utilized. Consider dismissing for June or reallocating.
- @sme-voice-ai: zero consultations. Either no missions touched voice-AI,
  or consult mechanism isn't being used.
- 24-hour missions: $42 avg vs $28 standard.
- @impl-b retries on slice-7 cost $4 (see decisions.md#dec-2026-05-09-014).

## Recommendation
- Defer adding @sme-rust until a Rust mission appears.
- Consider dropping @impl-d to 50% budget; reallocate to @impl-c.
```

## ROI signals (deterministic, not editorial)

A role's ROI signal is computed from concrete data:

- `high` — utilization >70%, mission completion rate >90%, finding rate against own diffs <0.5/mission
- `medium` — utilization 30-70% OR completion rate 70-90%
- `low` — utilization <30% (under-used) OR completion rate <70% (struggling)
- `unclear` — insufficient data (e.g., SME with no consultations)

This is a flag, not a verdict. The CTO decides what to do.

## Threshold alerts

When monthly spend crosses a threshold, an inbox item:

```yaml
type: budget_alert
severity: high                       # for 80%; medium for 50%
summary: "Monthly budget at 81% — $487.20 / $600"
context:
  days_remaining: 11
  forecast_eom: $589 (98%)
  top_consumers: [vp-engineering: $73.40, impl-a: $68.80]
decision_options:
  - id: accept
    consequence: "Continue current spend rate"
  - id: cap-roles
    consequence: "Apply mid-month caps to top consumers"
  - id: defer-missions
    consequence: "Pause non-critical missions until month-end"
```

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `report_monthly` | 1st of month | Generate `.claude/reports/payroll-<YYYY-MM>.md`; publish to Notion (if configured) |
| `forecast` | On mission acceptance + on demand | Estimate 30-day spend |
| `alert_threshold` | Threshold crossing | CTO Inbox item |
| `roi_review` | Quarterly + on demand | Per-role ROI summary |
| `retire_role` | After ROI review identifies low-value role | Persistent change to `org-chart.yaml` (PR-based) |

## What payroll is NOT

- **Not gamified.** No leaderboards. No performance bonuses. Roles aren't humans; the framing is for clarity, not incentive.
- **Not auto-retiring.** Only the CTO retires a role. The system flags candidates.
- **Not hiding cost.** Every mission shows live cost in the dashboard. No surprise bills.
- **Not a separate accounting system.** Reads from existing cost instrumentation (Phase 1 §9).

## Anti-patterns

- **Setting budgets so tight they constrain quality.** Budgets are forecasts, not rationing.
- **Ignoring under-utilization.** If a role is consistently <20% utilized, that's a signal — either redefine its work or retire it.
- **Auto-applying cost caps mid-mission.** A cap mid-mission causes incomplete work. Cap at mission acceptance time (refuse to start) or after mission close (defer next).
- **Slack-spamming budget alerts.** One Slack alert per threshold crossing. No daily reminders.

## Dashboard surface

The dashboard has a Payroll tab (F5):

```
┌─ Payroll — May 2026 ─────────────────────────────────────────┐
│ Monthly: $487.20 / $600 (81%, ALERT)  Forecast EOM: $589    │
│ Yesterday: $24.40  Today: $12.10  Avg/day: $15.71           │
├──────────────────────────────────────────────────────────────┤
│ ▼ Active                Budget Spent   %   Trend            │
│   @vp-engineering       $80    $73.40 92% ━━━━ ↗            │
│   @architect            $60    $51.20 85% ━━━━ ↗            │
│   @impl-a               $80    $68.80 86% ━━━━ ↗            │
│   ...                                                        │
│ ▶ Idle SMEs (5)                                              │
│ ▶ Closed roles                                               │
└──────────────────────────────────────────────────────────────┘
```

## See also

- `engineering-context.md` §9 (operations) and §14 (cost discipline)
- `FORGE_TEAM_OPERATIONS.md` §2 (full payroll spec)
- `cto-inbox` — emits budget-alert items
- `decision-ledger` — records role retirement decisions
- `org-chart` — model assignments drive cost
