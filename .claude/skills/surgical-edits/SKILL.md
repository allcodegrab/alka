---
name: surgical-edits
description: Make the smallest correct change that solves the problem, matching the surrounding code's style, without drive-by edits. Use this skill during the execute phase of any code change — features, fixes, refactors. Trigger it especially when working in a file you didn't write, when the user said "small fix" or "just patch", and any time you feel the urge to "clean up while you're here". The urge to clean up is exactly the urge this skill exists to interrupt; clean-up belongs in its own change with its own approval, not as a passenger inside an unrelated diff. This skill applies to every line you edit, not only at decision points.
---

# Surgical Edits

Change the minimum necessary to solve the problem, written in the style the file already uses, with no unrelated improvements riding along. The goal is a diff a reviewer can read top-to-bottom and understand in one pass.

## Why this matters

The diff is the unit of review. Big diffs are reviewed badly. Mixed diffs (one logical change plus four unrelated cleanups) are reviewed worst — the reviewer either reads them seriously and is overloaded, or skims and rubber-stamps things that should have been examined. Either way, the bar drops.

The discipline is to keep the diff small enough that a careful reviewer reads every line, and focused enough that they hold the entire intent in their head at once.

## What surgical means in practice

**Touch the fewest lines that solve the problem.** If a one-line change works, do not refactor the surrounding function to "improve readability" first. If you genuinely need to refactor first, do that as a separate, prior change — with its own plan and approval.

**Match the surrounding style exactly.** Naming, brace placement, error handling, logging, comment style. If the file uses tabs, use tabs. If it returns `Result<T, E>` everywhere else, do not throw exceptions. Consistency in a file matters more than your aesthetic preference; the next person reading this file will pattern-match off it.

**Don't introduce new patterns alongside old ones.** If the codebase has a way of handling HTTP errors, use it; don't import a different library because it's "better." If you genuinely think the existing pattern should change, propose that as a separate, prior conversation. Don't pioneer a new approach in a feature PR.

**Don't reformat unrelated code.** Even if the formatter wants to. Configure your editor to respect the existing formatting on lines you didn't touch, or split the formatting change into its own commit. Reformatting is the most common source of unreviewed code shipped under the cover of "just formatting."

**Don't fix unrelated bugs in the same change.** When you see one, file it (or write it down) and fix it next. Mixing fixes hides each behind the other.

**Don't add abstractions you don't need yet.** A helper function used in one place is just an extra hop. Inline first; extract later when there's a second use.

## Reading the diff like a reviewer would

Before declaring done, look at the actual diff (`git diff` or equivalent) and ask:

- Does every line in this diff belong to this change? Any line that doesn't is a drive-by — pull it out.
- Could a reviewer understand the diff without context? If the answer requires "you also need to know that I…", the diff is too coupled or the commit message is missing context.
- Is there churn? (Lines that were edited and then edited back, or files modified for renaming purposes.) Churn dilutes signal; squash or restructure.
- Does the diff match what you'd write if a senior engineer were watching? If not, fix the diff before they see it.

## Decision rules

- **If the change touches more than ~5 files or ~200 lines, ask whether it should be split.** Sometimes the answer is no — but the question should be asked.
- **If you find yourself fighting the existing style, stop fighting.** Match the style. If you genuinely think the style is wrong, that's a separate conversation, not a unilateral fix in this diff.
- **If the change requires a refactor first, do the refactor first as a separate, prior change.** "Mostly mechanical refactor + small behavior change in one diff" is the worst review experience that exists.
- **If you're tempted to delete or rewrite working code that you simply don't like, don't.** The code works; the cost of the rewrite is paid by everyone.
- **If the linter or formatter wants to change unrelated lines, suppress the change or commit the format separately.** Never let formatting churn enter a feature diff silently.
- **If you're modifying generated code, you're probably doing it wrong.** Generated code regenerates; check whether you should change the generator instead.

## Concrete examples

**Bad surgical edit.**
> Task: fix a null check in `UserService.findById`.
> Diff: 200 lines. Renamed `findById` to `getUser`, extracted three helper functions, added a logger field, switched from `Optional<User>` to a custom `Result<User>`, and oh, also fixed the null check.

This is six changes. Each may be defensible. As one diff, it is unreviewable. Even if every individual change is correct, the reviewer cannot verify them all in the time they have, so they will either reject or rubber-stamp.

**Good surgical edit.**
> Diff: 4 lines. Added the null check with the exact error-handling style used elsewhere in `UserService`. One test added.

The reviewer reads the four lines, sees the null check is correct and the style matches, approves. Total review time: 90 seconds. Risk to the codebase: minimal.

**Bad surgical edit (the silent dependency).**
> Task: format a date for display.
> Diff: added `moment` (or `date-fns`, `dayjs`, etc.) as a new dependency to format one date in one place.

Even if the dep is a fine library, the project may already have a date utility. Even if it doesn't, the choice of date library is an architectural decision that affects every future date in the codebase. Surface this; don't smuggle it in with a feature.

**Good surgical edit.**
> Used the project's existing `formatDate` helper in `lib/dates.ts`. If there isn't one, asked the user which library to use before adding one.

## What surgical edits are not

Surgical does not mean cowardly or evasive. If the right fix requires touching 50 lines, touch 50 lines. If the right fix is a refactor, do the refactor (as its own, approved change). The discipline is "minimum *necessary*", not "minimum possible."

Surgical also does not mean leaving broken windows. If the change you're making depends on something nearby being fixed, fix it — but mention it explicitly: "Slice 1 of this change required fixing X; I did that in a separate commit ahead of the feature." Honesty about scope is what makes surgery surgical.

## Anti-patterns

- **"While I was here..."** The single most common source of unreviewed bug introductions.
- **Reformatting on save in a feature branch.** Configure your editor or split the format commit.
- **Renaming things alongside behavior changes.** Rename in one commit, behavior change in the next, so reviewers can verify the rename is purely mechanical.
- **Style fixes that change semantics.** "Cleaned up this function" diffs that include a new branch or a changed condition. Reviewers will miss the semantic change because the diff looks like a cleanup.
- **Silent imports.** Importing from a different library, framework, or internal module without saying so. Even mention it in the PR description.
- **Hidden config changes.** Tweaking a `.yaml`, `.json`, or `.env` value in a feature diff. Surface it.
- **Comment churn.** Editing comments that describe code you didn't change. Either you found a doc bug (then say so) or you're padding the diff.

## See also

- **plan-then-execute** — slice boundaries should match diff boundaries.
- **right-sized-engineering** — provides the principles behind "match local style".
- **critical-self-review** — re-reading the diff before declaring done is the safety net against drive-bys.
- **documentation-discipline** — for changes that need accompanying doc edits, kept in the same diff.
