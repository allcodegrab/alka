---
name: critical-self-review
description: Read your own diff with fresh eyes before declaring done, hunting specifically for the failure modes characteristic of AI-generated code — race conditions, hallucinated APIs, boundary errors, insecure defaults, plausible-but-wrong logic. Use this skill at the end of every code change, after verify-rigorously and before handing the change back to the user. Trigger this even when (especially when) the diff "looks fine"; the artifact paradox means polished-looking diffs are reviewed less critically, and AI-typical bugs hide inside polish. This skill is the second-to-last gate before "done", and skipping it is the most common reason a change ships clean and breaks in production.
---

# Critical Self-Review

After verification but before declaring done, re-read the diff as a senior reviewer would, with the explicit assumption that you got something wrong somewhere — and find that thing. The bugs you're hunting in this pass are the bugs the type-checker and your own tests will not catch.

## Why this matters

AI-generated code has a measurable bug profile that differs from human-written code. CodeRabbit's 2025 benchmark found AI-authored code carries 1.75× more logic errors, 1.64× more maintainability defects, 1.57× more security findings, and 1.42× more performance issues than human-authored code, even after passing the same review process. The bugs cluster in predictable categories. This skill exists to walk those categories deliberately, instead of trusting that the diff "looks right."

The artifact paradox compounds the problem: polished output reduces critical evaluation. Anthropic's own research on Claude.ai conversations found that polished artifacts (clean code, well-formatted files) lowered the rate of users fact-checking, missing-context detection, and reasoning challenge by 3–5 percentage points. The cleaner the diff looks, the more this skill matters.

## The AI bug taxonomy

Walk this list explicitly. For each item, say "doesn't apply" or "checked." Don't skip the act of checking.

**Hallucinated APIs.** A function call that looks plausible but doesn't exist, or exists with different arguments. Especially for libraries with similar-sounding alternatives (`requests` vs `aiohttp`, `lodash` vs `lodash-es`, `moment` vs `dayjs`). Verify imports resolve, methods exist on the imported types, signatures match.

**Wrong-library import.** The function exists, but it's from a different library than the project uses. The diff imports `pandas` when the project uses `polars`. Check the project's existing dependencies and use those.

**Race conditions in caching, async, and event handlers.** A common pattern: read state, do an async operation, write state. If two of those run concurrently, the second write clobbers the first. Look for shared mutable state touched across `await` points, callbacks, or event handlers. The classic bug is the cache-invalidation race; check for it.

**Off-by-one and boundary errors.** Loops with `<` vs `<=`. Slicing with inclusive/exclusive ends. Pagination where `page * size` is the start of the next page or the last item of this page depending on the convention. Re-derive these manually for each occurrence in the diff.

**Timezone / locale / encoding issues.** Date formatting that assumes the server's timezone. Sorting that assumes ASCII. String length that assumes one byte per character. Comparisons that assume case-insensitive means ASCII case-insensitive. Walk every date, every sort, every length, every comparison.

**Insecure defaults.** Authentication missing where it should be required. Authorization checked at the wrong layer (or only at the UI). Password handling that logs the password (or stores it plaintext, or hashes with a fast algorithm). XSS via unescaped output. SQL injection via string interpolation. Insecure deserialization (`pickle`, `unsafeYAML`, Java native `readObject`). SSRF via unrestricted URL fetching. Walk inputs from the trust boundary and ask: validated? escaped? authorized?

**Performance traps.** N+1 queries (loop calling `findById` per row). Quadratic loops where linear was possible. Synchronous I/O in a hot path. Unbounded resource accumulation (lists, file handles, DB connections) without cleanup. Unbounded retries without backoff. Look at every loop and every call across a network or disk boundary.

**Implicit assumption violations.** The codebase has a way of doing things; the diff didn't follow it. The codebase has a logging utility; the diff used `print`. The codebase uses `Optional<T>`; the diff returns null. Match the project's patterns; deviations are flags.

**Plausible-but-wrong.** The code is syntactically and logically coherent and solves a problem — but not the problem the user asked to solve. This is the hardest class to catch because each line reads correctly. The check is to re-read the original requirement and ask whether the diff achieves it, not whether the diff is internally consistent.

