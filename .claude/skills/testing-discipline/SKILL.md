---
name: testing-discipline
description: Decide what to test, what kind of test to write, and how much coverage is enough — without chasing coverage as a goal or testing the mock. Use this skill whenever you write, modify, or evaluate tests, and whenever you're deciding whether a piece of code needs tests at all. Trigger this every time you fix a bug (regression test goes first), every time you add behavior (test the behavior, not the implementation), and any time you find yourself writing a test that "checks the function got called". This skill exists because tests that exist but don't catch bugs are worse than no tests — they create false confidence — and writing useful tests is a separate skill from writing code.
---

# Testing Discipline

Tests exist to give you confidence that the system behaves as intended, today and after future changes. Tests that don't earn that confidence are noise. The discipline is knowing the difference.

## Why this matters

Coverage as a goal produces tests that exercise lines without checking behavior, mocks that mirror the implementation under test, and integration tests that pass even when the integration is broken. Coverage as a *byproduct* of testing the right things produces a safety net.

The other half of the discipline is restraint. Not every line of code needs a test. Trivial getters, framework code, third-party libraries, and obvious wrappers usually do not benefit from tests; tests for them add maintenance cost without catching bugs. Knowing what *not* to test is as much a skill as knowing what to test.

## What to test

Test the things whose breakage would matter and whose correctness is not obvious from reading the code.

**Behavior, not implementation.** A good test describes what the code does from the outside: "given these inputs, the function returns this output / produces this side-effect." A bad test asserts which internal helpers were called. The first survives refactoring; the second breaks every time someone changes the internals, even when behavior is preserved.

**Public contracts.** The functions, classes, endpoints, or messages that other code relies on. These are where breakage propagates. Internal helpers can be tested through the public surface.

**Boundary conditions.** This is where most missed bugs live, especially in AI-generated code. Walk the boundary checklist from verify-rigorously: empty, null, zero, negative, max, single-element, duplicates, encoding, time, locale, concurrency. Test the ones that apply.

**Each branch.** If there's an `if/else`, test at least one input that takes the `if` and one that takes the `else`. Do this by behavior, not by counting branches.

**The bug you're fixing.** When you fix a bug, write a test that fails on the bug *first*. Then fix the bug, and watch the test pass. This serves two purposes: it proves the bug is real, and it prevents the bug from coming back as a regression.

**Integration points.** Where your code talks to a database, an HTTP service, a queue, or a file system. Unit tests with mocks here are useful but not sufficient — you also want at least one test that exercises the real boundary in a representative way (testcontainers, an in-memory implementation, or a contract test against a recorded fixture).

**Concurrency where it matters.** If your code can be entered from two threads or two requests at once, write a test for that — even an imperfect one is much better than nothing.

## What not to test

**Trivial getters and setters.** If `getName()` returns `name`, the test is restating the code.

**Pure delegation.** If your function's body is `return otherThing.doIt(arg)`, a test that asserts "doIt was called with arg" is testing the language. Trust the language.

**Framework code.** Don't test that Spring injects beans correctly. Don't test that React's `useState` updates state. Test what *your* code does on top of the framework.

**Third-party libraries.** Assume they work. The exception: if you depend on specific, fragile behavior of a library, write a *contract test* that documents the assumption and breaks if the library version changes the behavior.

**Implementation details that should be free to change.** Private helpers, internal state, exact log strings, exact error messages (unless those *are* the contract). Tests on these break every refactor and protect nothing real.

## How much to test

There is no universal coverage number. Calibrate against three axes:

- **Stakes.** Payment code, security code, data deletion: extensive testing, including malicious inputs. Internal admin tooling: less. A throwaway script: maybe none.
- **Cost of failure.** A bug in a financial calculation costs more than a bug in a UI animation. Test in proportion.
- **Cost of change.** Code that changes weekly benefits more from regression tests than code that hasn't been touched in two years.

A useful target is "every reasonable failure mode is observable in tests" — not "every line is covered." Coverage tools are diagnostic; an uncovered line is a question ("why is this not tested?"), not necessarily a defect.

## Choosing the kind of test

**Unit tests.** Fast, focused, no external dependencies. Use for pure logic, branching, and small components. Most tests should be unit tests because they run in milliseconds and you'll run them constantly.

