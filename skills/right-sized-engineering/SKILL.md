---
name: right-sized-engineering
description: The taste filter applied to design and implementation decisions to prevent both over-engineering and under-engineering. Use this whenever you are choosing an abstraction, adding a layer, picking between a simple and a clever solution, deciding whether to generalize, or evaluating a design proposal. Trigger this every time the words "flexible", "extensible", "reusable", "future-proof", "scalable", or "configurable" appear in the plan or in your own reasoning, and equally whenever you are tempted to "just hack it in for now". This skill exists because the two most common failure modes — premature abstraction and corner-cutting — are mirror images, and an engineer who only resists one of them produces bad code in the other direction.
---

# Right-Sized Engineering

Match the complexity of the solution to the complexity of the problem. Not less. Not more. The hard part is that "more" feels like quality and "less" feels like sloppiness, so both directions are tempting at exactly the wrong moments.

## Why this matters

Codebases die in two ways. They die from accumulated speculation — abstractions for use cases that never arrived, configurability that nobody configures, layers that just pass through. They also die from accumulated shortcuts — error paths that crash, edge cases that silently corrupt data, "we'll fix this later" comments that never get fixed.

Most engineers naturally pull in one direction or the other. The discipline is to recognize which way you are pulling on a given decision and correct against it. The goal is not minimalism. It is calibration.

## The two failure modes

**Over-engineering** is paying complexity costs now for benefits you might never receive. Symptoms:

- Abstractions with one implementation, one caller, or one configuration.
- Patterns named in code (`AbstractFactoryStrategy`) without a concrete reason for the indirection.
- Configuration knobs nobody has asked for; flags that have never been flipped.
- Layers that exist to make swapping the underlying technology easier — for technology that has never been swapped.
- Generic solutions to specific problems, with no second use case.
- Premature optimization without measurement.
- Type hierarchies that model what *might* be, not what *is*.
- "Frameworks" inside applications.

**Under-engineering** is paying correctness, security, or operability costs now for the appearance of speed. Symptoms:

- Catch-and-ignore error handling.
- No validation of untrusted input at boundaries.
- Magic numbers and copy-pasted blocks.
- Happy-path-only code with no consideration of what happens when the network, disk, or upstream call fails.
- No logging at the points where you'd actually want logs during an incident.
- Hardcoded values that should be config.
- TODOs and FIXMEs that ship to production.
- Tests that exercise types but not behavior.

The two lists are different in content and identical in cost: code that hurts to maintain and that fails in ways the next engineer can't predict.

## The decision rules

These are not laws. They are tiebreakers when "is this the right level of complexity?" is genuinely ambiguous.

**Rule of three for abstraction.** Don't extract an abstraction for a single use. Wait until there are three concrete uses, then extract from the commonalities. Two uses is the danger zone — the second use looks like a pattern but the third one will tell you the abstraction was the wrong shape. Refactoring at three is cheaper than refactoring a wrong abstraction.

**YAGNI ("you aren't gonna need it").** Build for the requirement on the table, not for the imagined future requirement. Write *good* code that's open to extension by refactoring; don't write speculative code that's "ready" for use cases that may never arrive. The cost of refactoring later is almost always less than the cost of carrying a wrong abstraction now.

**KISS, calibrated.** Prefer the boring, obvious solution unless you can name a specific, current reason the boring solution falls short. "It might not scale" without a measurement is not a reason. "We have 50M rows and the query is O(n²)" is.

**Match the stakes.** A throwaway script does not need the rigor of a payment processor, and the payment processor does not need the rigor of a flight control system, and the flight control system does need that rigor. Calibrate explicitly. If you don't know the stakes, ask.

**Local consistency over global aesthetic.** If the codebase already does X, your new code should do X — even if Y is what you'd choose on a green field. Consistency is a feature; it lowers the cost of every future change for every future engineer.

## Self-checks before adding complexity

Before adding any of these, answer the question. If the answer is unclear, do not add it.

