---
name: team-modifications
description: Manages dynamic team composition via natural-language commands to `@vp-engineering`. Handles mission-scoped (default) and persistent (org-chart.yaml) modifications. Operations include ADD_ROLE, REMOVE_ROLE, DUPLICATE_ROLE, PAUSE_ROLE, RESUME_ROLE, RECONFIGURE_ROLE, PROPOSE_NEW_ROLE, PROMOTE_TO_PERSISTENT. Triggers on CTO messages containing role-modification verbs ("spin up", "dismiss", "swap to", "promote") addressed to the VP, or when the orchestrator proactively identifies a role gap. Records every modification in the decision ledger.
---

# Team Modifications

The conversational interface for managing the engineering team. The CTO speaks to `@vp-engineering`; the VP applies the change. Mission-scoped by default; persistent on opt-in.

## Why this exists

Editing `.forge/org-chart.yaml` mid-mission is the wrong friction level. Real engineering management is conversational: "we need another frontend person," "let's pull the data engineer," "switch the JWT implementer to Opus." Forge should support that register.

Why scope it carefully: without scoping, every one-off "add a Rust specialist for this MVP" permanently bloats the org chart. Without an audit trail, six months later you can't reconstruct why a team had a `@migrations-specialist`. Without budget enforcement, a single "spin up four more implementers" tanks mission economics.

## When this skill triggers

- A CTO message containing role-modification verbs ("spin up", "add", "dismiss", "remove", "pause", "resume", "switch", "swap to", "promote", "duplicate") addressed to `@vp-eng` or `@vp-engineering`
- `@vp-engineering` proactively identifying a role gap during planning ("this mission would benefit from X — want me to spin one up?")
- Mission state hitting a configured trigger (e.g., implementation phase 2× over budget → propose dropping non-critical verifier)

## Hard skip

- Trivial completion-context messages ("yes" / "no" / "approved")
- CTO messages not directed at `@vp-engineering`
- Mid-verifier-run modifications to verifier roles (stopping verifier mid-run loses state; require explicit confirmation)
- Modification storms (rate-limited: 1 modification per 5 minutes from CTO; the skill batches rapid requests)

## Operations

| Operation | Action | Default scope | Approval |
|---|---|---|---|
| `ADD_ROLE` | Instantiate a new role, optionally from a template | mission-scoped | auto if existing role-type + within 20% budget; CTO if new role-type or budget impact >20% |
| `DUPLICATE_ROLE` | Spin up another instance of existing role (e.g., `@impl-a` → `@impl-a-2`) | mission-scoped | auto if within budget; CTO if over budget |
| `REMOVE_ROLE` | Dismiss; recover pending work; reassign | mission-scoped | auto if no pending work; CTO confirmation if pending |
| `PAUSE_ROLE` | Stop runs; preserve state; resumable | mission-scoped | auto (always cheap to reverse) |
| `RESUME_ROLE` | Restart a paused role | mission-scoped | auto |
| `RECONFIGURE_ROLE` | Change model / skills / tools / maxTurns mid-mission | mission-scoped | auto within tier (Sonnet ↔ Sonnet); CTO across tier |
| `PROPOSE_NEW_ROLE` | VP suggests a role-type the team doesn't have | — | CTO always |
| `PROMOTE_TO_PERSISTENT` | Take mission-scoped role-add and write to `org-chart.yaml` | persistent (PR) | CTO always; PR opened, not direct commit |

## State management

**Mission-scoped changes** live in `.claude/missions/<mission-id>/team-delta.yaml`:

```yaml
mission_id: skill-loader-refactor
base_org_chart_version: v1

additions:
  - id: stylist-2
    template: stylist
    reason: "Additional frontend capacity for admin UI slice"
    proposed_by: cto
    approved_at: 2026-05-16T14:23:01Z
    budget_impact_usd: 2.40

removals:
  - id: data-engineer
    reason: "All in-memory; no DB work this mission"
    proposed_by: cto
    approved_at: 2026-05-16T11:02:00Z
    pending_work: []

reconfigurations:
  - id: impl-c
    change: model
    from: claude-sonnet-4-6
    to: claude-opus-4-7
    reason: "Slice-7 cryptography path is unusually complex"
    proposed_by: vp-engineering
    approved_at: 2026-05-16T13:14:23Z
    budget_impact_usd: 3.80

pauses:
  - id: docs-author
    reason: "Awaiting slice completion before docs needed"
    paused_at: 2026-05-16T10:30:00Z
    resume_eta: 2026-05-16T18:00:00Z
```

**Persistent changes** modify `.forge/org-chart.yaml` and generate a PR. The PR goes through normal review including `@pr-reviewer` (Gemini).

All changes are logged in the mission's `decisions.md` and aggregated to the project-level ledger at mission close.

## Constraints

**CTO approval required for:**
- Any persistent change to `org-chart.yaml`
- Adding a new role-type not in the template library
- Budget impact >20% of mission budget
- Removing a verifier mid-verification phase
- Switching the orchestrator's model

