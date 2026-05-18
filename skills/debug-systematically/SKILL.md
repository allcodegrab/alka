---
name: debug-systematically
description: Find the cause of a bug using hypothesis-driven, evidence-gathering investigation rather than trying random fixes. Use this skill any time something is broken and the cause is unknown — failing tests, production incidents, unexpected behavior, regressions, flaky tests, performance problems. Trigger this whenever the user describes a symptom ("it's not working", "this is failing", "the test is flaky", "it crashes when I..."), and resist the urge to try fixes before understanding the cause. The most expensive debugging mistake is fixing a symptom without finding the cause; the second most expensive is rewriting working code in the hope the bug goes away. This skill exists to prevent both.
---

# Debug Systematically

Debugging is finding the cause of an unwanted behavior. The discipline is to follow evidence rather than guess, to eliminate possibilities rather than try fixes, and to know when you have actually found the cause versus a fix that happens to work.

## Why this matters

The default debugging instinct is: see the bug, try a thing, see if it's fixed. This is gambling, not engineering. When it works, the bug is fixed but the cause is unknown — the same class of bug will recur. When it doesn't work, you've changed working code while the bug persists, contaminating both the codebase and your understanding of the failure. The longer the bug resists, the harder it gets to tell which changes are part of the original bug and which are debugging artifacts.

Systematic debugging is slower per attempt and faster overall. It produces a fix you understand, a test that prevents regression, and a journal entry that helps the next person hit the same class of bug.

## The debugging loop

Every bug investigation runs the same loop. Skipping steps is what produces "fixes" that don't actually fix.

```
[1] Reproduce reliably     — can you make it happen on demand?
[2] Localize               — narrow which code/component is responsible
[3] Hypothesize            — what could cause this, given the evidence?
[4] Test the hypothesis    — confirm or eliminate
[5] Identify the cause     — the smallest change to the world that explains the bug
[6] Fix the cause          — surgically, with a test that captures the bug
[7] Verify the fix         — bug gone, no regressions, related cases checked
[8] Record the lesson      — to project memory, so the class of bug is faster to find next time
```

Each step has a job and a stopping condition. Don't promote a hypothesis to a cause without confirming. Don't promote a fix-that-works to a fix-of-the-cause without understanding why it works.

## Step 1: Reproduce reliably

A bug you can't reproduce is a bug you can't fix; you can only swing in its general direction. Before any other work, get a procedure that produces the bug on demand.

- **Capture the exact steps.** Inputs, environment, sequence, timing. "It crashes when I click save" is not enough; "it crashes when I click save with an empty title field on a new record" might be.
- **Capture the exact symptom.** Stack trace, error message, log lines, observed output. Not the user's interpretation of the symptom — the literal output.
- **Reproduce on a clean state.** Bugs that "only happen sometimes" are usually about state. Reset to a clean state and reproduce; if you can't, the bug depends on state you haven't captured yet.

If reproduction is intermittent, it is itself a clue: timing, race conditions, ordering, external state. Treat reproduction as the first sub-investigation.

If you genuinely cannot reproduce — production-only bug, environment you don't have — say so explicitly and gather logs/traces instead. Do not pretend you can debug what you can't observe.

## Step 2: Localize

Narrow the search space. The bug is somewhere; figure out where it isn't.