- **A new abstraction.** What concrete current uses does it have? (Need: at least two; ideally three.)
- **A new configuration option.** Who needs to vary this value, and how often? Where does the variation come from?
- **A new layer / interface / wrapper.** What does this protect against that is real and current? "Future flexibility" is not an answer.
- **A new dependency.** What's already in the project that does this? Why is the new dep worth its maintenance, security, and supply-chain cost?
- **A new pattern.** Does the codebase already have a pattern for this kind of problem? If yes, why deviate?
- **A new optimization.** Have I measured? What's the baseline? What's the target? What does the simple version actually cost?

## Self-checks before cutting a corner

Equally important. Cutting corners is not pragmatism if it ships footguns.

- **Skipping error handling.** What happens at runtime when this fails? "It won't fail" is rarely true. If the answer is "the program crashes and the user sees nothing," that's not pragmatism, that's a bug.
- **Skipping validation.** Where does this input come from? If it crosses a trust boundary (network, user, file, env var), validate at the boundary.
- **Hardcoding a value.** Is this value going to change before the next release? Is there a credible reason it might need to vary by environment? If yes, hoist it.
- **Skipping a test.** Will this code's correctness be checked by anything? If no, you are testing in production.
- **Leaving a TODO.** Will this TODO be addressed before merge, or is it really "we'll never come back to this"? Be honest in the commit.

## A concrete example

You're asked to send users a confirmation email after signup.

**Over-engineered approach.** Build an `EmailService` interface with `SmtpEmailService`, `SesEmailService`, and `MockEmailService`; a `Notification` abstraction; a `Channel` enum (email, SMS, push); a template engine; a queue with retry policies; a feature flag for "use new email system". Three days. Hard to read. None of the other channels exist or are coming.

**Under-engineered approach.** Inline `smtplib.send()` in the signup handler with hardcoded "Welcome!" body. Ten minutes. Crashes the signup if SMTP is down. Logs the SMTP password. Hardcoded sender address. Untestable.

**Right-sized.** A single `send_signup_email(user)` function in the user module. It calls into whatever email facility the project already uses (check first; if there isn't one, use the project's HTTP client to call the transactional email provider). Errors are caught and logged but do not fail the signup. The body lives in a templates folder if there's already one; in a multi-line string if not. Maybe an hour, including the test. Easy to refactor into a generic `EmailService` later, when there's a second kind of email — and there will be enough information then to know what shape that abstraction should be.

The right answer is rarely fancy.

## Tradeoffs the user should weigh

Sometimes the right call is genuinely contested. When a decision has real downside in either direction — performance vs. simplicity, generality vs. clarity, fast-now vs. slow-later — surface it instead of choosing silently. Format:

> "I can do this two ways. (A) is simpler and works for the current case but would need a rewrite if we ever do X. (B) is more general but adds two layers and a dep. I lean A because we don't have a use case for X yet. Want me to go with A?"

Two sentences. The user can correct in one sentence. This is far cheaper than litigating it after the diff.

## Anti-patterns

- **Architecting for "scale" without traffic numbers.** "It might be slow" is not a measurement.
- **Adding interfaces with one implementation.** They are noise until proven otherwise.
- **DRY-ing two similar pieces of code that are coincidentally similar.** Two things that look alike but represent different concepts should stay separate; they will diverge later, and the abstraction will hurt.
- **Naming patterns in code (`StrategyImpl`, `Helper`, `Manager`).** Name what the thing does. The pattern, if any, is implementation detail.
- **Catch-all error handling.** `try { ... } catch (Exception e) { log.error("error"); }` is under-engineering pretending to be over-engineering. It loses information and continues with bad state.
- **"We'll come back to this."** You won't. Either fix it now or write down (in code or ticket) the explicit conditions under which it should be revisited.

## See also

- **plan-then-execute** — the plan is where most over-engineering enters; this skill filters it.
- **surgical-edits** — minimizing change-set size is itself an anti-over-engineering tool.
- **production-readiness** — the cross-cutting concerns are the things under-engineering specifically skips.
- **critical-self-review** — the second pass that catches the failures this skill tries to prevent.