**Auto-approved (with CTO notification, not Inbox):**
- Adding duplicates of existing role-types for parallel work (within budget)
- Switching models within tier
- Pause / resume
- Mission-scoped removals with no pending work

**Forbidden (cannot be done at all):**
- Removing `@vp-engineering` (the orchestrator)
- Removing all verifiers on a 24-Hour Mode mission (precedence-ordered scope-cut requires at least one of {tests, security} on sensitive surfaces)
- Granting tools outside the role-template's allowlist
- Adding a role with tools not in the project-allowed tool registry

## Discovery — when the orchestrator proposes a role addition

The orchestrator monitors the mission for signals:

| Signal | Threshold | Proposal |
|---|---|---|
| Workload | An implementer 40%+ over slice budget AND similar work remains | Spin up another implementer |
| Specialty | Slice involves a domain not in current team's skill mix | Add specialist for X |
| Bottleneck | Verifier queue ≥3 unverified slices | Duplicate the verifier |
| Under-utilization | Role idle ≥2 phase budgets | Dismiss the idle role to save budget |

Proposals appear in the CTO Inbox with severity `medium`, proposer `@vp-engineering`, evidence (workload data, queue length, idle duration), recommendation, and decision options.

## Examples (from engineering-context.md §18)

**Example A — CTO-initiated mission-scoped addition:**

```
You:    @vp-eng, this is going to need a lot of frontend work. Spin up
        another stylist.

@vp-eng: Confirming team modification:
         ADD_ROLE template=stylist id=stylist-2
         Budget impact: +$2.40 (5% of mission budget)
         Auto-approval applies (existing role-type, within threshold).
         Confirm to proceed?

You:    Yes

@vp-eng: Done. @stylist-2 assigned to slice-9.
         Decision: decisions.md#dec-2026-05-16-007
```

**Example B — CTO-initiated removal:**

```
You:    @vp-eng, we don't need the data-engineer. Everything's in-memory.

@vp-eng: Dismissing @data-engineer from mission skill-loader-refactor.
         No pending work to recover. Auto-approval applies.
         Decision: decisions.md#dec-2026-05-16-008
```

**Example C — Orchestrator-proposed addition (discovery):**

```
@vp-eng: PROPOSAL — CTO Inbox item created
         Severity: medium
         Observation: slice-7 (JWT verification) involves cryptography
         patterns my current implementers haven't engaged with this mission.
         @impl-a is 35min over budget on slice-7 and the diff hasn't compiled.
         Proposal: spin up @crypto-specialist (mission-only)
         Estimated impact: +$4.20 (8% of mission budget)
         Options: Approve | Reject | Take over

You:    Approve

@vp-eng: @crypto-specialist spawned. Slice-7 reassigned. @impl-a returns
         to slice-3 queue. Decision: decisions.md#dec-2026-05-16-014
```

**Example D — Promoting to persistent:**

```
You:    @vp-eng, the @crypto-specialist worked out. Make it a permanent role.

@vp-eng: This would modify the org chart permanently. PR generated:
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

         PR #127 opened. Awaiting CTO review + @pr-reviewer (Gemini).
         Decision: decisions.md#dec-2026-05-16-019
```

## Dashboard surface

The dashboard's Org Chart panel shows the team with delta annotations:

```
@vp-engineering          ●  running
@architect               ✓  done
@data-engineer           ✗  dismissed this mission        (delta: -)
@impl-a                  ●  running
@impl-c                  ●  running   (model: opus, delta: ↑)
@stylist                 ●  running
@stylist-2  (delta: +)   ●  running
@crypto-specialist (+)   ●  running   ← orchestrator-proposed, approved
@tests-verifier          ●  idle
```

Symbols: `(+)` mission-scoped addition; `(-)` removal; `(↑)/(↓)` upgrade/downgrade.

## Anti-patterns

- **Editing `org-chart.yaml` directly for one-off needs.** Mission-scoped is the default; persistent requires a PR.
- **Spawning ad-hoc Claude subagents not in the org chart.** Every active worker is a rostered role. Shadow agents forbidden.
- **Granting tools by request.** Tools are in role templates. A role needing a tool it doesn't have triggers RECONFIGURE_ROLE, not silent tool-grant.
- **Reducing the team below the safety floor.** At least one of `@tests-verifier` or `@security-verifier` must remain on sensitive-surface missions.
- **Modification storms.** Rate-limited to 1 modification per 5 minutes from CTO. Rapid requests batch.

## See also

- `engineering-context.md` §18 (full Conversational Team Management spec)
- `FORGE_TEAM_MODE.md` §5 (role roster), §12 (CTO approval), §13 (inter-agent protocol)
- `org-chart` — the underlying YAML-to-agents generation
- `decision-ledger` — every modification creates a ledger entry
- `cto-inbox` — surfaces team-modification proposals
- `payroll` — modifications affect monthly budget
