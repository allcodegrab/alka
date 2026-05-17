---
name: documentation-discipline
description: Decide what to document, what to leave to the code, and where to put it — without duplication, without AI-style preambles, and without leaving stale docs to mislead the next reader. Use this skill whenever you write or modify comments, docstrings, READMEs, ADRs, or any prose meant for future readers of the code. Trigger this every time you change code that has a docstring (the docstring may now be wrong), every time you find yourself writing a comment that restates what the next line does, and every time you're asked to "add documentation". This skill exists because bad documentation is worse than no documentation — wrong docs actively mislead — and AI assistants tend to over-document with prose that says nothing.
---

# Documentation Discipline

Documentation has one job: tell a future reader something the code itself cannot. Everything else is noise. Stale documentation is worse than missing documentation, because stale documentation is read and trusted before it is verified.

## Why this matters

Two failure modes dominate AI-written documentation. The first is restating the code in English: a comment above `total = price * quantity` saying "calculates total by multiplying price and quantity." The second is generative-style preambles: "This function is responsible for handling the orchestration of..." that take a paragraph to say nothing. Both are pollution. The reader skips them, or worse, reads them carefully and learns nothing while believing they have.

The cure is to ask, before any sentence of documentation: what does the reader gain from this that they could not get from reading the code? If the answer is "nothing", delete it.

## What to document

**The why, when it isn't obvious from the what.** Code shows what it does. Comments say *why* it does it that way and not the obvious other way. "Using a regex here instead of `parseInt` because the input may contain leading zeros that JS would interpret as octal" is a comment worth its line.

**Non-obvious constraints and invariants.** "This list must remain sorted; callers depend on bisect." "This map is not thread-safe; only the event loop should write to it." Without these, future edits will violate the invariant and produce bugs that look unrelated to the comment-less code.

**Public contracts.** Function signatures plus types tell the reader the shape; docstrings tell them the contract: what inputs are valid, what's returned, what exceptions/errors are possible, what side effects exist, what guarantees about ordering, idempotency, or thread safety apply. This is for code that other code calls.

**Surprising behavior and workarounds.** "This sleeps 100ms because the third-party API has a race we can't fix on our side." "This must run before the migration; see incident #1247." Future readers will want to remove the surprise; the comment tells them why they shouldn't.

**Architectural decisions worth preserving.** ADRs (architectural decision records): one short document per decision, explaining the context, the choice, the alternatives considered, and the tradeoffs. Future engineers asking "why is it like this?" find the answer here instead of inventing one.

**Operational knowledge.** How to run, build, deploy, debug. README and runbook material. The kind of knowledge that, when missing, manifests as new engineers pinging you on Slack at 3 AM during an incident.

## What not to document

**The "what" that the code already shows.** Function bodies, signatures, and type hints communicate what; comments should not duplicate.

**Restating obvious operations.** `// increment counter` above `counter += 1` is the canonical example.

**Section banners with no information.** `// ----- Helpers -----` adds nothing; if the code is so long that you need section headers, it's likely too long.

**Aspirational TODOs.** "TODO: refactor this someday." Either it's actionable now, or the comment is decoration. If the constraint is real ("TODO: replace once we migrate to v2 of the SDK, blocked on infra ticket #533"), it's a useful comment; otherwise delete it.

**Out-of-date narrative.** Comments that no longer match the code. Treat these as defects and remove on sight; do not just update around them.

**"This function..."-style preambles.** A docstring that opens "This function takes a user and returns a user object" wastes its first sentence. The signature already says that. Open with the contract or the why.

## Where it goes

Documentation should live as close as practical to the code it describes, so that the diff that changes the code can update the doc.

- **Inline comments** for line-level "why" or invariant notes.
- **Docstrings** for function/class/module contracts. Use the project's docstring convention; don't introduce a new one.
- **README in folders** for orientation when a directory's contents are not self-explanatory.
- **ADRs** in `docs/adr/` (or wherever the project keeps them) for architectural decisions, one decision per file.
- **Top-level README** for project-level "how to run, build, contribute".
- **Runbooks** for operational procedures.

The further the documentation is from the code, the more likely it goes stale. External wikis are the worst location; they decouple documentation from code review and quietly accumulate lies.

