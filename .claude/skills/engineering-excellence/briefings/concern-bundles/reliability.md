# Reliability concern bundle

Inline checklist for the **reliability verifier** subagent. Paste into the briefing's "Concern checklist" section.

## Lens

Walk the diff asking: when this fails (and it will), what does the system do? Reliability bugs only appear when something else has already gone wrong.

## Error handling completeness

- Every external call (DB, HTTP, file IO, queue, cache) — what's the error path? `try/catch`, `Result<T,E>`, `.catch()`, error return. Not just `try/catch` swallowing everything.
- Caught errors: are they handled meaningfully, or just logged and ignored? `catch (e) { console.log(e) }` is hiding bugs.
- Are errors enriched with context as they propagate? `wrap("failed to load user $id", err)` debuggable; bare `err` not.
- Distinction between retryable (timeout, 503, network blip) and non-retryable (400, validation failure, NotFound) preserved? Code that retries on 400 forever is a bug.
- Any new code path that could `panic`/throw and crash a worker if not caught at the top level?

## Retry and timeout

- Every external call has a timeout? Default no-timeout = wait forever = stuck workers.
- Retries: with backoff (exponential)? Capped (max attempts)? Idempotency considered (don't retry POST-without-key)?
- Is the retry on the right layer? Retrying at every layer (client + service + retry middleware) compounds badly; usually one explicit retry layer.

## Idempotency

- Is the operation safe to call twice with the same input? If not (debits, decrements, sends), is there an idempotency key + dedup?
- Can a partial failure leave state half-updated? Two-phase operations (DB write + external call) — what's the consistency model? Outbox pattern, saga, eventual consistency notes?

## Observability

- Will failures surface? Is there a log line at the failure point with enough context to debug at 3 AM?
- Is the log structured (key=value or JSON), or a string with no fields?
- Are there metrics? Counter for failure rate, histogram for latency, gauge for queue depth — at least one if the path is critical.
- Is a trace ID / correlation ID propagated through the new code path?
- Are sensitive values redacted in the logs? (Tokens, passwords, full request bodies.)

## Failure mode under partial failure

- Network partition mid-operation: does the diff handle it, or does it get stuck?
- Database slow but not down: does the connection pool exhaust? Is there a max connection limit on the new caller?
- Upstream service down: does the diff fail fast (circuit breaker, fallback), or does it queue requests until the local service falls over too?

## Resource cleanup

- File handles, network connections, database transactions, locks — does the diff release them on every path including error?
- For Java: `try-with-resources` used? For Python: `with` block? For Go: `defer`?
- For long-lived processes: any new listener, subscription, timer that needs cleanup?

## Configuration and feature flags

- Did the diff add a config flag or env var? Is the default safe? Is the absence handled (or does the code crash without it)?
- Is the new config documented somewhere a future operator would find?
- For a feature flag: what's the off-state behavior? Is "off" the deploy-safe default?

## Concurrency hazards

- Two requests modifying the same record: does the new code use optimistic locking, transaction, or some other mechanism? Or is there a lost-update window?
- Cache invalidation on update: is there a window where a stale read can return inconsistent data?
- Background job + on-demand request both touching the same data: race condition?

## Failure budget and rate-limiting

- New endpoint: should it have rate-limiting? At what tier (per-user, per-IP, global)?
- For a webhook/callback the new code accepts: protected against replays? Spoofs? Floods?

## Common quick-checks

- `try { ... } catch (e) {}` — empty catch, hiding errors.
- `setTimeout`/`Future`/`CompletableFuture` without explicit timeout — possibly forever.
- `requests.get(url)` in Python without `timeout=` — definitely forever.
- New `await` without surrounding `try`/`.catch()`. Unhandled rejection.
- Database transaction opened but no explicit commit/rollback on error path.

## Severity calibration for reliability

- **Critical:** Diff introduces a failure mode that can take the service down (unbounded retry, missing timeout on a hot path, deadlock potential, resource leak in request loop).
- **High:** Failures will be invisible (no logging), or recovery will be manual (no idempotency, lost data on retry, partial-failure leaves bad state).
- **Medium:** Recovery happens but with degraded UX (missing observability, weak retry strategy, missing circuit breaker on flaky upstream).
- **Low:** Cosmetic logging issues, missing metrics on low-traffic paths.

If the failure mode is "the service appears to work fine but data is silently inconsistent," that's High at minimum, often Critical.
