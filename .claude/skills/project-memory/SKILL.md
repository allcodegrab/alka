---
name: project-memory
description: Maintain durable, file-based project memory across sessions — short-term working notes, long-term episodic record, distilled conventions, and procedural playbooks — so that what you learn in one session is available to the next without loss. Use this skill at the start and end of every working session, and any time you discover something the next session would need to know (a convention, a decision, a non-obvious failure mode, a procedure that worked). Trigger this whenever the user mentions "remember", "note that", "for next time", or expresses anything that should outlive the session, and equally on every meaningful decision made during work, even when the user didn't ask for it to be remembered. The default LLM has no cross-session memory; without this skill, every session starts cold and the same lessons get re-learned forever.
---

# Project Memory

Persistent, file-based memory the next session can read. Designed so nothing important is lost, nothing is silently rewritten by an LLM-summary that drifts from truth, and the user can audit at any time why something is in memory.

## Why this matters

LLM context windows are finite and per-session. Without a file-based memory, every new session starts cold — the conventions you learned, the decisions made, the procedures that worked, the dead ends you already explored. The next session repeats the discovery. Sometimes it repeats the mistake.

Recent agent-memory research (MemMachine, MemGPT, AgeMem, SimpleMem, 2024–2026) converges on a few principles. First, store the ground truth — the raw fact, with its source — separately from any distilled summary. Distilled summaries drift; ground truth doesn't. Second, separate memory by lifetime: working-set notes for the current task, episodic record of what happened, semantic distillation of stable conventions, procedural playbooks for repeatable operations. Third, write policies must be explicit; auto-summarization by LLM compounds errors over sessions. Fourth, memory must be auditable — you must be able to see *why* something is remembered and *where* it came from.

This skill encodes those principles as a directory structure and a small set of write/read rules.

## The memory layout

