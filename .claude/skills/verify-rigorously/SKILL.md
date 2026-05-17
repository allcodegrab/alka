---
name: verify-rigorously
description: After every meaningful code change, climb the verification ladder before declaring done — types, lints, tests, the actual scenario, then boundary cases. Use this skill at the end of every slice, every fix, every refactor, no exceptions. Trigger it explicitly when you are tempted to say "this should work" without running anything; "should work" is exactly the state this skill exists to interrupt. This skill applies even when the change "looks obvious" — the obvious-looking changes are where verification gets skipped and where the most expensive bugs ship.
---

# Verify Rigorously

A change is not done when it compiles. It is not done when the type-checker passes. It is not done when the test you wrote for it passes. It is done when you have actually run the scenario the user cares about and watched it work, including the unhappy paths.

## Why this matters

The most consistent failure mode of AI-generated code is plausibility without verification. The diff looks right, the types check, the function returns something sensible, and the assistant declares victory. Then production exposes the assumption — the empty list case, the timezone, the unicode name, the second concurrent request — that nobody verified because nobody ran it.

The fix is mechanical. Climb the ladder. Each rung catches a different class of bug, and skipping rungs is what lets entire bug classes through.

## The verification ladder

Run from bottom to top. Do not declare done until you have honestly cleared every rung that applies.

**1. Compiles / parses.** No syntax errors, no missing imports, no broken references. The cheapest check; runs on save in any modern editor.

**2. Types pass.** If the language has a type-checker (mypy, tsc, the compiler itself), run it. Don't trust that "it should." Type errors hidden by `any`, `Object`, or `// @ts-ignore` count as failures.

**3. Linter / formatter passes.** Whatever the project uses. Don't suppress warnings with comments; fix them or surface them.

**4. The new test passes.** Write the test (see testing-discipline) and run it. Watch it fail before the code change, then watch it pass after. A test that has never been observed to fail is not yet trustworthy.

**5. Existing tests still pass.** Run at least the tests in the affected modules. Run the full suite if it's reasonably fast. If you cannot run the full suite locally, say so explicitly.

**6. The actual scenario runs end-to-end.** Boot the service, exercise the endpoint, click the button. The thing the user described should work, observed by you, in a way you could screenshot or log. This rung is the one most often skipped, and it is the rung that catches "tests pass, app crashes."

**7. Unhappy paths traced or run.** What happens on empty input? Null? Zero? Negative? Maximum? Unicode? Concurrent calls? Network failure? Disk full? Auth missing? Each of these is a question to answer — sometimes by running, sometimes by reading the code and reasoning, but always by *answering*, not assuming.

**8. The diff re-read with fresh eyes.** Yours. Pretending you didn't write it. (See critical-self-review for the deeper version of this.)

If you cannot run a rung — because the environment is locked down, the test framework isn't accessible, the staging env is unavailable — say which rungs you skipped and why. Do not silently skip and declare done.

## The boundary-condition checklist

Rung 7 is where most missed bugs live. AI-typical mistakes cluster heavily here. Run through this list explicitly for any code that handles inputs:

- **Empty.** Empty string, empty list, empty map, empty file, no rows.
- **Null / missing.** `null`, `None`, `undefined`, optional fields absent, missing config keys.
- **Zero, negative, max.** `0`, negative numbers, off-by-one at boundaries, `Integer.MAX_VALUE`, overflow.
- **Single-element.** Many bugs are in code that assumes "more than one."
- **Duplicates.** Repeated entries, duplicate keys, repeated calls with same input.
- **Order.** Out-of-order events, reversed sort, unstable sort hiding a comparator bug.
- **Encoding.** Non-ASCII, RTL text, emoji (which can be multiple code points), zero-width characters.
- **Time.** Timezones, daylight savings, leap seconds, leap years, midnight, year boundaries, future dates.
- **Locale.** Different decimal/thousands separators, different date formats, non-Latin numerals.
- **Concurrency.** Two requests at once, retry while in-flight, partial-failure mid-operation.
- **Trust boundary.** Untrusted input — user form, API request, file upload, env var, deserialized payload.
- **Resource limits.** Large input, slow input, exhausted connection pool, full disk, OOM.
- **Idempotency.** Calling the operation twice with the same input. Calling it twice with the same idempotency key.