**Comments that lie.** Stale docstrings. Comments that describe what the code used to do. ASCII art for an algorithm that's now different. Either update or delete.

**Silent state on the way to error.** Code that catches an exception and returns a "default" value, leaving the system in a state where the next operation will fail more confusingly. If something failed, propagate or log loudly; don't paper over.

## The review pass

Run this pass at the end of every change. It takes minutes, not hours. Skipping it is what makes the change brittle.

1. **Re-read the original request.** What did the user actually ask for? Compare against what the diff actually does.

2. **Read the diff top-to-bottom, every line.** Not the files — the diff. Skim is not enough; read.

3. **For each non-trivial change, walk the AI bug taxonomy.** "Race condition possible here? No, no shared state. Boundary handled? Empty list returns the empty list, checked. Insecure default? Input is from internal call, no validation needed but worth a comment."

4. **Check the diff for the things the diff doesn't show.** Files that should have been changed but weren't (callers, tests, docs, config). The most dangerous omissions are silent.

5. **Test re-read.** Look at the tests added. Would they fail if the implementation were broken? Are they testing the behavior or the mock?

6. **Re-read the comments and docs.** Do they still match the code after this change? Did this change invalidate any nearby comments?

7. **Final integrity check.** Are there debug statements? Commented-out code? `console.log`s? `import pdb`? `// FIXME` left in? Hardcoded credentials, even in tests?

If any rung fails, return to verify-rigorously or earlier. Don't paper over; fix and re-run the pass.

## Decision rules

- **If the diff "looks too clean," look harder.** Polished diffs hide bugs better than messy ones.
- **If you cannot find anything wrong, that is a signal to look at a different category.** Most diffs have *something* — a stale comment, a missed edge case, a too-broad catch. If you found nothing, you reviewed too narrowly.
- **If the AI bug taxonomy turns up something, fix it before declaring done.** The point of the pass is to catch these, not to log them.
- **If the change is large enough that a full self-review is infeasible, the change is too large.** Split it.
- **If you find a bug, ask: is this just one bug, or a category?** A boundary error in one place often means boundary errors in three places.

## How this differs from verify-rigorously

`verify-rigorously` runs the verification ladder: types, tests, scenario, boundaries. It is mechanical and answers "does it work?"

`critical-self-review` reads the diff like a reviewer would: looking for the bugs that pass verification but fail in production. It is interpretive and answers "does it work *for the right reasons*, by the project's standards, without subtle landmines?"

Both are needed. Skipping either one is a different kind of failure.

## What to do when self-review finds something

For each finding:

- If it's a real bug: fix it. Add a test that catches the bug if it's the kind of bug a test could catch.
- If it's a stylistic deviation from the codebase: align with the codebase.
- If it's a tradeoff you made deliberately and it's not obvious to a reviewer: comment, or surface to the user.
- If the bug pattern suggests a class of bugs (one race condition probably means more), sweep for the class.

Do not declare done while the self-review pass is still surfacing findings.

## Anti-patterns

- **Skimming the diff instead of reading it.** Especially when you're tired. Especially when it's long. Especially when "you remember writing it." Read every line.
- **Treating the AI bug taxonomy as a list to mention, not check.** Saying "I considered race conditions" without actually tracing the concurrent paths is theater.
- **Self-review with the same mindset as writing.** Switch contexts: assume the diff has at least one defect, and you're going to find it.
- **Stopping at the first finding.** A bug found is reassuring. Keep reading; there are usually more.
- **Marking the pass complete while findings remain.** Either fix or surface; do not silently log and move on.
- **Running self-review only on "important" changes.** The "small" changes are where polish-paradox bugs ship.

## See also

- **verify-rigorously** — the mechanical pass that runs before this interpretive one.
- **production-readiness** — many self-review findings escalate into production-readiness concerns.
- **engineering-excellence** — places this skill at the right point in the loop.
- **research-first** — many "implicit assumption violations" are caused by skipping research.
