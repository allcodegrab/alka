---
name: continuous-learning
description: Scheduled crawler that watches Tier 1 (official docs) and Tier 2 (major-team blogs) for changes relevant to the project's stack, and produces skill-update proposals for CTO review. Never auto-applies. Configuration in `.forge/learning.yaml`. Runs during dream mode. Tier 3-4 sources (HN, Reddit, Twitter) are signal-only — never auto-trusted. Every proposal cites Tier 1-2 source URLs and lists affected skills + affected project files.
---

# Continuous Learning

Keeps skills current with the actual frameworks they describe. Crawls Tier 1-2 sources. Generates proposals. CTO decides.

## Why this exists, and the source-quality discipline

Skills age. TypeScript ships new features. Spring Boot deprecates patterns. AWS adds services. Without an active feedback loop, your `surgical-edits/SKILL.md` slowly disagrees with the language it teaches.

But: not every source deserves trust. The `research-first` skill (from your engineering-excellence v6 bundle) defines source quality tiers:

| Tier | What | Auto-trust? | Use in continuous-learning |
|---|---|---|---|
| 1 | Official docs (TypeScript handbook, React docs, Spring Boot docs, AWS docs, Anthropic docs) | Yes — verified | Crawled; produces proposals |
| 2 | Major-team blogs (Vercel, Anthropic, AWS, Google Cloud, Spring) | Yes — verified | Crawled; produces proposals |
| 3 | Reputable engineers' blogs (Fowler, Hightower, Abramov) | Manual curation | Consultable; not crawled |
| 4 | HN, Reddit, Twitter | Never | Signal only — informs research directions, not skill content |

Continuous learning crawls **Tier 1 and Tier 2 only**. Auto-updating skills based on a viral tweet is forbidden.

## When this skill triggers

- Scheduled (during dream mode): per-source `cadence:` field (daily/weekly/monthly)
- On-demand: `forge learn --source <id>` for a specific source
- After Anthropic SDK / model release (special-cased to daily)

## Hard skip

- Tier 3 sources without manual curation step
- Tier 4 sources — never crawled by this skill
- Source URLs that don't return on 3 retries (log + skip; don't produce proposal)
- Skills marked `frozen: true` in skill metadata (kept stable on purpose)

## Configuration — `.forge/learning.yaml`

```yaml
version: 1
enabled: true
crawl_window: dream-mode

sources:
  tier_1:
    - id: typescript-handbook
      url: https://www.typescriptlang.org/docs/
      cadence: weekly
      watch_for: api_changes,deprecations,new_features
      relevant_to_skills: [surgical-edits, testing-discipline]

    - id: react-docs
      url: https://react.dev
      cadence: weekly
      watch_for: api_changes,deprecations,new_features,hook_additions
      relevant_to_skills: [surgical-edits]

    - id: spring-boot-docs
      url: https://docs.spring.io/spring-boot/
      cadence: weekly
      relevant_to_skills: [surgical-edits, production-readiness]

    - id: anthropic-docs
      url: https://docs.claude.com
      cadence: daily
      watch_for: api_changes,model_updates,sdk_changes
      relevant_to_skills: [all]

    - id: anthropic-engineering
      url: https://www.anthropic.com/engineering
      cadence: weekly
      relevant_to_skills: [engineering-excellence, prompt-buddy]

  tier_2:
    - id: vercel-blog
      url: https://vercel.com/blog
      cadence: weekly
      tags: [react, nextjs, deployment]

    - id: aws-news
      url: https://aws.amazon.com/blogs/aws/
      cadence: weekly
      tags: [aws, infra]

output:
  proposals_directory: .claude/learning/proposals/
  format: skill-diff
  auto_apply: false
```

## Proposal format

`.claude/learning/proposals/<YYYY-MM-DD>/<topic>.md`:

```markdown
# Skill Update Proposal — TypeScript Error Handling Patterns

**Source:** TypeScript 5.6 release notes (Tier 1)
**URL:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html
**Detected:** 2026-05-20 03:14 UTC (during dream mode)
**Affects skills:** surgical-edits, testing-discipline
**Confidence:** high (official docs, direct quote)

## What changed
TypeScript 5.6 adds stricter exhaustiveness on switch statements over union
discriminants. Specifically: TS2367 when a case branch is unreachable due
to a narrower discriminant after a prior case.

## Current state of the project
- engineering-context.md §4 specifies `T | undefined` over `T | null` — OK.
- surgical-edits/SKILL.md does not address exhaustive switches on
  discriminated unions.
- Mandalore has 23 such switches (grep evidence in affected-files.txt).
- 3 will trigger TS2367 after upgrade.

## Proposed change
Add to surgical-edits/SKILL.md under "TypeScript-specific":
> For discriminated unions, prefer `case X.A:` over `if (x === 'A')`;
> TypeScript 5.6+ enforces exhaustiveness with TS2367. Add a `default:`
> with `assertNever(x)` to make new variants a compile-time error.

## Risk if not adopted
TS 5.6 upgrade produces 3 compile errors. Trivial fix; not adopting means
next refactor recreates the issue.

## CTO action
- [Approve] → Update skill; ship as PR
- [Defer]   → Skip TS 5.6 upgrade for now
- [Reject]  → Conventions stay
- [Discuss] → Open question

## Citations
- TypeScript 5.6 release notes: <URL>
- Affected code locations: attached affected-files.txt
```

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `crawl` | Schedule (during dream mode) | Walk configured sources; diff against last snapshot |
| `generate_proposal` | Crawl detected change | Produce proposal file |
| `notify` | New proposal generated | CTO Inbox item with link |
| `apply` | CTO approves | Open PR with skill update |
| `reject` | CTO rejects | Move proposal to `rejected/` with reason; park topic 90 days |
| `defer` | CTO defers | Move proposal to `deferred/`; revisit cadence per request |

## What this skill does NOT do

- **Doesn't auto-apply changes.** Every change CTO-approved.
- **Doesn't propose without citations.** Every proposal links Tier 1-2 source.
- **Doesn't crawl Tier 3-4.** Those inform research directions only.
- **Doesn't re-propose after rejection.** Topic parked 90 days minimum.
- **Doesn't crawl outside dream-mode window.** Off-hours only by default.

## Anti-patterns

- **Auto-trust on Tier 2.** Tier 2 is auto-trusted *for crawling* (we believe the source isn't trying to mislead us). But proposals from Tier 2 are still CTO-approved.
- **Crawling Reddit threads about TypeScript.** Forbidden. Tier 4 is signal-only.
- **Proposals without affected-files-list.** Every proposal cites concrete files in the project. "This applies to React code" without listing the React files is insufficient.
- **Recurring proposals after rejection.** Park 90 days. If circumstances change, the CTO can re-trigger.
- **Skill updates that contradict `engineering-context.md` overrides.** Project overrides win. The proposal should either align with the override or propose changing the override (which is a bigger decision).

## See also

- `engineering-context.md` §14 (continuous learning concept, project conventions)
- `FORGE_TEAM_OPERATIONS.md` §6 (full spec)
- `research-first` (engineering-excellence-v6) — defines the source tiers
- `dream-mode` — runs continuous-learning crawls
- `cto-inbox` — receives skill-update proposals
- `decision-ledger` — records applied/rejected proposals
