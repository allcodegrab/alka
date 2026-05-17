---
name: work-schedule
description: Manages when the team is on duty and per-role lifecycle states (active, paused, on-leave, retired, dreaming, consulting). Configuration in `.forge/schedule.yaml`. Triggers on schedule changes, on pause/leave/restart commands from the CTO via @vp-engineering, on schedule boundaries (start of business hours, dream-mode window, maintenance windows). The default schedule is business hours only — opt in to 24/7. Cost discipline.
---

# Work Schedule

The team doesn't need to run 24/7. Most days no missions are active. Schedule manages "when is the team open for business" and per-role lifecycle.

## Why this exists

Two reasons schedule earns a skill:

1. **Cost discipline.** A team that's "always on" idly consumes infrastructure cost and creates noise (cron jobs that fire whether useful or not). Business hours by default means weekend / overnight is dream-mode-only.
2. **Predictability.** You know that off-hours mission auto-acceptance is forbidden. A 24-hour mission overrides hours, but only after you (CTO) explicitly accept it.

## When this skill triggers

- Schedule file change (`.forge/schedule.yaml` save)
- Pause / leave / restart command from CTO via @vp-engineering
- Schedule boundary (business-hours start/end, dream-mode window, maintenance window)
- Auto-resume from a timed leave

## Hard skip

- Inside a 24-hour mission (schedule overridden by mission acceptance)
- For roles in `consulting` state (SME mid-response — not a schedule concern)

## Configuration — `.forge/schedule.yaml`

```yaml
version: 1
timezone: America/New_York

business_hours:
  monday:    "09:00-22:00"
  tuesday:   "09:00-22:00"
  wednesday: "09:00-22:00"
  thursday:  "09:00-22:00"
  friday:    "09:00-18:00"
  saturday:  "off"
  sunday:    "off"

# 24-Hour Mode overrides business hours (when explicitly accepted)
twenty_four_hour_mode_override: true

# When dream mode runs
dream_mode_window:
  weekday: "02:00-06:00"
  weekend: "anytime"

# Maintenance windows (no work; even 24h mode pauses)
maintenance_windows:
  - day: sunday
    time: "03:00-05:00"
    reason: "Knowledge graph rebuild + Voyage index refresh"

# Per-role overrides
role_schedule_overrides:
  pr-reviewer:
    business_hours: "always-on-demand"
  sme-*:
    business_hours: "on-demand"
    crawl_schedule:
      tier_1_docs: daily-02:30
      tier_2_blogs: daily-03:30
```

## Role lifecycle states

| State | Meaning | Enter via | Exit via |
|---|---|---|---|
| `active` | Available for mission assignment | Default | → paused / on-leave / retired |
| `paused` | Stopped; state preserved; resumable | CTO command | → active |
| `on-leave` | Extended pause (days+); not assigned | CTO command + duration | Auto-resume at end-date OR CTO command |
| `retired` | Removed from org chart | CTO command + PR | Re-instantiate via team-modifications |
| `dreaming` | Running dream-mode operations | Schedule | Auto-exit on window end |
| `consulting` | SME mid-consultation | Other role queries | Auto-exit on response |

## Pause vs leave — when to use each

- **Pause** — minutes to hours. State in memory. Resume picks up.
- **Leave** — days to weeks. State written to disk + unhooked from mission acceptance. Auto-resume requires end-date; CTO can resume early.

Naming helps you reason about the team. "Leave" isn't AI vacation; it's longer pause framed differently.

## Operations

| Operation | Command | Effect |
|---|---|---|
| `pause` | `@vp-eng pause @<role>` | Role → `paused`; no new assignments |
| `resume` | `@vp-eng resume @<role>` | Role → `active` |
| `leave` | `@vp-eng @<role> on leave until <date>` | Role → `on-leave`; auto-resume at date |
| `restart` | `@vp-eng restart @<role>` | Retire + re-create from template; full reset (use for stuck-after-soft-restart cases) |
| `schedule_update` | Edit `.forge/schedule.yaml` | Reload; affects business-hours behavior immediately |

## Anti-patterns

- **Default "always-on" schedule.** Default is business hours. Opt in to 24/7 deliberately.
- **Off-hours mission auto-acceptance.** Forbidden. 24-hour mode overrides hours only after CTO explicit accept.
- **"Sleep" as anthropomorphism.** Roles in off-hours aren't sleeping; they just aren't consuming tokens. Dream mode is the only named off-hours operation.
- **Pause without reason.** Every pause/leave records a reason in the decision ledger. "Don't need them right now" is acceptable; the ledger captures it.
- **Restart instead of pause.** Restart is destructive (loses state). Use only when state is corrupt or pause/resume cycle didn't recover.

## See also

- `engineering-context.md` §9 (operations) and §14 (lifecycle concepts)
- `FORGE_TEAM_OPERATIONS.md` §4 (full schedule spec)
- `team-modifications` — pause/leave/restart go through it
- `dream-mode` — runs in the dream-mode window
- `cto-inbox` — out-of-band schedule changes surface here
