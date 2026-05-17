---
name: plan-then-execute
description: Write a plan before writing code, decompose into vertical slices, and identify the gates that need user approval. Use this immediately after research-first and before any implementation on tasks larger than a one-line fix. This skill applies whenever there is more than one file to change, more than one decision to make, or anything irreversible (schema, deploys, data, public APIs). It also applies to "small" tasks the user phrased simply but which touch multiple layers; the planning artifact prevents the most common AI failure mode of horizontal phasing (DB then API then UI), which delays end-to-end feedback and hides integration bugs until the very end.
---

# Plan, Then Execute

A short written plan before code is the single highest-leverage discipline in agentic engineering. The plan exists so that mistakes happen on paper instead of in the diff, and so the user can correct course while correction is still cheap.

## Why this matters

Without a plan, the loop collapses into "type something, see what happens, type more." For trivial changes that's fine. For anything else, it produces three predictable failures: scope creep, horizontal phasing that defers integration risk, and decisions made silently that the user would have wanted input on.

A plan is not a Gantt chart. It is the smallest written artifact that makes the shape of the change visible — usually 5–15 lines.

## The plan template

For any non-trivial change, write this before the first edit:

```
GOAL: <one sentence: what does the user actually need?>

CONSTRAINTS: <conventions, deps, perf, security from research-first>

SLICES (vertical, each independently testable):
  1. <smallest end-to-end change that proves the approach>
  2. ...
  3. ...

BLAST RADIUS: <files / modules / consumers affected>

UNKNOWNS: <what I don't know yet; how I'll resolve before/during>

GATES (need user input): <list, or "none">

DONE WHEN: <observable criteria>
```

The point is not the template. The point is that each section forces a question that's painful to skip.

## Vertical slices, not horizontal phases

The most common AI planning failure is to decompose by layer: "Phase 1: DB schema. Phase 2: API. Phase 3: UI." This is appealing because each phase is internally consistent. It is also wrong, for two reasons.

First, integration risk lives between the layers; horizontal phasing pushes that risk to the end of the project, when fixing it is expensive. Second, horizontal phasing produces no demonstrable value until the final phase, which means there is nothing to validate the plan against until you've already paid for it.

The right decomposition is vertical: tracer bullets that cross every layer the change touches, but for a sliver of the functionality. The first slice is the smallest possible end-to-end thing that exercises the architecture. Each later slice broadens or hardens it.

For a "let users export their data as CSV" feature, horizontal looks like: schema → endpoint → button. Vertical looks like: hardcode one user, write a CSV with one column, wire a button to it; then expand columns; then expand to all users; then add edge cases (large exports, empty data, errors).

Vertical slices catch architectural mistakes by slice 1, when the cost of fixing them is hours instead of days.

## What goes in BLAST RADIUS

Anything that could break in a way that isn't obvious from the diff:

- Files modified directly.
- Files that import or call the modified code.
- Tests that exercise the modified code.
- External consumers (other services, webhooks, public APIs, SDK users).
- Data already in production that the change might mishandle.
- Operational surface (deploy steps, env vars, feature flags).

The list does not need to be exhaustive — it needs to be honest. If you write "BLAST RADIUS: just this file" you are claiming the file has no callers. Verify it.

## What goes in GATES

A gate is a decision the user, not you, should make. Default to surfacing rather than silently choosing for:

- Adding a runtime dependency, especially one that brings in a new abstraction (ORM, framework, queue, lock manager).
- Changing the shape of a public API, wire format, or DB schema.
- Anything irreversible: deletes, migrations, force pushes, dropped columns, history rewrites.
- Auth, crypto, secrets handling, deserialization of untrusted input.
- Feature scope that exceeds what the user described.
- Architectural choices not implied by the request (e.g., "should this be sync or async?", "should this be a library or a service?").

For everything else, decide and report. Gates exist for high-stakes decisions, not for asking permission to write a `for` loop. Over-asking is its own failure: it pushes work back to the user and trains them to skim approvals.

## Confirming the plan with the user

Surface the plan before executing when:

- The work is multi-step and any step is non-trivial.
- The plan contains gates.
- You're about to spend significant tool calls or time.
- The user gave a high-level brief and the plan involves interpretation.

You do not need to surface the plan for one-line changes, obvious typo fixes, or follow-ups inside an already-approved plan. The skill is calibration.

When you do surface it, lead with the goal and slice list — those are what the user actually checks. Bury the boilerplate.

## Decision rules

- **If you cannot write the plan, you do not understand the task.** Stop and either re-research or ask.
- **If slice 1 is not end-to-end, redo the slicing.** "Slice 1: write the schema" is horizontal, not vertical.
- **If BLAST RADIUS is "just one file" but the file is imported elsewhere, expand the radius.** It is not just one file.
- **If GATES is empty on a non-trivial change, scrutinize the plan again.** It may be that the change is genuinely uncontentious. It may be that you've silently made a decision you shouldn't have.
- **If DONE WHEN is "the user is happy", the criterion is too vague.** Replace with observable behavior or test outcomes.

## After approval: execute one slice at a time

Do not implement all slices in one diff. Each slice goes through the rest of the loop independently: execute → verify → review → (optionally) ship. This keeps each diff small enough to actually review and gives you signal at the slice boundary that the plan is still good.

Between slices is the cheapest moment to revise the plan based on what you learned implementing the previous one.

## Anti-patterns

- **Post-hoc planning.** Writing a "plan" after the code is done. This is documentation, not planning, and it does not catch the failures planning is supposed to catch.
- **Horizontal slices.** Phasing the work by layer. Always defer integration risk.
- **Silent gates.** Adding a dep, picking a framework, or designing a schema without telling the user. Even if your choice is correct, depriving them of the choice is wrong.
- **Plans without "done when".** Without observable success criteria, you'll know you're done when you're tired, not when the work is finished.
- **Plans that grow during execution without being rewritten.** If the slice list expanded, the plan changed; rewrite it (briefly) and decide whether to re-confirm with the user.
- **Confirming the plan and then deviating from it.** If the change is necessary, surface the deviation; do not bury it.

## See also

- **research-first** — what feeds CONSTRAINTS and BLAST RADIUS.
- **right-sized-engineering** — the lens that filters slice design (avoid speculative slices).
- **surgical-edits** — how each slice should be implemented once approved.
- **engineering-excellence** — how this plan slots into the larger loop.