Memory lives at `<repo>/.claude/memory/` (or whatever path the project's `engineering-context.md` specifies under §13). Four files, one per memory type. Plain markdown, append-only or curated explicitly.

```
.claude/memory/
├── working.md       # Short-term: current task, decisions in flight, open loops
├── journal.md       # Long-term episodic: dated record of what happened
├── conventions.md   # Semantic: distilled, stable facts about the codebase
└── playbooks.md     # Procedural: repeatable operations that worked
```

Each file has a strict purpose. Mixing them produces the same kind of mush that LLM-summarization produces, except permanent.

**A sibling directory, `<repo>/.claude/missions/`, is used for transient multi-agent coordination** (see `engineering-excellence` §Multi-agent coordination). Missions are per-task scratch — distinct from memory. Lessons that come out of a mission belong in `journal.md`; the mission directory itself can be purged after merge or when stale.

### `working.md` — the current task's scratchpad

What's actively in flight. Goals, plans, open questions, decisions made today. Cleared when the task is finished (its content migrating to the appropriate long-term file). Treat this as the equivalent of stickies on a desk: useful while the task is open, expected to disappear once it closes.

```markdown
# Working memory — last touched 2026-05-05

## Active task
Implement CSV export endpoint for user orders.

## Open questions
- [ ] Should empty exports return 200 with header-only CSV or 404? (asked user)
- [ ] Page size cap — using 10,000 rows per request as default; confirm.

## Decisions made this session
- Using existing `formatCsvRow` helper in `lib/export.ts`, not adding a CSV library.
- Auth check goes in the controller, not the service (matches existing pattern).

## Discovered
- `OrderRepository.findByUserId` already paginates; no need to add pagination there.
```

### `journal.md` — the dated record of what actually happened

Append-only. Newest entries at the top. Each entry is dated, identifies the session goal, what was done, what worked, what didn't, and pointers to the resulting commits / PRs / files. **This is ground truth.** Do not rewrite past entries; if you learn a previous entry was wrong, append a correction with a backlink, do not edit history.

```markdown
# Project journal

## 2026-05-05 — CSV export feature
**Goal:** Add `/users/:id/orders.csv` endpoint.
**Outcome:** Endpoint live; tests passing; merged in PR #1247.
**Notes:**
- N+1 issue caught in self-review: switched to `findByUserIdWithItems` that joins line items.
- Auth pattern decision: matched existing `OrdersController` (controller-layer check via `@PreAuthorize`).
- Open: empty-export 200-vs-404 question deferred to next iteration.

## 2026-05-04 — VideoSDK SIP webhook hardening
**Goal:** Fix NPE on `VoiceRoom.source` for non-SIP rooms.
**Outcome:** Fix shipped; regression test added.
**Correction (2026-05-06):** Fix was incomplete — the Firestore copy-back path also missed `source` field. See 2026-05-06 entry.

## 2026-05-04 (later)
...
```

The journal is what the next session reads first.

### `conventions.md` — distilled, stable facts about the codebase

Semantic memory. Facts about *how this project does things*. Curated and rewritten as understanding deepens, but each fact has a provenance link to the journal entry or commit that established it.

```markdown
# Conventions

## Error handling
- Controller layer: throw domain exceptions (`UserNotFoundException`, etc.); the global handler converts to HTTP. (See journal 2026-04-18.)
- Service layer: never catch generic `Exception`; let domain exceptions propagate.

## Logging
- Use `org.slf4j.Logger`, structured fields via `MDC.put` for correlation IDs.
- Never log full request bodies; log entity IDs and request IDs only.

## Testing
- Unit tests in `src/test/java/...` mirroring `src/main/java/...`.
- Integration tests use Testcontainers Mongo, not embedded.
- Test naming: `methodName_condition_expectedResult` (snake-case in JS, camel in Java).

## Naming
- Repositories: `<Entity>Repository`; never `<Entity>Dao`.
- DTOs: `<Entity>Request` / `<Entity>Response`; never bare `<Entity>Dto`.
```

Every line in this file should answer the question "what would a new engineer need to know about this codebase that isn't visible from any single file?"

When a convention is discovered to be wrong (the codebase has changed, or the original observation was incorrect), update the line *and* note the correction in the journal. Provenance trail intact.

### `playbooks.md` — procedural memory of operations that worked

Step-by-step procedures for things you'll do more than once. Run a migration. Diagnose a class of bug. Reproduce a flaky test. Roll back a deploy. Each playbook is dated when last verified to still work.

```markdown
# Playbooks

## Run integration tests locally (verified 2026-05-04)
1. `docker compose up -d mongo` — starts the test container.
2. `./mvnw test -Pintegration` — runs the integration suite.
3. Expected runtime: ~3 min on a clean cache.
4. Common failure: port 27017 in use → `docker compose down` first.

## Diagnose a 500 with no stack trace (verified 2026-05-02)
1. Find the request ID in the access log.
2. Grep the application log: `grep <request-id> app.log | jq .`.
3. The actual error is usually three log lines above the 500 response — async logging breaks ordering.
4. If correlation ID is missing: the request died before the filter ran; check the ALB/ingress.
```

A playbook is verified by running it. If you follow a playbook and it fails, fix the playbook in the same session.

## Read protocol — what to do at session start

Every session begins with a memory-read pass. This is not optional; it's what makes memory useful.

1. **Read `working.md` first.** Is there an active task? Continue it, or close it (move resolved items to `journal.md`).
2. **Skim the most recent journal entries.** What was done in the last few sessions? Any open loops?
3. **Read `conventions.md` end to end if the upcoming task touches conventions.** It's short by design.
4. **Read `playbooks.md` only when about to run an operation it covers.**

The pass takes 30 seconds. The cost of skipping it is rediscovering things you already wrote down.

## Write protocol — what to record, when

**To `working.md`** — continuously throughout a session. Open questions, decisions made, things you tried, what you discovered. This is the scratchpad. Don't curate.

**To `journal.md`** — at session end, or at any meaningful checkpoint within a session. Dated entry, what was the goal, what happened, what worked, what didn't, what's left open. Append. Never rewrite — append corrections with backlinks instead.

**To `conventions.md`** — only when you've discovered or confirmed a stable fact that the next session will need. Add the fact, link to the journal entry that established it. Curate when conventions are revised; preserve provenance.

**To `playbooks.md`** — when you run an operation you'd run again, or when you wish a playbook had existed and didn't. Date the verification.

## What goes where: a routing rule

When you're about to record something, ask: how long is this useful for?

- Useful only for the next 10 minutes? → `working.md` (or just hold in head).
- Useful for this task and across sessions while the task is live? → `working.md`, then promoted to `journal.md` at task close.
- Useful as a record of what happened? → `journal.md`.
- Useful as a stable fact about the codebase? → `conventions.md` (with journal provenance).
- Useful as a "how to" for an operation? → `playbooks.md`.

Don't write the same fact in two files. Pick the most stable file and link from anywhere else.

## The unbiased-memory rule

Memory is for ground truth, not for the polished narrative. Specifically:

- **Record what happened, not what you wish had happened.** "The first three approaches failed; the fourth worked" is the right entry. "Implemented the feature using approach 4" alone hides the lesson.
- **Record what was tried and didn't work.** Negative results prevent the next session from re-trying the same dead end.
- **Record corrections, don't rewrite history.** If yesterday's journal entry was wrong, today's entry says so.
- **Record what the user said, not what you inferred they wanted.** When the user makes a decision, quote (paraphrase faithfully) the decision; don't smooth it.
- **Don't write to memory to make yourself look good.** Writing "everything went smoothly" when there were three retries is a memory bug.

## What not to put in memory

- **Secrets, credentials, tokens, keys.** Memory files are committed to repos; treat them as public.
- **Customer PII or sensitive operational data.** Same reason.
- **Long verbatim copies of code.** Reference the file path and commit hash; don't duplicate.
- **Auto-generated summaries of conversations.** These drift. Write deliberate, dated entries instead.
- **Temporary noise.** "Tried command X, got expected output." Memory is for things future-you needs.

## Curation: keeping memory healthy

Memory rots when nobody curates it. A weekly or per-feature pass:

- **`working.md`** — should be empty between tasks. If it isn't, you have an open loop; close it or migrate it to the journal.
- **`journal.md`** — never edited; only appended. Curation here is reading the recent few entries and confirming they're true.
- **`conventions.md`** — re-read against the current codebase. Conventions you can no longer find: were they wrong, or did the codebase change? Update with provenance.
- **`playbooks.md`** — re-run a sample. Update the "verified" date. Delete playbooks that no longer apply.

The whole pass takes 10 minutes for a healthy memory directory. If it takes more, the memory has accumulated noise that should have been curated earlier.

## When memory and the codebase disagree

The codebase wins. Memory is a useful map; the codebase is the territory. If `conventions.md` says "we use library X" and the code now uses Y, the convention is stale. Update memory, note the change in the journal.

This is also why the read protocol leads with `working.md` and the journal — they're current. `conventions.md` is updated less often and is allowed to lag behind the codebase, but the moment it's discovered to lag, it's updated.

## Anti-patterns

- **Auto-summarizing the conversation into memory.** Summaries drift; don't.
- **Writing only successes.** Halves the value; the failures are the lessons.
- **Editing past journal entries.** Append corrections; preserve history.
- **Memory that no one reads.** If the read protocol isn't followed, the write protocol is wasted effort.
- **Memory that's longer than the codebase.** A signal it's accumulated noise; curate.
- **Mixing the four files.** Working notes in conventions; conventions in the journal. The structure exists because it works; respect it.
- **Recording "the user prefers X" when they really said "let's try X for now".** Distinguish stated preference from working hypothesis.
- **Treating memory as private.** Commit it. The project knows what it knows; the team gets the benefit.

## See also

- **research-first** — the codebase is the territory; memory is the map. Always cross-check.
- **engineering-excellence** — the orchestrator; loads memory at session start, prompts memory writes at session end.
- **documentation-discipline** — same principles (close to code, no duplication, no drift) applied to project memory rather than code docs.