Not every list applies to every change. The discipline is to walk the list and say "applies / doesn't apply / handled / not handled" for each, not to skip the walk.

## Decision rules

- **If you have not actually run the change, you have not verified it.** "It looks correct" and "the types pass" are necessary and not sufficient.
- **If a test passed on first run without you watching it fail beforehand, run it once with the change reverted.** A test that always passes is not testing your change.
- **If the unhappy path "shouldn't happen", verify it shouldn't happen rather than asserting it.** The history of incidents is mostly things that "shouldn't have happened."
- **If you cannot run a rung, say so.** Honesty about coverage is more valuable than a false declaration of done.
- **If a rung fails after the others pass, restart the ladder from the bottom after fixing.** Fixes can break earlier rungs.

## What "ran the scenario" means

For a backend feature: actually call the endpoint (curl, the test client, Postman) and inspect the response. Watch the logs.

For a frontend feature: actually load the page, click the thing, see the result.

For a CLI: actually run the command and read the output.

For a library: write or run a small driver program that exercises the new API.

For a refactor with no behavior change: run the existing tests and a representative real-world scenario; the refactor is verified by *behavior preservation*, which means you need a behavior to observe.

For a bug fix: reproduce the bug first; then fix; then watch the bug be gone. If you cannot reproduce, you cannot verify the fix.

## When verification reveals a problem

Treat the failed rung as new information about the plan, not just an obstacle to fix. Sometimes the failure means a small bug; sometimes it means the plan was wrong. Symptoms of "plan was wrong":

- The fix for the test failure is much larger than expected.
- Each fix surfaces another failure.
- You're adding special cases to make the test pass.

When this happens, return to plan-then-execute. Force-fitting a plan past test failures is how you ship subtle bugs.

## Parallel-by-concern verification

The verification ladder above is a single sequential pass. For non-trivial changes — anything touching security, performance, reliability, or accessibility-sensitive surfaces — that single pass is doing too many jobs at once. The result is shallow coverage on each concern, and concerns trade off against each other in your head ("if I dig hard on security I'll run out of attention for perf").

Adapted from Shannon's pentest architecture (96.15% on the source-aware XBOW benchmark), the fix is to parallelize verification by concern. Each concern gets its own subagent with narrow scope and deep focus. Findings aggregate at synthesis. This is the verification analogue of "specialists, not generalists" for any change above the trivial-fix threshold.

### When to parallelize

Trigger parallel-by-concern verification when **any** of these holds:

- Change touches **3 or more files** AND any sensitive surface (auth, payments, persistence, network IO, customer-rendering).
- Change is a **refactor** that crosses module boundaries.
- Change is a **migration** (schema, data, infra, dep major-version).
- Change is in **production-critical** code where a missed regression has user-visible cost.
- The user explicitly requests independent review.

For trivial changes (single-file, low-stakes), the single sequential ladder is enough. Don't fan out as performance theater.

### The standard concern split

Spawn one subagent per applicable concern. Not all apply to every change; use judgment. Default split:

- **Security.** OWASP top-10 lens applied to the diff: injection vectors, secret handling, authn/authz boundaries, deserialization, CSRF/XSS, dependency vulns introduced by the change. Specific to your stack: Spring Security configuration, MongoDB injection via aggregation operators, Angular template injection.
- **Performance.** N+1 queries introduced, blocking IO on hot paths, allocation patterns, query plan changes (`EXPLAIN`), cache invalidation correctness, concurrency model implications. Boundary: large-input behavior.
- **Reliability.** Error handling completeness, retry/timeout configuration, idempotency, circuit-breaker behavior under partial failure, observability (do failures surface in logs/metrics with enough context to debug?).
- **Tests.** Coverage of new logic and unhappy paths; test quality (does the test actually exercise the change, or could it pass with the change reverted?); regression risk on existing behavior; test speed and flakiness.
- **Data integrity.** Only when migrations or data model changes are involved: backfill correctness, rollback feasibility, online-schema-change compatibility, data-loss windows.
- **Accessibility.** Only for UI changes: keyboard navigation, screen-reader semantics, color-contrast, focus management.
- **Backward compatibility.** Only for public API or wire-format changes: existing clients still work, deprecation path is sound, version handling is explicit.

### How to brief each verification subagent

