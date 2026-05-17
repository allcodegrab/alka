---
name: production-readiness
description: Apply the cross-cutting production concerns — error handling, logging, metrics, tracing, security, performance, reliability, data hygiene — to any code that will run in production. Use this skill for backend services, batch jobs, scheduled tasks, anything that holds user data, anything exposed to network, anything in the request path of a paying customer. Trigger this whenever the user mentions "production", "deploy", "ship", "live", or when the code clearly will run in production even if they didn't say so. Do not treat these concerns as someone else's job; the discipline is to make sure each one has been considered, not to do all of them in every change. Code that ships to production without going through this skill is shipping with known-unknown risk.
---

# Production Readiness

Code that runs in production has a different bar than code that runs once on your laptop. Production exposes assumptions: networks fail, disks fill, clocks drift, attackers probe, traffic spikes, deploys interleave with requests. Production-readiness is the discipline of considering each cross-cutting concern explicitly so they don't ambush you at 3 AM.

## Why this matters

Cross-cutting concerns get neglected because they aren't anyone's main job and they don't show up in the happy path. The change "added a feature" looks correct until production load reveals the unbounded loop, the missing auth check, the silent error swallow, the n+1 query, the secret in the logs.

The fix isn't to do everything for every change. It's to *check* every concern for every production change, and to address the ones that apply. Most won't apply. The ones that do are the ones that would have hurt.

## The concern checklist

Walk this for any production-bound change. Most items are seconds; the cost of skipping the walk is paid in incidents.

### Error handling

- **Catch what you can recover from; let the rest propagate.** A blanket `try/catch` that swallows everything is hiding bugs you'll meet later.
- **Fail fast for programmer errors; recover for environmental errors.** A null where one is impossible: crash, fix the bug. A timeout calling an upstream: retry or surface.
- **Don't return "default" values on error.** Returning `0` or `""` or empty list when the operation actually failed propagates corrupt state into code that thinks it succeeded.
- **Wrap errors with context as they propagate.** `wrap("failed to load user $id", err)` is far more debuggable than `err`.
- **Distinguish retryable from non-retryable errors.** A 500 may be retryable; a 400 isn't. Encoding this in the error type prevents callers from retrying validation failures forever.
- **Never log and rethrow at every layer.** That produces a stack of identical log lines. Log once, at the layer that decides what to do about the error.

### Logging

- **Structured, not freeform.** Key-value or JSON. `log.info("user_signup", user_id=u.id, email_domain=domain)` beats `log.info(f"user {u.id} signed up with {u.email}")` for searchability and for not leaking PII.
- **Correlation IDs everywhere.** Every request, every job, every async chain. Without correlation IDs, distributed debugging is nearly impossible.
- **Log levels deliberately.** ERROR is "human attention required." WARN is "abnormal but handled." INFO is "things you'd want during an incident." DEBUG is "things you'd want during local development." Don't promote everything to ERROR.
- **No secrets, no full PII.** Email domain, user ID, request ID — yes. Full email, password, token, SSN — no. Have a shared sense of what's loggable.
- **No logs in hot loops.** A log statement inside a million-iteration loop will fill disk, blow out log ingestion, and slow the loop. Sample or aggregate.
- **The log line should be useful without context.** Three months from now, looking at one log line, can you tell what was happening? If not, add fields.

### Metrics and tracing

- **Count what matters.** Throughput, error rate, and latency (p50/p95/p99) for every meaningful operation. These are the Golden Signals (plus saturation) and they're worth their setup cost.
- **Per-operation metrics, not just per-service.** "API requests" is too coarse; "API requests by endpoint, by status class" gives you the slice you need at 3 AM.
- **Trace across services.** Distributed traces with correlation IDs let you see "this request slow because of *that* service." Worth the per-call overhead.
- **Don't metric everything.** Cardinality matters; high-cardinality labels (user IDs, request IDs) blow up most metric backends. Use traces for high-cardinality, metrics for low-cardinality.

### Security

- **Validate at the trust boundary.** Anything coming from a user, a network, an env var, or an untrusted file gets validated before it's used. Validation is type, range, length, format, semantic.
- **Escape at the output boundary.** SQL parameters, HTML output, shell args, command line. Use the project's existing escaping utility; don't roll your own.
- **Authentication and authorization are different.** Authentication is who; authorization is what they can do. Check both, at the right layer, every time.
- **Principle of least privilege.** Service accounts, IAM roles, file permissions, API tokens. Default to the minimum that works, not the maximum that's convenient.
- **Secrets out of code, out of logs, out of error messages.** Use a secrets manager. Rotate. Don't commit. Don't print.
- **Be paranoid about deserialization.** `pickle.loads` of untrusted input is RCE. Same for unsafe YAML, certain XML parsers, and Java native serialization. Use safer formats (JSON, protobuf) for untrusted input.
- **CSRF, XSS, SSRF, IDOR, RCE.** Walk these explicitly for any user-facing endpoint. Each has standard mitigations; use them.
- **Dependencies are part of the security boundary.** New dependency = new attack surface. Vet, version-pin, and watch for advisories.

### Performance

- **Measure before optimizing.** "It might be slow" without a number is a guess.
- **Watch for N+1.** Loops that do a database call per iteration. Almost always fixable with a batched query or a join.
- **Watch for unbounded.** Lists, retries, recursion, queue size, file handles. Anything that can grow without limit will eventually grow without limit.
- **Synchronous I/O on a hot path is a bug.** Use the project's async patterns or a thread pool.
- **Hot loops shouldn't allocate.** In tight loops, every allocation is GC pressure later. Use object reuse, primitive types, or arrays.
- **Pagination, not full scans.** Any endpoint or query that returns "all rows" is a future incident. Cap or paginate.

