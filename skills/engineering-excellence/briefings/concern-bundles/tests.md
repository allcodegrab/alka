# Tests concern bundle

Inline checklist for the **tests verifier** subagent. Paste into the briefing's "Concern checklist" section.

## Lens

You are not running the tests yourself; you are reviewing whether the test changes / new tests in this diff are actually testing the right things in the right way. Bad tests are worse than missing tests — they create false confidence.

## Coverage of the new behavior

- Every new function / method / class has at least one test exercising its happy path?
- Every new branch / conditional has a test exercising both sides?
- The change includes new behavior — is there a test that would have FAILED before the change and PASSES after? (If not, the test isn't testing the change.)
- Was a test removed or modified? If yes, what behavior coverage is lost?

## Boundary conditions (rung 7 of verify-rigorously)

For any code that handles input, walk the boundary list and check tests:

- **Empty:** empty string, empty list, empty map, empty file, no rows. Tested?
- **Null / missing:** null, undefined, optional fields absent, missing config. Tested?
- **Zero, negative, max:** off-by-one, integer overflow, MAX_VALUE. Tested?
- **Single-element:** code that assumes "more than one" often breaks at n=1. Tested?
- **Duplicates:** repeated entries, duplicate keys. Tested?
- **Unicode / encoding:** non-ASCII, RTL, emoji, zero-width. Tested if relevant?
- **Time:** timezone, DST, midnight, year boundary. Tested if relevant?
- **Concurrency:** retry while in-flight, two requests at once. Tested if relevant?
- **Trust boundary:** untrusted input handling. Tested?

Not every boundary applies to every change. Note which were considered and either tested or explicitly excluded with reason.

## Test quality

- Is the test exercising the actual behavior, or is it self-confirming? A test written by reading the implementation and asserting the implementation's output is not a test — it pins the bugs.
- Mocking: is the test mocking only external boundaries (DB, HTTP, filesystem) and not mocking the unit under test itself?
- Assertions: each test has at least one meaningful assertion? Tests that "pass if no exception thrown" are weak.
- Determinism: does the test rely on `Date.now()`, random, network, or system time? Will it be flaky?

## Test independence and ordering

- Do the new tests share state with other tests? Run them in random order — do they still pass?
- Do they leave artifacts (temp files, DB rows, env vars) behind? Cleanup in `afterEach`/`tearDown`/`@AfterEach`?
- Do they assume a specific DB seed state or test-suite order?

## Negative tests

- For every input that should be rejected (validation errors, auth failures, malformed payloads), is there a test that asserts rejection happens with the right error type / status code?
- For error paths in the implementation, is there a test that triggers each one?

## Integration vs unit balance

- Is the new behavior at the right level? Logic-only changes covered by unit tests; behavior across module boundaries covered by integration tests; user-visible flows by E2E tests where applicable.
- Don't over-test at the wrong level: a unit test for "the controller calls the service with these args" is weak compared to an integration test that exercises the actual flow.

## Speed and flakiness

- Will the new tests slow the suite unreasonably? Network calls, sleep, polling without timeout?
- Is any test marked skip / x.it / pending? If yes, is there a tracked reason?
- Any retries in the test framework configured to mask flakiness?

## Removed or weakened tests

- If any test was deleted: was the behavior it verified moved to another test, or is coverage lost?
- If an assertion was relaxed (`.toBe(5)` → `.toBeGreaterThan(0)`): is the relaxation justified, or hiding a regression?
- If a `skip`/`xit` was added: why?

## Common quick-checks

- New test files: do they import the project's test framework conventionally?
- Test setup: matches the project's existing fixture / factory pattern?
- New tests use the same assertion style as existing tests?
- Test names describe behavior, not implementation? `should_return_404_when_user_not_found` not `test_handle_user_not_found_function`.

## Severity calibration for tests

- **Critical:** A core new behavior has zero tests. A removed test eliminated coverage of a security/data-integrity behavior. A test was modified to pass a known-broken implementation.
- **High:** Significant new code paths uncovered. Boundary conditions explicitly identified in `verify-rigorously` rung 7 not tested where they clearly apply (concurrency, trust boundary, error path).
- **Medium:** Happy path tested but unhappy paths not; tests are self-confirming; flaky tests added without quarantine.
- **Low:** Style nits in test names, missing one of the lower-priority boundaries (locale where it doesn't apply), tests slightly slow.

If you cannot determine whether the tests would have caught a regression in the changed behavior, that's at least High.