Subagents do not inherit skills (see `engineering-excellence` §Multi-agent coordination). Every verifier needs an explicit briefing — but you don't reconstruct it each time. **Use the prepared artifacts:**

1. Copy the template from **`engineering-excellence/briefings/worker-template.md`**.
2. Fill in the bracketed fields (worker name, mission slug, diff scope).
3. Paste the matching concern bundle — **`engineering-excellence/briefings/concern-bundles/<concern>.md`** — into the "Concern checklist" section. Bundles exist for security, performance, reliability, and tests; for less-common concerns (data-integrity, accessibility, backward-compat) extract the relevant section from `production-readiness` inline.
4. Send the filled-in briefing to the subagent via `Agent`.

The template enforces the format (severity calibration, finding structure, "no finding, no report" rule, status reporting). Skipping the prepared bundles is the most common failure mode of multi-agent verification — bundles exist so this never happens.

### Adaptive worker count

Start with **2 workers** for the highest-risk concerns (typically security + reliability for backend, security + tests for sensitive frontends). Escalate to 4 only if the first two return findings — that's evidence the diff has issues across concerns and the others are likely populated too.

The fixed-4-workers default in v4 was over-engineered for cost. The fix is adaptive: small initial fan-out, escalate on evidence, hard cap at 6.

### Synthesis and decision

Once all concern-verifiers complete:

1. Read each `<concern>_findings.md`.
2. Apply the **aggregate, don't average** rule: one Critical from one verifier outranks zero findings from three others.
3. Write a synthesis to `<mission>/whiteboard.md`: total count by severity, the load-bearing findings, what each verifier confirmed clean.
4. **Do not declare done while any High or Critical finding is open.** Resume the relevant verifier with the fix to confirm, or escalate to the user if the fix is non-obvious.

### Example invocation pattern

For a Spring Boot endpoint change touching auth and persistence:

```
[Coordinator]
  Mission: 2026-05-05-payments-endpoint-verification
  Workers (spawned in parallel):
    - security-verifier   → audits/security_findings.md
    - performance-verifier → audits/performance_findings.md
    - reliability-verifier → audits/reliability_findings.md
    - test-verifier       → audits/tests_findings.md
  Wait for completion notifications.
  Synthesize → whiteboard.md.
  Resolve High/Critical findings before declaring done.
```

### When NOT to parallelize verification

- Single-file change in non-sensitive surface — the ladder above is fine.
- The change is so small that briefing four subagents costs more than the parallelism saves.
- The user wants a quick conversational confirmation, not a structured artifact.
- Only one concern actually applies — fan-out of one is just sequential with extra steps.

## Anti-patterns

- **"Tests pass, shipping it."** Without rung 6 (the actual scenario), tests passing is consistent with the application being broken in ways the tests don't cover. Run the thing.
- **Self-confirming tests.** Writing the test by reading the implementation, so the test exercises exactly the behavior the implementation produces, including the bugs.
- **Mocking the thing under test.** A test that mocks the function it claims to be testing is not a test.
- **"It worked on my machine."** Useful as a starting point, never as a final answer for a shared codebase. Verify in the closest-to-shared environment available.
- **Claiming verification you didn't perform.** Saying "I ran the tests" when you didn't is the single fastest way to lose user trust permanently. If the tests didn't run, say so.
- **Skipping rung 7 because "the tests cover it".** They probably don't. Walk the boundary checklist anyway.
- **Treating the type-checker as the test suite.** Types catch a category of bug; they do not catch logic, semantics, or runtime issues.

## When the loop is partially blocked

You will sometimes find yourself unable to fully verify — sandbox without network, missing test data, third-party service the test environment can't reach. When this happens:

- Verify everything you can.
- Reason explicitly about what you couldn't verify and what could plausibly go wrong.
- Tell the user *exactly* what was and wasn't verified, in those words.

A change shipped with "I couldn't verify the SES email actually goes through; I confirmed the call to the SES SDK is correct and matches the project's existing usage" is honest and useful. The same change shipped as "all tests pass" when those tests didn't include the SES path is dishonest, even if accidentally.

## See also

- **testing-discipline** — what tests to write so they're worth running here.
- **critical-self-review** — the deeper second pass, after the ladder.
- **production-readiness** — the cross-cutting concerns the boundary checklist intersects with.
- **engineering-excellence** — places this skill at the right point in the loop.
