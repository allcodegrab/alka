---
name: research-first
description: Gather context before writing or modifying code. Use this at the start of any code task — feature, bug fix, refactor, or migration — and any time the request mentions an existing codebase, file, repo, or system. Trigger this even when the user phrases the request as urgent or simple ("just add this", "quick change", "tiny fix"); the urgency or smallness of a change is independent of whether you have the context to make it correctly. Do not skip this skill on the assumption that you already understand the code; the most expensive AI-coding bugs come from acting on plausible assumptions instead of verified context.
---

# Research First

Before writing or changing code, build the context that a senior engineer joining the codebase for the first time would need. The cost of skipping this step is paid in production, by someone else.

## Why this matters

The single largest source of bad AI-generated code is acting on plausible-but-wrong assumptions about the codebase. The model has seen a million projects; the user has one. When the model reaches for a "standard" pattern instead of the project's actual pattern, the diff looks fine, passes review on its own merits, and quietly fragments the codebase. Six months later nobody can find the canonical way to do anything because there are four.

Research is the cheapest insurance against this. A few minutes reading the surrounding code is almost always less time than a single round of revisions after the user catches the inconsistency.

## What to find before touching code

Run through this checklist before the first edit. Most items are one or two tool calls.

**The change site itself.**
- Read the target file(s) end-to-end, not just the function being modified. Functions are part of files, and files have invariants.
- Check the file's git history for recent activity and intent (`git log -p --follow <file>`). Recent commits tell you what direction the file is moving in.
- Check what calls into this code and what it calls out to. A signature change without checking callers is how you ship a regression.

**Codebase conventions (the implicit rules).**
- Naming: how are functions, classes, files, tests named here? Match it.
- Error handling: exceptions vs. result types vs. sentinel values? Logged, rethrown, swallowed?
- Logging: which library? What level for what kind of event? Structured fields?
- Testing: test framework, test file location, naming, fixtures, mocking style.
- Imports/dependencies: which utilities are already in use for HTTP, JSON, dates, IDs? Use what's there.
- Module boundaries: which directories are public surface vs. internal?

**Dependencies and runtime.**
- What's already in the manifest (`package.json`, `pom.xml`, `go.mod`, `requirements.txt`, etc.)? What versions?
- Is there a utility for what you need before you reach for a new dep?
- What language version, framework version, and platform constraints apply?

**Build, test, and run.**
- How is the project built? How are tests run? How is the code linted/formatted?
- Look for `Makefile`, `justfile`, `package.json` scripts, `pyproject.toml`, CI config.
- If you cannot answer "how do I run the tests for this change?" stop and find out.

**Prior art.**
- Has this kind of change been made before in this repo? `git log --oneline --all | grep -i <topic>` and read those commits.
- Is there an open or closed issue/PR about this? Ask if the user mentions one.