### Reliability

- **Timeouts on every external call.** Default infinite is a bug. Choose a timeout that's loud (something fails) instead of silent (the whole system slows down).
- **Retries with backoff, capped.** Retry transient failures; back off so you don't amplify outages; cap so you don't retry forever.
- **Idempotency for retryable operations.** If the caller retries, your handler must handle the duplicate without double-processing. Idempotency keys or natural deduplication.
- **Circuit breakers for unreliable dependencies.** When the upstream is failing, stop calling it for a while. This protects you from cascading failure and protects the upstream from amplification.
- **Graceful shutdown.** SIGTERM should drain in-flight requests, finish ongoing transactions, then exit. Hard shutdown causes partial writes and lost work.
- **Health checks with meaning.** Liveness (am I alive?) and readiness (am I ready to serve?) are different. A readiness check that always returns 200 is decoration.

### Data hygiene

- **Migrations are backward-compatible.** During a deploy, old code and new code run simultaneously; both must work against the in-flight schema. The expand-migrate-contract pattern.
- **Never drop a column or table in the same change that stops using it.** Stop using, deploy, verify, *then* drop. Reverting is impossible after a drop.
- **PII is a hot potato.** Minimize collection, encrypt at rest, encrypt in transit, audit access, support deletion. Privacy regulations make this not optional.
- **Backups before any destructive operation.** Snapshots, exports, or at least a verifiable rollback path. "I'll just run this DELETE" is how data is lost.
- **Don't run untested SQL against prod.** Run on a copy, or in a transaction with rollback ready, or both.

## Decision rules

- **For every concern in this checklist, say "applies and handled," "applies and deferred (with reason)," or "doesn't apply (with reason)."** Skipping the walk is the failure; the answers can vary by change.
- **If a concern applies and is being deferred, say so to the user.** Silent deferral is unsafe.
- **If you find a class of failure (e.g., no timeouts on any external call), don't fix only the new one.** Either fix the class or surface the gap.
- **If the change is in a critical path (auth, payments, data deletion), the bar is higher.** Walk the checklist twice.
- **If the change is a one-off script with no production impact, most of this doesn't apply.** Calibrate.

## A worked example

Task: add an endpoint that returns a user's order history.

Walking the checklist:

- **Errors.** Returns 404 for unknown user, 403 for unauthorized, 500 with correlation ID for unexpected. Don't return 200 with empty list on database errors.
- **Logging.** Log the request with user ID and correlation ID. Don't log full order details.
- **Metrics.** Endpoint latency p50/p95/p99 and error rate. Slot into existing per-endpoint dashboards.
- **Tracing.** Spans for the DB query, propagated correlation ID.
- **Security.** Authentication required. Authorization: only the user themselves or an admin can see this. Check at the controller, not just the UI. Don't let a user-supplied ID leak orders for other users.
- **Performance.** Pagination required; never `SELECT * FROM orders WHERE user_id = ?` unbounded. Index on `user_id`. No N+1 for order line items — fetch in one query.
- **Reliability.** Database call has a timeout. Endpoint is idempotent (read-only, no side effects).
- **Data.** Read-only, so migrations and backups don't apply. Order data may include addresses (PII); confirm the response shape returns only what the UI needs, not the full row.

That walk takes two minutes. The two minutes is the difference between an endpoint that survives a security review and one that becomes an incident.

## Verification of production-ready code

Production readiness IS a multi-concern review. The walk-the-checklist approach above catches most issues in sequential thought. For non-trivial production changes, the same concerns map directly onto Shannon's parallel-by-concern verification pattern (see `verify-rigorously` §Parallel-by-concern verification): one subagent per concern, each going deeper than a single sequential pass can.

Trigger parallel-by-concern verification when the change is non-trivial AND production-bound (touches auth, payments, persistence, network IO, or customer-rendering surfaces — see verify-rigorously for the full criteria). The standard split — security, performance, reliability, tests, data integrity, accessibility, backward compatibility — is the same set of concerns this checklist covers. Each subagent runs deeper on its concern than your single pass through the checklist would.

For trivial production changes (a copy edit on a non-sensitive page, a metric label rename), walk this checklist once and ship. Don't fan out as ceremony.

## Anti-patterns

- **"This is internal, so I don't need auth."** Internal endpoints are exposed by misconfiguration, by VPN access, by service compromise. Default to auth.
- **"We'll add metrics later."** You won't. The cheapest moment to instrument a code path is when you're writing it.
- **"It's just logging."** Until the log line in the request handler tanks request latency by 80ms because the log backend is full.
- **"Errors are unlikely."** The probability of any individual error is small; the rate of *some* error happening over a year of production traffic is one. Plan for it.
- **"Performance is fine on my machine."** Your machine is not production. Measure where it matters.
- **"Retries are free."** Retries amplify outages. Without backoff and caps, they make the upstream's bad day into your bad day.
- **"It's behind a feature flag."** Feature-flagged code still runs, still has bugs, still has the same security and data implications. The flag controls who sees it, not whether it executes correctly.

## See also

- **right-sized-engineering** — production-readiness is exactly the place where under-engineering hides; this checklist makes the gaps visible.
- **critical-self-review** — many findings of self-review escalate into items on this checklist.
- **verify-rigorously** — boundary checks intersect heavily with production concerns (concurrency, encoding, time, locale).
- **engineering-excellence** — production-readiness is the final phase of the loop for production code.
