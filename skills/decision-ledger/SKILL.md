---
name: decision-ledger
description: Records every decision made by any role during any mission. Append-only. Each entry has timestamp, role, decision summary, why, alternatives considered, evidence, citations, status, scope. Triggers whenever any role makes a decision the next session needs to know about — including dependency additions, framework choices, schema choices, scope cuts, scope expansions, deferrals, team modifications. Hard rule: a decision made by the team that isn't in the ledger by mission end is treated as not having been made.
---

# Decision Ledger

An append-only record of every decision the team makes. The compounding artifact that makes month-six debugging possible.

## Why this exists

In a 9-week period of running a team of 17 roles, you accumulate hundreds of decisions. "Why did we use Voyage 3-Large instead of OpenAI?" "Why does this verifier run on Sonnet?" "Why is @impl-d on leave?" Without a ledger, the answers are in someone's head (yours, or a chat log you can't search). With a ledger, the answer is `grep "voyage" .claude/memory/decisions.md`.

The ledger is the side-effect of every mission. You don't have to remember to update it — every role that participates in a decision is required to log it.

## When this skill triggers

A role records a decision when ANY of:

- **Architecture choice** (framework, dependency, pattern)
- **Schema change** (data model, migration direction, indexing strategy)
- **Scope decision** (added or removed from a brief; deferred work)
- **Team modification** (role added, removed, paused, leave — see §18)
- **Cost decision** (model switch, budget override, mission upgraded to 24h mode)
- **Trade-off decision** (chose X over Y for measurable reasons)
- **Approval given by CTO** (any §12 gate approval)
- **Convention adopted** (added to `conventions.md`)
- **Skill update applied** (from continuous-learning proposal)

## Hard skip

- **Trivial code-level decisions.** "I named this variable `x` instead of `y`" is not a ledger entry. The bar is: would a future session benefit from knowing this?
- **Decisions superseded within the same mission.** If @impl-a proposed using `jose@4`, then within an hour switched to `jose@5`, the ledger records the *final* choice with the iteration in the `alternatives_considered` field. Multiple entries for the same evolving choice = noise.
- **Decisions the CTO would never need to revisit.** Use judgment. If unsure, log.

## Entry schema

```yaml
id: dec-2026-05-16-014
timestamp: 2026-05-16T13:42:14Z
mission_id: skill-loader-refactor              # null for non-mission decisions
role: vp-engineering                           # the role recording the decision
type: dependency_addition                      # see types below
summary: "Add jose@5.x as runtime dependency in packages/skill-loader"

why: |
  Current node-jsonwebtoken has known TS type issues; benchmark shows
  14% slower verification than jose. jose is the recommended path forward
  per Auth0's deprecation announcement (2025-11).

alternatives_considered:
  - id: node-jsonwebtoken
    why_rejected: "Type cast workarounds required; 14% slower (artifacts/jwt-bench.md)"
  - id: native-crypto
    why_rejected: "~80 LOC of JWT-spec handling; maintenance burden"
  - id: jose
    why_chosen: "Maintained; MIT; 18KB gzipped; matches industry direction"

evidence:
  - "benchmark: bench/jwt-verify.bench.ts (artifacts/jwt-bench.md)"
  - "license: MIT (npm view jose license)"
  - "maintenance: last release 14d ago, weekly downloads 12M"
  - "audit: npm audit clean, snyk clean"
  - "Auth0 deprecation: <URL>"

citations:                                     # links to other ledger entries
  - dec-2026-04-08-003                         # prior decision on JWT library
  - conventions.md#dep-license-policy

approved_by: cto
approved_at: 2026-05-16T13:45:22Z
scope: persistent                              # mission | persistent
status: applied                                # proposed | approved | applied | superseded | rejected

# Optional follow-on
supersedes: dec-2026-04-08-003                 # if this replaces an earlier choice
followups:
  - "Migration mission to upgrade existing 3 call sites"
```

## Decision types (controlled vocabulary)

The `type` field uses one of:

| Type | Example |
|---|---|
| `architecture_change` | Replace REST with gRPC for internal service |
| `dependency_addition` | Add jose@5.x |
| `dependency_removal` | Remove node-jsonwebtoken |
| `dependency_upgrade` | Upgrade Spring Boot 3.2 → 3.3 |
| `schema_change` | Add column; rename table |
| `pattern_choice` | Choose Saga over 2PC for distributed transaction |
| `scope_addition` | Brief amendment expanding scope |
| `scope_reduction` | Brief amendment cutting scope |
| `deferral` | Punt to next mission |
| `team_modification` | §18 add/remove/leave |
| `model_change` | Switch @impl-c to Opus for this mission |
| `convention_adopted` | Promote a pattern to conventions.md |
| `convention_revised` | Update an existing convention |
| `skill_update` | Apply a continuous-learning proposal |
| `cto_approval` | Approve a §12 gate item |
| `cto_rejection` | Reject a §12 gate item |
| `mission_lifecycle` | Start, pause, resume, close, abort |
| `incident` | Self-healing event; verifier finding storm; etc. |

## Where the ledger lives

- Mission-scoped entries: `.claude/missions/<mission-id>/decisions.md` (per-mission ledger)
- Project-scoped entries: `.claude/memory/decisions.md` (committed; the durable ledger)

At mission close, mission-scoped entries are appended to the project ledger with a section header `## Mission: <mission-id> — <date>`.

## Append-only — no edits, no deletes

- Entries are immutable once written.
- A decision that turns out to be wrong is **superseded**, not edited. Add a new entry with `supersedes: <old-id>` and the new choice + why.
- A decision that was made on bad evidence gets a `correction` annotation: a new entry of type `correction` linking to the original.
- Manually deleting entries breaks the audit trail. The pre-commit hook detects this and rejects.

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `add` | Any role making a decision | Appends entry to mission ledger; the ledger schema is enforced |
| `supersede` | New decision replaces old | Adds new entry; sets `supersedes: <id>` on it; marks old as `superseded` |
| `correct` | Mistake identified | Adds correction entry pointing to original |
| `merge_to_project` | Mission close | Mission ledger appends to project ledger |
| `query` | Any role | `forge decisions search <query>` — searches ledger with hybrid retrieval |

## What the ledger is NOT

- **Not a debate log.** Conversations live in the whiteboard. Only the conclusion + evidence is in the ledger.
- **Not a wiki.** No prose explanations of how systems work. That's `conventions.md` or `docs/design/*.md`.
- **Not a task tracker.** Tasks are in JIRA / GitHub Issues / TodoWrite.
- **Not editable.** Append-only. See above.

## Anti-patterns

- **Skipping the ledger on "obvious" decisions.** Six months later, no decision feels obvious.
- **Padding the ledger with non-decisions.** "Decided to use a variable name" is not a decision. Use judgment.
- **Editing entries to "clean up history."** Forbidden. Append corrections.
- **Vague entries.** "Decided to use a faster library." Specific: "Switched from X to Y because benchmark X showed 14% latency reduction."
- **Entries without evidence.** Every entry must have at least one `evidence:` item or a `citations:` to another entry that has evidence.

## See also

- `engineering-context.md` §13 (memory file) and §14 (Decision Ledger concept)
- `project-memory` — the broader memory protocol
- `cto-inbox` — many ledger entries originate from inbox approvals
- `team-modifications` — every team change writes a ledger entry
- `meditation` and `grounded-reverification` — can produce ledger entries
