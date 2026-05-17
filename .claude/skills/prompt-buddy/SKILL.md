---
name: prompt-buddy
description: A pre-flight and post-loop quality layer that wraps the engineering loop. At session prompt-receipt, this skill enriches non-trivial prompts with relevant memory, project context, and prompt-engineering structure, then surfaces the enriched prompt to the user for confirmation before any code work begins. After the loop completes, the same skill performs a single ground-truth-anchored review: did the loop's actual output match the user's original intent. Use this skill on any non-trivial prompt UNLESS the user explicitly says "skip planning", "just do it", "no preamble", or the prompt is trivially scoped (one-line fix, one-shot question, conversational reply). Do not run this skill on trivial prompts — the overhead exceeds the value. Do not use it as a continuous mid-loop critic — the research is unambiguous that AI-on-AI critique without ground-truth signals degrades quality, and that failure mode is what the existing skills (verify-rigorously, critical-self-review, production-readiness) prevent through ground-truth-anchored mechanisms.
---

# Prompt Buddy

A two-touch quality layer wrapped around the engineering loop. Phase A enriches the user's prompt before code work begins. Phase B reviews the loop's output against the user's original intent after work completes. Both phases are *event-anchored* (receipt of prompt; loop completion) and *ground-truth-anchored* (Phase B uses test results, scenario evidence, and diff content — not self-critique).

## Why this exists, and what it deliberately is not

There is a recurring instinct in agentic AI design to insert a continuous critic agent that watches every intermediate step and flags problems. The 2024–2025 research literature (ICLR 2024, NeurIPS 2024 RISE, the Reflector studies of Self-Refine / CRITIC / Reflexion / MAGICORE) is unambiguous on this:

- LLMs **cannot reliably self-correct reasoning** intrinsically without external verification signals (ICLR 2024).
- Self-Refine *degrades* performance on GSM8K and MATH in head-to-head comparisons (NeurIPS 2024 RISE).
- Documented per-system error rates of naive self-critique loops: CRITIC 14.3% wrong corrections, Reflexion 16.3% false positives on MBPP.
- "Reflection poisoning": a bad self-critique can steer the agent *away from* a correct answer it had reached.

The takeaway, stated in the Reflector research more bluntly than I'll restate it: *built on a ground-truth signal you get real improvement; built on the model's own opinion of its output you get a coin flip*.

This skill therefore does **two specific things** at **two specific moments**, and does not do continuous mid-loop critique. The continuous-critique role belongs to deterministic ground-truth checks (test runs, lint, type-check, scenario execution) which the existing skills (`verify-rigorously`, `critical-self-review`, `production-readiness`) already enforce, and which can be tightened further with Claude Code hooks (see `engineering-excellence/briefings/hooks-recipe.md`).

## When this skill triggers

**Triggers (at least one must apply):**

- The user prompt is substantive (more than a sentence, or asks for a code change beyond a one-line fix).
- The prompt has measurable ambiguity (multiple plausible interpretations).
- The prompt touches a sensitive surface (auth, payments, persistence, network IO, customer-rendering, migrations) per `engineering-context.md` §17.
- The prompt mentions prior work ("the auth bug we discussed", "remember when we…", "like last time"). These are memory-recall cues.
- The user explicitly invokes `/buddy` or `/prompt-buddy`.

**Hard skip (never run on these):**

- The user signals "just do it", "skip planning", "no preamble", "be quick", "don't ask".
- The prompt is conversational (a question, not a task).
- The prompt is a single-line fix the user has already specified ("change `5` to `10` in line 22").
- The prompt is a continuation/clarification of an in-flight task already running.

When in doubt between trigger and skip, **err on the side of skip**. Buddy that wakes too often is exactly the friction that gets disabled.

## Phase A — Pre-flight enrichment

Runs once, immediately on prompt receipt, before the engineering loop starts. Output is a structured artifact the user confirms or corrects.

### What enrichment actually means here

Enrichment is **structural**, not generative. The buddy does not invent new requirements. It restructures the user's prompt so the engineering loop has clear inputs:

1. **Restated intent.** The user's prompt in 1–2 sentences, in the buddy's words. If the user originally wrote "fix the timeout thing in the booking flow", the restatement might be "Fix the request timeout that occurs in the booking flow when [X] happens." If the buddy can't restate without inventing details, that's a signal — it should ask, not guess.
2. **Relevant memory recall.** Pull from `.claude/memory/` only what's directly relevant. Surface `working.md` decisions in flight, recent `journal.md` entries that touch the same area, `conventions.md` rules that apply, `playbooks.md` procedures if any apply. Quote sparingly. **This is informational context for the user, not anchoring instructions for the loop.** (See "Reflection poisoning" caveat above.)
3. **Inferred scope.** The files, modules, or surfaces likely to be touched. Based on what the buddy can see (engineering-context.md, recent memory). If scope is genuinely unclear, say so.
4. **Predicted concerns from §17.** If the inferred scope hits any threshold in §17 (e.g., touches auth, touches payments), call it out: "This appears to touch authentication; expect parallel-by-concern verification at the verify phase."
5. **Proposed approach in 1–3 sentences.** Not a plan (that's `plan-then-execute`'s job). Just enough for the user to confirm direction.
6. **Open questions.** Anything the buddy can't answer from available context. **Do not present more than 3.** If there are more, the prompt isn't ready and the buddy should ask the highest-leverage one first.

### Output format

```
## Buddy intake

**Restated intent:** [1–2 sentences, no invention]

**Relevant memory:**
- [working.md] [if applicable, 1 line]
- [journal:YYYY-MM-DD] [if applicable, 1 line]
- [conventions: rule] [if applicable, 1 line]
- (omit any line where there's nothing relevant)

**Inferred scope:** [files/modules/surfaces; or "unclear — see questions"]

**Concerns flagged (§17):** [list, or "none above threshold"]

**Proposed approach:** [1–3 sentences]

**Open questions:** [up to 3, ranked by leverage; or "none"]

Confirm to proceed, correct any of the above, or say "skip" to bypass buddy for this prompt.
```

### What the buddy must not do in Phase A

- **Invent requirements.** If the user said "add export," the buddy doesn't decide between CSV and JSON; that's an open question.
- **Constrain the loop with memory.** Memory items are surfaced as informational; the engineering loop reads them itself via `project-memory`. Don't tell the loop "use the same approach as last time" — past approach may not apply.
- **Run more than one round of enrichment.** If the user corrects, accept the correction and proceed. Don't loop the enrichment.
- **Estimate effort, time, or token cost.** The system prompt is explicit about this; the buddy doesn't override it.
- **Pad.** If a section has nothing useful, omit the line. Empty sections are noise.

### When Phase A is overkill (a sub-trigger threshold)

For prompts that are "clear enough but not trivial" (a feature implementation with specific scope), the buddy can produce a **light enrichment**: just *Restated intent* + *Concerns flagged* + *Open questions*. Skip memory recall and proposed approach when they'd be padding.

## Phase B — Final-pass review (post-loop)

Runs once, after the engineering loop has completed (TodoWrite all tasks marked complete, or the equivalent signal). This is the only mid- or post-loop review the buddy performs.

### What Phase B reviews

- **Original intent vs delivered output.** Does the diff/output address what Phase A's *Restated intent* said? Use the original Phase A artifact as the comparison baseline.
- **Ground-truth signals only.** What evidence is available?
  - Did tests run? With what result? (verify-rigorously rung 4–5)
  - Did the scenario execute? (verify-rigorously rung 6)
  - Did unhappy paths get exercised? (verify-rigorously rung 7)
  - Were any High/Critical findings from parallel-by-concern verification left unresolved?
- **Drift detection.** Did the loop solve a different problem than the user asked for? Did scope expand silently?

### What Phase B does NOT do

- **Re-evaluate the diff for hallucination via self-critique.** That's `critical-self-review` with the AI-bug taxonomy, which already runs in the loop. Buddy doesn't redo it.
- **Re-run tests.** The loop's verify phase already did. Buddy reads those results, doesn't generate new ones.
- **Add new requirements.** Phase B is review, not extension. If something's missing, surface it; don't fix it.
- **Loop on its own findings.** If Phase B flags a gap, the buddy reports it and stops. The user decides whether to extend the work.