**Integration tests.** Cover the seams between modules — your code plus the database, plus the queue, plus the HTTP client. Slower but catch bugs unit tests cannot. Use sparingly but deliberately.

**Contract tests.** Verify that a service produces or consumes the message format another service expects. Catch breaking changes at the boundary instead of in production.

**End-to-end tests.** Cover full user flows. Slow, flaky-prone, expensive to maintain. Use a small number for the highest-value flows; do not let them be your primary test type.

**Property-based tests.** Generate many inputs and assert invariants. Excellent for parsers, serializers, math, and anything with input-output symmetry. Underused.

**Snapshot tests.** Capture the output of a function and assert future runs produce the same. Useful for templated output (rendered HTML, generated code, complex JSON) where the canonical form is large. Dangerous when used to test logic — they pass after every change as long as you re-snapshot, which trains people to re-snapshot reflexively.

## The good-test checklist

Before committing a test, run it past these questions:

- **Does it fail when the behavior breaks?** Comment out the implementation; does the test go red? If not, the test isn't testing the implementation.
- **Does it pass for the right reason?** Read the assertion. Does it actually require correct behavior, or is it asserting something incidental?
- **Will it survive a refactor?** If you renamed a private helper, would this test break?
- **Is the failure message informative?** When this test fails three months from now, will the message tell the next person what's wrong?
- **Is the test itself simple?** Tests should be readable in seconds. A test with branching logic is a test that needs its own tests.
- **Does the name describe the scenario?** `test_user_creation_with_duplicate_email_returns_409` is better than `test_create_user_2`.

## Anti-patterns

- **Testing the mock.** `mock.expect("save").called(); service.save(); mock.verify();`. The mock is being tested, not the service.
- **Tautological tests.** `assertEquals(2 + 2, computeSum(2, 2))` where `computeSum` is `a + b`. Restates the implementation.
- **Tests that depend on test order.** Independent tests should be runnable in any order. Shared mutable state across tests is a bug in the test suite.
- **Tests that are slow because they sleep.** `Thread.sleep(5000)` is a confession that the test doesn't know what it's waiting for. Wait on the actual condition.
- **Snapshot tests as logic tests.** Re-snapshotting on every change defeats the point.
- **Coverage chasing.** Writing tests to hit lines instead of behavior. Visible in suites that have 90% coverage and still ship bugs in production weekly.
- **Big-bang setup.** Tests that require 200 lines of fixture to run one assertion. Either the fixture should be shared infrastructure, or the test is testing too many things at once.
- **No test for the bug.** Fixing a bug without a regression test is fixing it temporarily.

## Practical patterns

**Arrange-Act-Assert (or Given-When-Then).** Three sections: set up the world, do the thing, check the result. Visible separation makes the test scannable.

**One assertion per logical thing.** Multiple `assert`s per test are fine if they all assert facets of one outcome. Chain assertions about unrelated outcomes split into separate tests so each failure is its own diagnosis.

**Fixtures by purpose, not by entity.** A fixture named `user_with_no_email` is more useful than a fixture named `user_2` because the test name then explains *why* the fixture exists.

**Tests live next to code or in a parallel structure.** Pick the project's convention and follow it. Don't invent a new place to put tests.

## A worked example: testing a CSV exporter

Function: `export_users_csv(users) -> str`.

**Bad test set.**
- One test: `assert export([user1, user2]) == "id,name\n1,Alice\n2,Bob\n"`.

This passes for one happy case. It does not catch: empty user list, users with commas in their name, users with newlines in their name, users with non-ASCII names, very large user lists, users missing fields. Each of those is a bug waiting.

**Good test set.**
- Empty list returns just the header (or whatever is specified).
- One user produces one row.
- A name containing a comma is correctly quoted/escaped.
- A name containing a newline is correctly handled per the CSV dialect.
- A non-ASCII name (Δημήτρης, 日本語) is preserved.
- A null/missing optional field becomes an empty cell, not the string "null".
- A regression test for whatever the bug-of-the-day was.

Six small focused tests catch six classes of bug. Each test reads in seconds. None of them tests the implementation.

## See also

- **verify-rigorously** — when to actually run the tests, and the boundary checklist.
- **right-sized-engineering** — how much testing is enough.
- **critical-self-review** — confirms the tests aren't tautological.
- **engineering-excellence** — testing's place in the loop.
