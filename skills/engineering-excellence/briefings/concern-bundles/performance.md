# Performance concern bundle

Inline checklist for the **performance verifier** subagent. Paste into the briefing's "Concern checklist" section.

## Lens

Walk the diff looking specifically for changes that would not show up at low load but degrade or fail at high load. Performance bugs are usually invisible in dev and obvious at 100x scale.

## Database queries

- Did the diff add a new query? In what request path? How often will it run per request?
- N+1: is the query inside a loop over a result set? `forEach(item => fetchRelated(item.id))` is the canonical N+1.
- Is there a JOIN / aggregation pipeline / lookup that scans an unindexed column? Run `EXPLAIN` mentally: which fields are filtered / sorted / grouped?
- Is the query bounded? Pagination, `LIMIT`, cursor — present? An unbounded `WHERE user_id = ?` returns all of a user's data and grows linearly with them.
- For MongoDB-specific code: does the aggregation use `$lookup` against an unindexed field? Is the `$match` stage *before* `$lookup` to filter early?
- For ORM/ODM code: is lazy loading triggering hidden queries? Spring Data: is `FetchType.LAZY` causing N+1 in serialization? Mongoose: are `populate()` calls bounded?

## Caching and idempotency

- Did the diff invalidate or bypass an existing cache? Is the new behavior consistent with cache semantics?
- Is the operation idempotent if retried? Bank-of-records operations (debit, decrement-stock) without idempotency keys are correctness issues that look like performance issues at scale.

## Hot path / blocking IO

- Is there a synchronous network call on a request path? `requests.get` in a Flask handler, blocking HTTP in a Node loop, `RestTemplate.exchange` in a Spring controller without async.
- Is there a blocking disk write on every request? Logging, file writes, `flush()` calls?
- For Java/Spring: any `Thread.sleep`, blocking `.get()` on Future, or synchronous database call where reactive was expected?
- For Node: is the diff CPU-bound work on the event loop (large JSON parse, sync regex on user input, sync compression)?

## Allocation and memory

- Did the diff introduce a structure that grows with input size? List, map, accumulator. What bounds it?
- Loading a whole file / whole table / whole collection into memory: does the diff stream instead?
- For long-lived processes: did the diff introduce a closure or listener that retains a reference, causing memory creep?

## Concurrency and contention

- Does the diff acquire a lock or transaction? In what scope? How long is it held?
- Are two operations expected to interleave (two requests, two retries)? Does the diff handle that, or assume single-threaded execution?
- For SQL: transaction isolation level on the new query — appropriate? Default REPEATABLE READ may cause gap-lock contention; READ COMMITTED is often safer for high-write paths.
- For Java: any `synchronized` block that holds beyond what's necessary? Any `ConcurrentHashMap` operation that should be atomic but is two calls?

## External services

- Does the diff call an external API? Is there a timeout? A retry policy? A circuit breaker / fallback?
- Will retries amplify load on a struggling upstream? (Retries without backoff and caps make a slow upstream a bigger slow upstream.)
- Is the external call on a critical path, or can it be queued / async?

## Boundaries

- Empty input: large allocation? Unbounded loop?
- Single item: query optimized for batches; correctness preserved for n=1?
- Maximum input: what happens at the largest plausible input size? 10k items? 1M?
- Pagination boundary: deep pagination via OFFSET on a million rows is a performance bug. Cursor-based?

## Common quick-checks

- Diff includes a loop with `await`/`.get()` inside — likely N+1.
- New `findAll`, `find()` without filter, `SELECT *` without `WHERE` and `LIMIT` — likely unbounded.
- New ORM call inside a serializer / template — likely hidden query.
- Sync IO on a request path: `fs.readFileSync`, `requests.get`, `urllib.request.urlopen`.

## Severity calibration for performance

- **Critical:** Will cause an outage or unbounded resource growth (unbounded query, infinite retry, memory leak, transaction held across blocking IO).
- **High:** Will cause significant user-facing degradation under realistic load (N+1 on a user-facing path, sync blocking IO on a hot endpoint, missing index on a high-volume query).
- **Medium:** Will measurably slow things at high load but won't break (suboptimal index choice, redundant query, oversized response).
- **Low:** Micro-optimizations, theoretical concerns without measured impact.

If you can't tell whether something is High or Critical without measuring, mark High and flag "needs measurement before merge."