**Documentation that's actually relevant.**
- `README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `docs/`, ADRs (`docs/adr/`).
- Skim, don't read cover-to-cover. You're looking for "the way things are done here," not novel reading.

## Source quality (when researching externally)

When the task requires looking outside the repo — a library's behavior, a recent issue, a spec, an unfamiliar protocol — differentiate sources before trusting them. Most production bugs from "I looked it up" trace back to a Tier 3 source repeated as fact.

- **Tier 1 — authoritative.** Official docs, RFCs, peer-reviewed papers, the project's own GitHub issues/discussions, the framework's source code itself, the official blog of the maintainer organization. Treat as primary. Note the version and date — Spring Boot 2.x and 3.x docs disagree on plenty.
- **Tier 2 — expert.** Maintainer personal blogs, established engineering blogs from companies known to operate at scale (e.g., the database vendor's engineering blog, the framework author's blog), high-vote Stack Overflow answers from recognized contributors with clear reasoning. Treat as corroborating, not authoritative on its own. Cross-reference with Tier 1 for anything load-bearing.
- **Tier 3 — community.** Reddit, Medium, Dev.to, low-vote SO answers, random tutorials, AI-summarized content, GitHub gists. Many are outdated, plausible-sounding but wrong, or written by someone who learned the topic last week. Cross-reference against Tier 1 or 2 before relying on. Never use as the sole source for a claim that affects the code.

For any non-trivial external claim that influences the design or the code, internally tag the source tier. If the only support is Tier 3, surface that uncertainty rather than asserting confidently — say "this is what the community pattern seems to be, but I haven't found authoritative confirmation" and let the user decide whether to proceed or dig deeper.

## Decision rules

- **If you are about to invent a name, search first.** The thing you're naming may already exist under a different name.
- **If you are about to add a dependency, search first.** The functionality may already be in a transitive dep or a project utility.
- **If you are about to introduce a pattern, search first.** The codebase may have a canonical version of that pattern, possibly slightly different from your reflex.
- **If a file is over ~300 lines and you are about to edit a small piece of it, still skim the rest.** Files have invariants that are not visible from one function.
- **If you cannot find what you need in 5 minutes of searching, surface the gap.** Ask the user, or say "I'm proceeding under assumption X — flag if wrong." Do not silently guess.

## What "enough research" looks like

You have enough research when you can answer all of these without re-checking:

- Where exactly will the change live, and why there?
- What conventions of the surrounding code does my change need to match?
- What calls into the code I'm changing, and what does it call out to?
- How will I run the tests and linter for this change?
- What could break that isn't obvious from reading just my diff?
- What are the unknowns I'm proceeding despite, and have I named them?

If any of those is hand-wavy, you are about to write code on guesses.

## Concrete moves in an unfamiliar codebase

Order from cheapest to most thorough:

1. `ls` the project root; identify the language, framework, and structure at a glance.
2. Read the top-level `README.md` for the elevator pitch and entry points.
3. `find` or `tree` to a depth of 2–3 to see the layout.
4. `grep`/`rg` for the symbol you're about to modify across the whole repo. Read the call sites, not just the definition.
5. Read the file you'll change end-to-end.
6. Read one or two adjacent files of the same kind to absorb conventions.
7. Open the test file (or the directory tests live in) and read a similar test to see the testing style.
8. Run the existing tests once before changing anything, so you know what "green" looks like locally.

## Anti-patterns

- **Reading just the function you'll modify.** The function is shaped by the file around it. Read the file.
- **Trusting your memory of "how Java/React/Go does it" over the repo's actual choice.** The repo's choice wins.
- **Adding a dependency because it's the popular library.** The popular library may already be excluded for a reason.
- **Skipping the test setup discovery because "it's a small change."** Small changes break tests too.
- **Concluding research with "I think I have enough" without articulating what you found.** If you can't summarize the conventions in two sentences, you don't have them yet.
- **Asking the user questions that the codebase answers.** The codebase is the source of truth for "how do you do X here" — read it first, ask only what genuine ambiguity remains.

## When research is overkill

For a one-line typo fix, an obvious local rename, or a change isolated to a file you wrote three minutes ago in this same conversation, full research is overkill. The discipline is to run the checklist mentally and confirm "all of these answers are obvious," not to skip the act of confirming.

## When research has parallel threads

Some research questions naturally split into independent sub-questions: "compare these 4 candidate libraries against our criteria," "audit how N modules implement this pattern," "evaluate which of M approaches fits this constraint." Each sub-thread is research a separate person could do without coordination, then aggregate at the end.

For these, fan out via the multi-agent pattern (see `engineering-excellence` §Multi-agent coordination). Spawn 2–4 research subagents, one per sub-thread; each writes findings to `<mission>/artifacts/<thread>_findings.md`; you synthesize. This compresses a multi-hour sequential investigation into the wall-clock time of the slowest single thread.

Don't fan out for sequential research where one finding informs the next. Don't fan out for trivial questions answerable from one or two reads. The pattern earns its overhead only on genuinely independent research threads with non-trivial depth each.

## See also

- **plan-then-execute** — what to do with the context once you have it.
- **right-sized-engineering** — applies the conventions you found as a constraint on the design.
- **surgical-edits** — relies on knowing local style, which research provides.
