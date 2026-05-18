---
name: version-control-craft
description: Apply universal version-control craft — atomic commits, informative messages, clean history, well-framed PRs — independent of any specific git workflow. Use this skill whenever you commit, prepare a PR, rebase, merge, or revise history. Trigger this every time you write a commit message, every time you split or squash commits, every time the user says "commit this" or "open a PR", and any time you find yourself about to make a single commit that does two unrelated things. The project-specific parts (branch naming, commit format, merge vs rebase) live in the project's engineering-context.md; this skill is the universal craft on top of whatever convention the project uses.
---

# Version Control Craft

History is communication with the future. Every commit is a message to whoever reads it later — including you, six months from now, hunting a regression. The craft is to make that message clear, atomic, and reviewable, regardless of which git workflow the project uses.

## Why this matters

Bad version-control hygiene compounds. A single sloppy commit is recoverable; a year of them produces a history that nobody can bisect, a `git blame` that points at meaningless changes, and PRs that take an hour to review because the diff mixes a feature, a refactor, and a typo fix. Every future debugging session pays the cost.

The good news is that the craft is small and learnable. Five principles. Project-specific conventions (commit message format, branch model) layer on top.

## The five principles

**1. Atomic commits.** Each commit does one thing. "One thing" means: the commit could be cherry-picked alone, the commit could be reverted alone, the commit's tests pass alone. A commit that "implements feature X" plus "fixes a bug in Y" plus "renames Z" is three commits, not one.

**2. Informative messages.** The first line is a self-contained summary in the imperative ("Add caching to user lookup"). The body, if needed, says *why*. The diff already says *what*. Anyone reading just the message — without the diff — should know what changed and why.

**3. Clean linear history (where the project supports it).** Rebase your work on top of `main` before merging, so the history reads as a sequence of meaningful changes rather than a tangled merge graph. Squash WIP commits; preserve commits that represent real, separate steps.

**4. PRs are about review, not delivery.** A PR is a unit of review, sized so a reviewer can hold the whole change in their head. Big PRs get rubber-stamped. The unit of delivery is what the user sees; the unit of review is what the reviewer can actually examine.

**5. History is a contract.** Once a branch is shared, history on it is durable. Don't force-push shared branches without coordination. Don't rewrite history that other people have based work on. Reverts and corrections happen forward, not by editing the past.

## Atomic commits in practice

A commit should pass these tests:

- **Cherry-pick test.** If only this commit were applied to `main`, would the result be coherent?
- **Revert test.** If this commit were reverted, would the result still be coherent?
- **Bisect test.** If `git bisect` lands on this commit, can the bisecter actually run the tests?

If any answer is no, the commit is too big or too entangled.

When working, commit when each atomic step is complete. This is faster than trying to split a single mega-commit at the end. If you're reaching the end and have a mess, `git rebase -i` to split, but the cheaper path is committing as you go.

A common case: feature work that requires a small, unrelated refactor first ("I noticed this helper isn't quite right; let me fix it before adding the feature"). Make the refactor its own commit, with its own message, ahead of the feature commit. Reviewers can verify the refactor preserves behavior, then verify the feature builds on it.

## Commit messages: the standard form

