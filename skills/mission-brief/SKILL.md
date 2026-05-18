---
name: mission-brief
description: Produces and maintains MISSION_BRIEF.md at mission kickoff — the single contract document between CTO and team for a mission. Triggers when a new mission is accepted, when the buddy Phase A intake completes, or when the CTO explicitly invokes `/mission start`. The brief is the immutable contract until the mission closes or the CTO approves a scope change. Every role on the mission reads this file first. Without a brief, the mission cannot start.
---

# Mission Brief

The MISSION_BRIEF.md is the contract between the CTO and the engineering team for a single mission. It is signed at H+0, immutable except via CTO-approved scope changes, and read by every role at the start of every action.

## Why this exists

A mission with an implicit brief drifts. Three roles each interpret the goal slightly differently. The orchestrator decides to add a "nice to have." The implementer optimizes for the wrong thing. Two days later, the diff doesn't match what the CTO wanted, and nobody can point to the moment when scope changed because there was no fixed reference point.

The brief is the fixed reference point. Every drift detection (buddy Phase B, mid-mission check-in, verifier findings) compares against the brief. Every scope-change proposal is a diff against the brief, surfaced explicitly.

## When this skill triggers

- A new mission is accepted (`forge mission start` or `/mission start` in Forge)
- The buddy Phase A intake completes (the intake's structured output becomes the brief's draft)
- The CTO explicitly invokes `forge brief <mission-id>` to inspect or edit
- A scope-change proposal is approved (the brief is amended with a versioned addendum, not rewritten)

## Hard skip

- For trivial work (single-line fix, conversational answer, single-file refactor outside production-critical paths). Standard Mode loop handles these — no brief required.
- For ad-hoc Standard-Mode verifier fan-outs. The trigger documentation in the original prompt is sufficient.

## Brief schema

A brief has a fixed structure. Fields are mandatory unless marked optional.

```markdown
# Mission Brief — <mission-name>

**ID:** <mission-id>           (e.g., `skill-loader-refactor`)
**Mode:** standard | 24h        (whichever applies)
**Created:** <ISO timestamp>
**CTO signature:** <CTO ID + ISO timestamp>
**Status:** active | closed | aborted

## Problem statement
<1-2 paragraphs. What problem are we solving? Why now? What's the harm if
we don't solve it? No "value-add" language.>

## Success criteria
<Measurable. Each criterion is a sentence that can be tested as pass/fail
when the mission closes.>
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Out-of-scope
<Things we are explicitly NOT doing. This is the most important field for
preventing drift.>
- Out-of-scope item 1
- Out-of-scope item 2

## Constraints
- Time: <deadline>
- Cost: <budget USD>
- Tech: <constraints, e.g., "Must integrate with existing Spring Security
        config; no new framework deps">
- Compliance: <if any, e.g., "PII handling per Bakstage policy">

## Risks (known unknowns)
- Risk 1: description + mitigation if any
- Risk 2: ...

## Team assembled
- @vp-engineering (orchestrator)
- @architect
- @impl-a, @impl-b
- @tests-verifier
- @security-verifier
- @pr-reviewer (Gemini)
(plus mission-scoped additions or dismissals; see team-delta.yaml)

## Architecture summary
<1 paragraph. Pointer to full architecture doc if it exists. The summary is
enough for orientation; the full doc is in artifacts/architecture.md.>

## Phase budget (24-Hour Mode only)
H+0:30  Research kicked off
H+2:00  Research complete
H+2:30  Architecture review (CTO gate)
H+3:00  Plan locked
H+12:00 Mid-mission stand-up
H+18:00 All slices complete
H+19:00 Verification complete
H+22:00 PR opened (Gemini review)
H+24:00 Merge / release

## Approval gates required
<Specific to this mission — overrides §12 defaults if any>
- [ ] Mission brief sign-off (CTO at H+0)
- [ ] Architecture sign-off (CTO at H+2:30)
- [ ] PR merge (CTO at H+24:00)
- [ ] Any irreversible operation
- [ ] Any §17.5 production-critical path change
```

## How to produce a brief

The `@vp-engineering` role drives this:

1. Run the buddy Phase A intake on the CTO's initial prompt.
2. Convert the intake's structured output into the brief schema above.
3. Pre-fill what you can; mark uncertain fields explicitly with `[uncertain — needs CTO input]`.
4. Surface the draft to the CTO with three explicit options: `Sign as-is`, `Edit then sign`, `Cancel mission`.
5. Once signed, write to `.claude/missions/<mission-id>/context.md`. The signed brief is immutable.

## How a brief is amended

A brief change is a structured operation, never a silent edit:

1. The orchestrator (or a specialist) identifies a needed scope change.
2. A CTO Inbox item is created of type `scope_change`, citing the section of the brief affected, the proposed change, the rationale, the budget impact, and the decision options.
3. If the CTO approves, the brief gets an **addendum** at the bottom — never an in-place edit. The original is preserved.
4. Addenda are numbered: `## Addendum 1 — <date> — <summary>`.
5. The mission's decision ledger gets an entry.

## What the brief is NOT

- Not a wishlist. Every success criterion must be testable.
- Not a research document. Long research goes in `artifacts/research.md`; the brief summarizes.
- Not a design document. Long architecture goes in `artifacts/architecture.md`; the brief points to it.
- Not an implementation plan. The plan lives in `mission/plan.md`; the brief sets the goal, not the steps.
- Not editable mid-flight. Amendments are addenda, signed by CTO.

## Anti-patterns

- **Briefs with vague success criteria** ("Make the system faster"). Specific: "Reduce p95 latency on /api/skills/load from 800ms to <300ms, measured via the existing perf bench."
- **Out-of-scope section left empty.** It's the highest-leverage field. Force yourself to name at least 3 things you're not doing.
- **Brief that doesn't fit on one screen.** If it spills over, you're putting plan content into the brief. Move it to `plan.md`.
- **Pre-filling the CTO signature.** The signature is the moment the CTO commits. Without it, the team doesn't start.

## See also

- `prompt-buddy` — produces the Phase A intake that becomes the brief's draft
- `decision-ledger` — records every brief amendment as a decision
- `cto-inbox` — surfaces scope-change items to the CTO
- `engineering-context.md` §14 (Mission Brief concept) and §17 (Team Mode coordination)
- `FORGE_TEAM_MODE.md` §7 (24-Hour Sprint phase budgets)