- **Read the stack trace top to bottom.** The first frame *in your code* (above the framework's frames) is where to start. Don't skip to a frame that "looks suspicious" — work from evidence.
- **Bisect in code.** If the bug appeared after a change, `git bisect` to find the commit. This is the cheapest localization tool when it applies.
- **Bisect by feature/state.** What's the smallest input that reproduces? Strip parts of the input until the bug stops; the part you removed is involved.
- **Add observability, don't change behavior.** Logs, prints, breakpoints to gather information. Don't "try a fix" while localizing — that's mixing investigation and resolution.
- **Confirm assumptions about state.** Print the value, don't infer it. AI-typical bugs cluster around assumptions about state being right when it's not.

When you exit Step 2 you should be able to say "the bug is in module X, at the boundary between Y and Z" — narrower than "somewhere in the app."

## Step 3: Hypothesize

A hypothesis is a candidate explanation that is testable. "It's broken" is not a hypothesis; "the function returns null when the input list is empty because the loop body sets the variable but doesn't run on empty input" is.

Generate multiple hypotheses before testing any. The first thing that comes to mind is a candidate, not the answer.

For AI-debugged code specifically, weight these classes of hypothesis early:

- **Boundary error.** Empty, null, zero, single-element, max, off-by-one.
- **Race condition.** Two concurrent paths touching shared state.
- **Wrong library / hallucinated API.** Method exists but on a different type, or signature differs.
- **Implicit assumption violated.** Project convention not matched; framework expects something the code doesn't provide.
- **Stale state / cache / memoization.** Old value persists past when it should.
- **Time/timezone.** DST, midnight, leap year, timezone-naive datetime.
- **Encoding.** Unicode, byte vs. character length, locale-sensitive comparison.
- **Error swallowed upstream.** The real failure happened earlier and was caught silently; the visible symptom is a downstream consequence.

Cast a wide net before narrowing.

## Step 4: Test the hypothesis

Each hypothesis is testable in two ways: by prediction or by elimination.

**By prediction.** "If hypothesis H is right, X should happen." Set up the conditions, observe whether X happens. Confirms or eliminates.

**By elimination.** Construct a case where H *cannot* be the cause; if the bug still occurs, H is eliminated. Useful when many hypotheses compete.

The trap to avoid: trying to "fix" the hypothesis instead of testing it. A "fix" that makes the bug go away does not confirm the cause — it might mask it, or fix something incidental. Test before fixing.

When a test confirms a hypothesis, *also* test that no other hypothesis explains the same evidence. Bugs sometimes have surface-correct explanations that turn out to be wrong on closer inspection.

## Step 5: Identify the cause

The cause is the smallest change to the system that fully explains the observed behavior. Two common failure modes:

- **Surface cause vs. root cause.** "The variable was null" is a surface cause; "the variable was null because the upstream API returned a 503 and the error path silently skipped initialization" is the root cause. Stop only when the next "why" gives you no actionable answer.
- **A cause vs. *the* cause.** Multiple things may contribute. The cause is the *necessary* contributor — the one that, if removed, fixes the bug. Confirm by hypothetical removal.

When you can describe the cause in one paragraph, with the chain of events from input to symptom, you have it. If you can't, you have a candidate, not a cause.

## Step 6: Fix the cause

Now — and only now — write the fix. Two rules:

- **Write the failing test first.** Capture the bug as a test. Watch it fail with the bug present. This proves the test exercises the bug, and prevents regression. (See `testing-discipline`.)
- **Make the fix surgical.** Address the cause; don't refactor along the way. Drive-by improvements during a bug fix obscure both the bug and the improvement. (See `surgical-edits`.)

If the fix is large, the diagnosis is probably wrong, or the bug surfaced a deeper issue that should be its own change. A small cause and a large fix is a smell.

## Step 7: Verify the fix

Run the new test (it now passes). Run the existing tests (still pass). Run the original reproduction (bug gone). Then look for related cases:

- **Same cause, different surface.** If the cause was a missing null check, are there sibling code paths with the same hole?
- **Same surface, different cause.** Did anything else used to look like this bug? Re-test those scenarios; some may have been the same bug under-reported.
- **Boundary sweep.** Walk the boundary checklist (empty, null, zero, max, concurrency) on the affected code; the bug class may have neighbors.

(See `verify-rigorously` for the full ladder.)

## Step 8: Record the lesson

The bug had a class. The class will recur — in this codebase or elsewhere. Record:

- A journal entry: what the bug was, what the cause was, how it was found, what the fix was. (See `project-memory`.)
- If the cause exposed a missing convention, add it to `conventions.md` with provenance.
- If the diagnosis required a non-obvious procedure (a specific log query, a way to reproduce a flaky test), add it to `playbooks.md`.

This is what makes the second instance of the same class of bug 5x faster to find.

## Decision rules

- **If you don't have a reproduction, get one before doing anything else.** Without reproduction, you are guessing.
- **If the fix is "I changed it and it works," you don't have a cause.** Keep going.
- **If you have spent more than ~30 minutes on a single hypothesis without confirming or eliminating, pause and generate fresh hypotheses.** Hypothesis lock-in is the most common debugging trap.
- **If the bug "just went away" without you understanding why, treat it as still-open.** Either find the cause or accept that it'll recur.
- **If you're tempted to rewrite the whole function "to be safe," stop.** A rewrite without understanding the cause introduces new bugs and hides the old one.
- **If the user is watching, narrate the loop.** Reproduce → localize → hypothesize. The narration is itself debugging — it forces you to articulate evidence, which catches sloppy reasoning.

## A worked example

> **Symptom:** Tests pass locally; CI fails on `OrderTotalTest.calculatesShippingCorrectly` ~30% of runs.

**Reproduce.** Locally always passes; CI sometimes fails. Reproduction is intermittent — clue: state or timing.

**Localize.** Run the test in a loop locally with `--repeat 100`. Two failures out of 100. The failures show shipping cost off by one cent.

**Hypothesize.**
- (a) Floating-point arithmetic in shipping calculation, edges showing up under specific input.
- (b) Test data has timing dependency (e.g., now() in the calculation rounds differently across DST).
- (c) Order of decimal operations in BigDecimal differs from float math under JIT timing.
- (d) Random fixture data sometimes hits a price that exposes a pre-existing rounding bug.

**Test.** Print the failing input. The price is `19.995`. Hypothesis (d) is the candidate — fixed for `19.99` and `20.00`, fails for `19.995`. Test other prices ending in `.005`: most fail.

**Cause.** Shipping calculation uses `Math.round(price * shippingRate * 100) / 100.0` — banker's rounding via float arithmetic. `19.995 * 0.1 * 100` is `199.94999...` due to float representation, which `round` truncates to `199`, not `200`. The fixture *occasionally* generates prices ending in `.005`, hence the flake.

**Fix.** Replace float arithmetic with `BigDecimal.setScale(2, RoundingMode.HALF_UP)`. Test asserts shipping for `19.995` is `2.00`, not `1.99`.

**Verify.** New test passes, old tests pass, 1000-run loop is clean.

**Lesson.** Add to `conventions.md`: monetary calculations always use `BigDecimal`, never `double`. Add to `journal.md`: the flaky shipping test was a `BigDecimal`-vs-`double` rounding bug, not test-environment flakiness.

This investigation took an hour. A "let me try a fix" approach typically takes a day, ships a wrong fix, and recurs.

## Anti-patterns

- **Random fix attempts.** Changing things hoping the symptom moves. Each attempt contaminates the codebase and your mental model.
- **Symptom-fixing.** Suppressing the visible failure (catching the exception, adding `?? 0`) without understanding why the failure happened.
- **Premature rewrite.** "Let me just rewrite this method" — usually because the current code feels confusing. The bug is in the method's logic, not its style.
- **Not reading the error message.** The first sentence of the error is often the answer.
- **Ignoring the stack trace.** The trace tells you where; reading "deeper" without it wastes time.
- **Stopping at the first plausible explanation.** Confirm the explanation accounts for *all* the evidence, not just the headline symptom.
- **Reproducing once and assuming reproducible.** Run the reproduction multiple times before concluding it's reliable.
- **Confusing "I don't see the bug now" with "the bug is fixed."** The bug may be hiding, especially if you can't articulate what changed.
- **Skipping the regression test.** Without it, the bug returns the next time someone touches that code.
- **No journal entry.** The lesson is lost; the next person re-pays the diagnosis cost.

## See also

- **research-first** — the same context-gathering discipline applied at the start of a code task; here applied to a bug.
- **testing-discipline** — write the test first; capture the bug.
- **verify-rigorously** — confirm the fix; sweep for related cases.
- **critical-self-review** — the AI bug taxonomy informs which hypotheses to weight early.
- **project-memory** — where the lessons go so the next session starts smarter.
