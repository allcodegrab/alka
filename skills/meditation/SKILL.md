---
name: meditation
description: Event-anchored structured per-role reflection at mission boundaries. NOT free-form introspection — strict schema, ground-truth-anchored, produces concrete proposals only. Triggers at mission close, weekly review, or CTO request. Output is `.claude/meditations/<mission-id>/<role>.md` with mandatory sections: concrete metrics (cited), concrete observations (cited), pattern (only if cited 3+ times), proposals (max 3, testable), what I'm NOT going to do. The feature most at risk of falling into reflection poisoning; the schema is the safeguard.
---

# Meditation

Event-anchored, ground-truth-anchored, artifact-producing structured analysis. Per-role. At mission boundaries.

## Why this exists, and what the research says

This is the feature most at risk of falling into reflection poisoning. The 2024-2025 literature on LLM self-correction (ICLR Self-Refine, CRITIC, Reflexion, NeurIPS Reflector studies) shows that continuous AI self-critique *degrades* quality — bad self-critiques steer the agent away from correct answers.

Why include this feature at all, then? Because event-anchored, ground-truth-anchored, schema-bound reflection *is* useful. The difference between the failure mode and the success mode is procedural:

- **Failure mode (continuous, free-form):** "I think I could have done better on slice-7. Let me try to identify why."
- **Success mode (event-anchored, ground-truth):** "Slice-7 had 2 retries. Verifier flagged 1 HIGH path-traversal finding. Cause: trusted manifest.path without containment. Proposal: add this check to surgical-edits skill."

The schema below enforces the success mode and forbids the failure mode.

## When this skill triggers

| Event | Who meditates | Output |
|---|---|---|
| Mission close (after buddy Phase B) | Every participating role | `.claude/meditations/<mission-id>/<role>.md` |
| Weekly review (Friday 17:00 local) | Per-role weekly summary | `.claude/meditations/weekly/<YYYY-WW>/<role>.md` |
| CTO explicit request | Specified scope | Same |
| Failed mission (auto) | Participating roles | Marked `incident: true` |

## Hard skip

- Trivial standard-mode missions (<30 min total)
- Conversational tasks (not missions)
- Successful missions if `meditation_frequency: weekly-only` is set in config
- Roles that participated <5 min in the mission (insufficient data)

## Mandatory schema

The skill enforces sections. Free-form text is allowed only inside the marked sections, and is bounded.

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
- Slice-7 retries: see decisions.md#dec-2026-05-16-014. Original used jose@4.x
  API patterns; jose@5.x changed signature. Diff failed tsc:src/auth/jwt.ts:31.
  (Citation: tests-verifier_findings.md)
- Path traversal HIGH finding: see security-verifier_findings.md. Cause:
  trusted `manifest.path` from skill SDK without `path.relative()` containment.

## Pattern (only if cited 3+ times across journal)
None this mission. (See weekly meditation.)

## Proposals (changes that would prevent recurrence — max 3, testable)
- Update surgical-edits skill: add "third-party library API stability"
  checklist item: "Before using version-pinned third-party library, check
  release notes for breaking changes between local cache and current pin."
  Rationale: would have caught jose@4→5 issue before tsc fail.
  Citations: weekly meditation, mission decisions.md, jose changelog.

## What I'm NOT going to do
- I am not going to "be more careful" — not a proposal.
- I am not going to recommend changing tools — current tools were correct.
- I am not going to propose redundancy without evidence of need.

## CTO action
- [Approve] → Open PR with skill update
- [Reject]  → No action
- [Discuss] → Open question
```

## The hard rules (enforced)

1. **Every observation cites a file or artifact.** "I felt rushed" — forbidden. "I had 18 min per slice avg vs. 60 budgeted" — required.
2. **Every proposal is testable.** "Improve" — forbidden. "Add this checklist item to this skill" — required.
3. **No comparing to other roles.** Per-role only. Comparison is the CTO's job at weekly review.
4. **No re-litigating past decisions.** If a decision was made (decisions.md), it stays. A meditation may propose updating the *convention* that produced it; it cannot retroactively unmake the decision.
5. **Maximum 3 proposals.** More than 3 = wish-list territory. Pick the most testable.
6. **No proposals on successful missions if no patterns identified.** "Nothing to propose" is a valid meditation. Don't manufacture proposals to justify the meditation existing.
7. **No "lessons learned" prose.** The structure is the lesson.

## What meditation is NOT

- **Not a performance review.** Roles don't get promoted/demoted by meditation. Meditation produces skill-update proposals. The CTO decides if patterns warrant role changes (via team-modifications).
- **Not free-form text.** Schema-enforced.
- **Not continuous.** Event-anchored only.
- **Not philosophical.** Concrete metrics, concrete observations, concrete proposals.
- **Not collective.** Per-role. The orchestrator does NOT meditate "as the team."

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `trigger_per_role` | Mission close | Each role produces its meditation |
| `trigger_weekly` | Friday 17:00 (configurable) | Each active role produces weekly meditation |
| `validate_schema` | Pre-write | Reject meditation that violates schema (missing sections, free-form prose) |
| `emit_proposals` | Post-write | Aggregate proposals; each becomes an inbox item |

## Anti-patterns

- **Continuous meditation.** Forbidden. Event-anchored only.
- **Free-form prose.** Schema-enforced.
- **Praise / blame.** Neither. Metrics, observations, proposals.
- **Cross-role attribution.** "@impl-b blocked me" — forbidden. The whiteboard had the question; if it stayed open, that's a process issue for the next mission's brief.
- **Meditation as ritual that produces no value.** A "nothing to propose" meditation is the correct output when no patterns emerged. Don't fabricate proposals.

## See also

- `engineering-context.md` §14 (Meditation concept; reflection-poisoning discipline)
- `FORGE_TEAM_OPERATIONS.md` §8 (full meditation spec) and §1 (research anchor)
- `prompt-buddy` (engineering-excellence-v6) — the same discipline applied to mission intake/close
- `dream-mode` — runs meditation on failed missions during cycles
- `decision-ledger` — proposals approved here are logged
- `cto-inbox` — proposals surface as items