### Output format

```
## Buddy debrief

**Original intent (from Phase A):** [restate]

**Delivered:** [1–3 sentences, what the loop actually produced]

**Ground-truth evidence:**
- Tests: [pass/fail/not run, with run command if available]
- Scenario: [executed and observed / not observed / N/A]
- Verification gates: [all clear / which findings remain]

**Drift check:** [matches intent / partial match — what's missing / scope expanded into Y]

**Recommendation:** [done / extend with X / open question Z]
```

## How the buddy interacts with the rest of the suite

Buddy is the **outer wrapper**. The loop runs unchanged in between.

```
session start
  ↓
[Phase A]  prompt-buddy        ← NEW: enrichment, user confirmation
  ↓
research-first
plan-then-execute              ← still mandatory; buddy doesn't replace plan mode
surgical-edits + testing + docs
version-control-craft
verify-rigorously              ← parallel-by-concern when triggered
critical-self-review           ← AI-bug taxonomy diff re-read
production-readiness           ← if production
project-memory                 ← record
  ↓
[Phase B]  prompt-buddy        ← NEW: final review against original intent
```

Buddy does not duplicate `unbiased-development` (anti-sycophancy is a continuous discipline, not a phase). Buddy does not duplicate `right-sized-engineering` (taste filter, runs at design decisions). Both continue to operate during the loop.

## Interaction with hooks (recommended companion configuration)

The buddy's Phase B is more reliable when ground-truth signals are abundant. Claude Code hooks can be configured to ensure they always exist. See `engineering-excellence/briefings/hooks-recipe.md` for the full setup. The minimum recommended hooks:

- **`PostToolUse` on `Edit|Write`** — auto-format (Prettier, Black, etc.) so style isn't a Phase B finding.
- **`PostToolUse` on `Edit|Write`** for source files — type-check on save (tsc --noEmit, mypy --strict for changed file). Surfaces type errors before Phase B.
- **`Stop`** — block stopping if TodoWrite has open `in_progress` items. Forces honest completion.
- **`UserPromptSubmit`** (advanced) — auto-inject `engineering-context.md §17` summary into prompts that match sensitive-surface patterns. Buddy then has more context to enrich with.

Hooks are configuration-layer, not skill-layer. They run deterministically on every event; the buddy reads their outputs as evidence in Phase B.

## Anti-patterns this skill exists to prevent

- **Continuous mid-loop AI critique.** Research-validated failure mode. Use deterministic checks (hooks, ground-truth signals) instead.
- **Buddy-on-buddy loops.** Phase A runs once. Phase B runs once. No iteration.
- **Memory as instruction.** Past approaches inform; they do not constrain. The loop decides; memory is one input among many.
- **Buddy enrichment that adds requirements.** The user's intent is the contract. Buddy clarifies, doesn't extend.
- **Triggering on trivial prompts.** Buddy fatigue is real. The "hard skip" list above is load-bearing.
- **Treating Phase B as another verification pass.** Verification is `verify-rigorously`'s job. Phase B is an *intent-vs-output* check, not a code review.

## What "done" looks like for the buddy

- Phase A: a structured intake artifact, the user confirmed (or corrected and confirmed), the engineering loop has started.
- Phase B: a structured debrief artifact, the user has the information to decide "ship / extend / open question". The buddy's role ends with that artifact, not with the user's decision.

The buddy does not declare the work itself done. `engineering-excellence` `§What "done" means` does that, with all eight criteria. Buddy's debrief is one input to that judgment, not a replacement for it.

## See also

- **engineering-excellence** — the loop the buddy wraps.
- **project-memory** — what the buddy reads from in Phase A.
- **engineering-context.md §17** — the thresholds Phase A uses for sensitive-surface detection.
- **verify-rigorously** — the ground-truth verification the buddy reads in Phase B.
- **critical-self-review** — the AI-bug taxonomy review the buddy does NOT duplicate.
- **`engineering-excellence/briefings/hooks-recipe.md`** — the deterministic ground-truth signals the buddy relies on in Phase B.