## Decision rules

- **If you change the code, update the docs in the same diff.** If the docs become obsolete, the diff is incomplete.
- **If the comment restates the code, delete it.** Even if you wrote it.
- **If the comment is wrong, deletion is better than ignoring it.** Wrong docs are worse than missing docs.
- **If you're tempted to write a long preamble, ask whether the code needs to change instead.** Code that needs a paragraph to explain may be code that should be split or renamed.
- **If multiple sources document the same thing, pick one canonical source and link.** Do not synchronize duplicates by hand; the duplicates will diverge.
- **If a function's docstring is half a page, the function may be doing too much.** Refactor the function; the docstring will shrink with it.

## A docstring template that actually earns its lines

For a function or method that's part of a public API:

```
[One sentence: what this does, in the imperative.]

[Optional: a sentence on the why, if non-obvious.]

Args:
  name: only documented if the type alone doesn't tell you the contract.

Returns:
  what comes back, including the meaningful states (e.g., "None if not found").

Raises:
  the exceptions callers should be ready to handle.

Notes:
  invariants, thread-safety, side effects, ordering guarantees — only if relevant.
```

Skip sections that don't add information. A pure function with self-evident parameters needs only the first sentence. A function with surprising failure modes needs the Raises section more than it needs anything else.

For internal/private functions, less is usually more. A one-line `# Returns the canonical user record, or None if duplicates exist (caller should resolve).` may be all that's needed, and is far better than a templated 12-line docstring of which 11 lines are scaffolding.

## A worked example: the same function, three ways

```python
def normalize_phone(raw: str, default_country: str = "US") -> str:
    """
    Normalizes a phone number to E.164 format.

    This function is responsible for taking a raw phone number string
    and converting it into the E.164 international format. It uses
    the default_country parameter to determine the country code for
    numbers that do not include one.

    Args:
        raw: The raw phone number string to normalize.
        default_country: The default country code to use.

    Returns:
        The normalized phone number string.
    """
    ...
```

Over-documented. Restates the signature. The docstring's prose adds nothing the types don't already say.

```python
def normalize_phone(raw, country="US"):
    ...
```

Under-documented. No types, no contract. A caller has to read the body to find out what valid input looks like and what comes back on garbage input.

```python
def normalize_phone(raw: str, default_country: str = "US") -> str:
    """Return `raw` in E.164 format. Numbers without a country code use `default_country`.

    Raises ValueError if `raw` cannot be parsed as a phone number.
    Numbers passed already in E.164 are returned unchanged.
    """
    ...
```

Right-sized. Tells the reader the contract (E.164 in, E.164 out), the behavior on missing country code, the failure mode, and the idempotence property — all in four lines. Nothing is restated from the signature.

## Anti-patterns

- **Block comments above every line.** A wall of `// `s makes the code less readable, not more.
- **Tutorial-style comments in production code.** Lessons belong in onboarding docs; production code is read by people who already know the language.
- **Fences (`====`, `////`, `*********`).** Visual decoration that adds nothing.
- **Commented-out code left "in case we need it".** Version control already has it. Delete.
- **Translating jargon for the reader.** If the reader is the right reader for this code, they know the jargon. If they aren't, they'll get further by reading the project's onboarding doc than by inline glossaries.
- **Apologizing in comments.** "Sorry, this is hacky." Either fix it or accept it; the apology helps no one.
- **AI-style "I will now..." preambles.** Documentation is for the reader, not a transcript of the writer's thinking.
- **Synchronized duplicate docs.** Same fact in code, in README, in wiki, and in the deck. They diverge; readers learn to trust none.

## Reviewing your own docs

When you finish writing, re-read the documentation as if you didn't write the code. For each sentence, ask:

- Could a competent reader of this language and codebase get this from the code alone?
- Is this true *right now*, after my latest change?
- If the code changed tomorrow, would this comment become a lie?

Sentences that fail any of these get deleted or rewritten.

## See also

- **surgical-edits** — doc updates ride along with the code change in the same diff.
- **right-sized-engineering** — under- and over-documentation are direct mirrors of under- and over-engineering.
- **critical-self-review** — a re-read pass catches the sentences that no longer match the code.
