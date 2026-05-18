---
name: stand-up
description: Once per phase (and at most every 15 minutes), every active role produces a one-line status update. Aggregated into the dashboard's mission swimlane view. Triggers on phase transitions, on CTO request (`/standup`), and at the 12-hour mark of a 24-hour mission. Rate-limited to prevent noise. Constant stand-ups are anti-pattern — frequent status emissions become background noise that the CTO ignores.
---

# Stand-up

A rate-limited per-role status emission. Inspired by real engineering stand-ups, with the rate-limiting that real engineering stand-ups don't honor.

## Why this exists, and what it deliberately is not

Multi-agent systems that emit constant status updates produce noise. The dashboard fills with "@impl-a is still working", "@security-verifier is still queued", "@impl-a is still working (2 min)", "@impl-a is still working (3 min)" — and the CTO stops looking. Important signals get buried.

This skill produces *structured, rate-limited* stand-up entries. Each entry is one line per role, written to a known file, surfaced in the dashboard. Frequent enough to be useful; rare enough to be readable.

**This skill is not:**
- A chat log (artifacts live in `mission/whiteboard.md` and per-role files)
- A progress bar (the dashboard's swimlane already shows progress visually)
- A debug log (transcripts live in `mission/transcript/<role>.jsonl`)

## Triggers (rate-limited)

A stand-up may emit when ANY of the following is true AND the last emission was >15 minutes ago:

- **Phase transition** (research → plan → implementation → verification → release)
- **Mid-mission check-in** at H+12:00 in 24-Hour Mode
- **CTO request** (`/standup` in command palette or `forge standup` on CLI)
- **Significant event** (verifier finding HIGH/CRITICAL, mission paused, role blocked >30 min)

Note: 15 min is the *minimum* interval. There is no maximum — a quiet mission may have one stand-up per phase, full stop. That's correct.

## Hard skip

- Standard Mode missions <30 min total (no stand-up earned; just emit closing summary)
- Single-role missions (the role's own transcript is the stand-up)
- Conversational tasks (not missions at all)

## Stand-up entry schema

A stand-up is a structured emission per role:

```markdown
[2026-05-16 13:42] STANDUP — mission: skill-loader-refactor — phase: implementation

@vp-engineering   coord  running    7/12 slices done, ETA H+22:30, on track
@architect        plan   done       Architecture locked at H+2:48; artifacts/architecture.md
@data-engineer    plan   done       No DB changes this mission; dismissed (decision: dec-002)
@researcher       plan   done       Research summary in artifacts/research.md
@impl-a           build  running    slice-3 (handler+tests) — 65% — eta 14:30
@impl-b           build  blocked    slice-5 — auth pattern question to @architect (whiteboard)
@impl-c           build  running    slice-7 (jwt) — retrying after tsc fail
@impl-d           build  idle       awaiting slice assignment
@stylist          build  running    slice-9 (admin UI) — 40%
@tests-verifier   verify queued     awaiting first slice ready for review
@security-verifier verify queued    awaiting first slice ready for review

Cost so far: $14.20 / $20 (71%)
Notable: 1 blocked role (impl-b); 1 retry (impl-c); 0 HIGH findings.
```

Fields per role (left to right):
- `@<role-id>`
- Tier (coord | plan | build | verify | release | knowledge)
- State (running | done | blocked | queued | idle | dismissed)
- One-line status (max ~80 chars)

Bottom of every stand-up:
- Total mission cost vs budget
- Notable: count of blocked roles, retries, HIGH findings

## What a stand-up does NOT include

- **Free-form opinions** (no "I think we're behind"). State the data; the dashboard's traffic-light coloring conveys "behind."
- **Plans for the next 15 minutes** (the assigned slice and ETA are sufficient).
- **Apologies** ("Sorry slice-3 is slow"). Stand-ups are reports, not performance theater.
- **Cross-role critique** ("@impl-b is blocking us"). If @impl-b is blocked on @architect, both rows reflect that; the whiteboard has the question.
- **Repeated content from the prior stand-up** (if @architect was `done` 15 min ago and is still `done`, the row is still emitted but trimmed to one word).

## Output location

The stand-up is written to:
- `.claude/missions/<mission-id>/standups/<ISO-timestamp>.md`
- `.claude/missions/<mission-id>/dashboard.json` (overwritten with latest)
- Slack `#forge-missions` channel (configured via §3.2; HIGH/CRITICAL events only)
- Dashboard swimlane (read live from `dashboard.json`)

## How a role produces its row

Each role, when prompted for stand-up, writes its row by:

1. Reading its current TodoWrite state (Claude Code provides this).
2. Reading its own transcript's most recent action.
3. Estimating completion % from concrete signals (slice completion = sum of finished sub-todos / total).
4. Producing the row in the schema above.

If the role can't summarize in one line, that's a signal it doesn't know where it is. The orchestrator surfaces this.

## Anti-patterns

- **Stand-up every 60 seconds.** Forbidden. 15-min minimum. The rate limit is structurally enforced.
- **Stand-up with prose** ("I've been working on the auth handler. I think it's going well. There might be an issue with..."). Structured rows only. If the role has something to say beyond the row, it goes in the whiteboard, not the stand-up.
- **Stand-up driven by user impatience.** The CTO may invoke `/standup` on demand. Anything more than 1 per 5 min suggests something else is wrong — probably the orchestrator should escalate.
- **Stand-up that doubles as a status report to leadership.** The CTO IS leadership. The dashboard IS the status report. Stand-ups are the working artifact.

## See also

- `engineering-context.md` §14 (Stand-up concept) and §17 (Team Mode coordination)
- `FORGE_TEAM_MODE.md` §16.8 (rate-limited stand-up as a novel design move)
- The dashboard's mission swimlane view (`ANVIL_DESIGN_SYSTEM.md` §5.3)