Whatever conventional format the project uses (Conventional Commits, the project's house style, plain prose) — follow it. The universal layer underneath:

```
<imperative summary, ≤72 chars>

<body — why this change, what it enables, any non-obvious context>

<footer — tracker IDs, breaking-change notes, co-authors>
```

**The summary.** Imperative ("Add", "Fix", "Refactor"), not past tense or present continuous. Short enough to fit in `git log --oneline`. Specific enough that a reviewer skimming history can tell what changed.

| Bad | Better |
|---|---|
| "fix bug" | "Fix off-by-one in pagination cursor for empty results" |
| "updates" | "Update Mongo driver from 4.7 to 4.10 for ARM compatibility" |
| "wip" | (don't ship; squash WIP commits before merging) |
| "address review comments" | (squash into the commit being reviewed; the comments are not the change) |
| "more changes" | (split into atomic commits with real messages) |

**The body.** Optional but valuable for non-trivial commits. The body explains *why*. The diff shows the *what*. If the diff would be readable without the body, skip the body. If the diff might be misread without context ("why was this safe to delete?", "why this approach?"), the body is where that context goes.

**The footer.** Tracker links (`Closes #1247`), breaking-change markers (`BREAKING CHANGE: ...`), co-authors. Whatever the project uses.

A commit message is read more often than it is written. Spend the extra 30 seconds.

## When to squash, when to preserve

Squash when:
- The commits are WIP / "fix typo" / "address review" — these have no value as separate steps.
- The commit history is exploratory (tried A, then B, then C; only C ships) — the dead ends are noise.

Preserve when:
- Each commit is a real, separate, independently-meaningful step (refactor, then add feature; or migrate schema, then update callers).
- Reverting the second without the first should still be coherent.

The test: would a reader of the history a year from now want to see this commit on its own? If yes, preserve. If no, squash.

## PRs: framing the change for review

A PR is the change presented for review. The framing is part of the change.

**Title.** Same standard as commit messages — imperative summary, specific. If the PR has one commit, the title can match the commit summary.

**Description: lead with the why.** What is this PR for? What problem does it solve? Why this approach? A reviewer who reads only the description should be able to decide whether to invest in reviewing the diff.

**Description: how to verify.** What did you do to confirm this works? Which tests cover it? How would a reviewer check it themselves? This is what tells the reviewer how much to trust the diff.

**Description: surface the gates and tradeoffs.** Decisions that the reviewer should weigh in on (named in `plan-then-execute`'s GATES). Tradeoffs you considered. Things you considered and rejected. Don't make the reviewer figure these out from the diff alone.

**Size.** Aim for a PR a reviewer can read in 15 minutes. If the PR is larger, either split it or be explicit about why it can't be split (e.g., a coordinated rename across many files).

**Self-review first.** Before requesting review, read your own diff. Apply `critical-self-review`. The reviewer's job is to catch the things *you couldn't*, not the things you didn't bother to look for.

## History etiquette

- **Don't force-push to shared branches.** If you must amend a shared branch, coordinate.
- **Don't merge without rebasing first** (if the project uses linear history). Rebasing locally is much cheaper than untangling a merge mess later.
- **Don't bury commits in merges.** A merge commit that imports 30 other commits should be a rare exception, not a routine.
- **Reverts go forward.** `git revert` produces a new commit; this is the right answer. Don't force-push to "remove" a bad commit.
- **Tag releases.** Annotated tags, with release notes. Future you debugging a regression will thank present you.

## What to commit, what not to

- **Source code.** Yes.
- **Generated files.** Almost always no — re-generate at build time.
- **Build artifacts (binaries, `node_modules`, `target/`).** No. Use `.gitignore`.
- **Editor/IDE config.** Project-shared config, yes (e.g., `.editorconfig`). Personal IDE state, no.
- **Secrets, credentials, tokens.** Never. If you commit one by accident, treat it as compromised — rotate immediately, then remove from history (and force-push, with full team coordination, *only if* the leak hasn't propagated). Removing from history alone is not enough to un-leak a secret.
- **Generated docs.** Usually no — generate at build/release time. Exception: when the docs are versioned alongside a tagged release and consumers reference them by version.

### Claude artifacts — the new failure class

Claude Code creates files in `.claude/` that fall into two categories:

**Commit (team-shared, deliberately curated):**
- `.claude/skills/` — the skill suite.
- `.claude/agents/` — pre-built custom subagents.
- `.claude/commands/` — custom slash commands.
- `.claude/settings.json` — team-shared settings (no secrets).
- `.claude/memory/` — curated knowledge per the `project-memory` skill.
- `.claude/hooks/` — project hook scripts (no hard-coded secrets in them).

**Never commit (personal, transient, or sensitive):**
- `.claude/settings.local.json` — personal hooks; may contain API keys.
- `.claude/.local/` — any local override directory.
- `.claude/sessions/` — Claude Code session state.
- `.claude/missions/` — multi-agent transient work.
- `.claude/transcripts/` — full conversation logs (may contain pasted secrets).
- `.claude/agent-memory/` — subagent persistent memory.

This is a real and recurring failure class — Anthropic itself leaked the entire Claude Code source on March 31, 2026 through a missing `*.map` line in `.npmignore`. Independent April 2026 research found `.claude/` directories leaking API tokens in published npm packages. The full discipline lives in the **`repo-safety-net`** skill — invoke it at session start, before any `git push`, and before any `npm publish` / `docker push`. The skill ships paste-ready `.gitignore`, `.npmignore`, and `.dockerignore` templates and a deterministic shell script (`repo-safety-check.sh`) that the `PreToolUse` hook in `briefings/hooks-recipe.md` calls automatically.

## Decision rules

- **If a commit message starts with "and" or describes two changes, split the commit.**
- **If you find yourself about to amend a pushed commit, prefer adding a new commit unless it's purely a fix-up that hasn't been observed by others.**
- **If you can't write a meaningful commit message, the commit isn't atomic.** Split it.
- **If the PR description is "see commits", the PR is missing its framing.** Write the description.
- **If the diff has files you didn't intend to change, fix that before opening the PR.**
- **If you're considering force-pushing a shared branch, ask first.**

## Anti-patterns

- **The mega-commit.** "Implement entire feature." Reviewers can't process it; bisects can't isolate. Split.
- **WIP commits in main history.** "wip", "more", "fix", "fix again". Squash before merging.
- **Commit messages that paraphrase the diff.** "Change the value of X from Y to Z." The diff already says that. Say *why*.
- **PRs without a description.** Forces the reviewer to derive intent from the diff. Don't.
- **PRs that mix refactor + feature.** Reviewer can't separate "is the refactor safe?" from "is the feature correct?". Split.
- **Force-pushing shared branches without warning.** Loses other people's work; corrupts collaborative state.
- **Long-lived branches that diverge from main.** Each day they live, the rebase cost grows. Merge or rebase frequently.
- **Generated noise in the diff.** Lockfile changes from a tool run, formatter changes, IDE files. Strip before committing.
- **Hiding bad commits inside a merge.** A merge commit that brings in "wip 1, wip 2, fix typo" is the merge equivalent of a junk drawer.

## What this skill defers to project context

The project's `engineering-context.md` (under §11, Version Control Workflow) specifies:
- Commit message format (Conventional Commits, plain prose, project-specific tags).
- Branch naming and lifecycle (trunk-based, GitFlow, feature branches, release branches).
- Merge vs. squash vs. rebase policy.
- PR template, required reviewers, required checks.
- Tag and release conventions.

Read those before committing on a project for the first time. The principles in this skill are universal; the format is local.

## See also

- **surgical-edits** — atomic commits and surgical diffs are the same idea at different layers.
- **plan-then-execute** — slice boundaries should align with commit boundaries.
- **critical-self-review** — read your diff before opening the PR; catch what the reviewer would otherwise have to.
- **project-memory** — significant decisions made in a PR should also flow to the project journal.
