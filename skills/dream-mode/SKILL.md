---
name: dream-mode
description: Scheduled off-hours batch processing. NOT "the agents reflect on the day" — concrete operations only that produce artifacts. Operations include KG rebuild + optimization, embedding cache pre-warm, journal weekly digest, decision-ledger compaction, continuous-learning crawl, SME knowledge refresh, grounded re-verification, mission post-mortems. Cannot edit source code. Cannot push to git. Cannot deploy. Cannot mutate external services. Reads/writes only inside `.claude/`. Window configurable in `.forge/schedule.yaml`; default 02:00-06:00 weekday.
---

# Dream Mode

Scheduled off-hours processing. Concrete operations only. The team isn't running missions; it's consolidating, optimizing, pre-computing for tomorrow.

## Why this exists, and what it deliberately is not

Three reasons dream mode earns the build cost:

1. **KG and cache freshness.** Without dream mode, the first mission of the day pays cold-cache cost. With it, morning's mission starts warm.
2. **Pattern consolidation.** Journal entries accumulate; without consolidation, they bury insights. Dream mode produces digests and convention-promotion proposals you can skim.
3. **Skill currency.** Without continuous learning, skills age. Dream mode catches drift weekly.

**Dream mode is NOT:**
- "The agents reflect on the day." No free-form introspection.
- "The agents practice for tomorrow." No speculative implementation.
- "The agents argue about past decisions." No re-litigation.

This skill exists precisely because "dream mode" sounds like it should do all those things — and that's where multi-agent designs go wrong (the reflection-poisoning trap from `prompt-buddy/SKILL.md`).

## When this skill triggers

- Scheduled (per `.forge/schedule.yaml` dream-mode window; default 02:00-06:00 weekday)
- Maintenance windows
- Manual `forge dream` command (rare)

## Hard skip

- Active mission in flight (dream mode never preempts an active mission)
- Within 30 min of a scheduled mission start (don't compete for resources)
- If last dream cycle ended <2 hours ago (avoid back-to-back cycles)

## Operations during a dream cycle

| Operation | Owner | Output |
|---|---|---|
| KG rebuild + optimization | knowledge-graph engine | Rebuilt graph in memory; durable files unchanged |
| Embedding cache pre-warm | knowledge-graph engine | Top-1000 anticipated queries cached |
| Journal weekly digest (Friday-Saturday night) | dream-mode | `.claude/digests/journal-week-<W>.md` |
| Decision ledger compaction | decision-ledger | Adds `supersedes` edges; rewrites no entries |
| Conventions promotion review | dream-mode | Proposals to promote stable journal patterns |
| Continuous learning crawl | continuous-learning | Skill-update proposals |
| SME knowledge refresh | sme-* roles | Each SME crawls Tier 1-2 in its domain |
| Test re-run on production-critical paths | grounded-reverification | Regression report |
| Mission post-mortems (failed missions only) | meditation | Per-mission meditations |

## What dream mode is NOT ALLOWED to do

Hardcoded by tool allowlist. The role running dream mode has:

- ❌ `Edit`, `Write` to `packages/**`, `cloud/**`, `native/**` (no source code edits)
- ❌ `Bash` to `git push`, `gh release`, `kubectl apply` (no deployments)
- ❌ Notion/JIRA/GitHub MCP writes (read-only on external services)
- ✅ `Edit`, `Write` to `.claude/**` (digests, proposals, ledger compaction)
- ✅ Read everywhere
- ✅ Internal computation (graph rebuild, embedding generation)

If a future cycle proposes doing something dream mode is forbidden from, that's a CTO Inbox item — not a silent expansion.

## Dream cycle artifact

Every cycle writes `.claude/dreams/<YYYY-MM-DD>.md`:

```markdown
# Dream Cycle — 2026-05-20

Window: 02:00-06:00 EDT
Duration: 3h 12m
Cost: $4.20

## Operations completed
- ✓ KG rebuild (2.1s; 134,287 nodes; 412,033 edges)
- ✓ Embedding cache pre-warm (1,000 queries; 14s)
- ✓ Decision ledger compaction (3 supersedes edges added)
- ✓ Continuous learning crawl (7 sources; 1 proposal generated)
- ✓ SME knowledge refresh (5 SMEs; 4 produced notes)
- ✓ Grounded re-verification (production-critical paths; all green)
- ⚠ Mission post-mortem: skill-loader-refactor (passed; slice-7 costly;
    meditation produced 1 proposal)

## Proposals generated
1. learning/proposals/2026-05-20/typescript-error-handling.md (HIGH leverage)
2. meditations/skill-loader-refactor.md (proposal: spin up @crypto-specialist
   permanently)

## Anomalies
- No code changes since 2026-05-19 (expected — Sunday)
- @sme-mongodb-firestore produced no notes (no MongoDB changes — fine)

## Next cycle: 2026-05-21 02:00 EDT
```

## Configuration

In `.forge/schedule.yaml`:

```yaml
dream_mode_window:
  weekday: "02:00-06:00"
  weekend: "anytime"

dream_mode_operations:
  enabled:
    - kg_rebuild
    - embedding_prewarm
    - journal_digest        # Friday-Saturday only
    - ledger_compaction
    - convention_promotion_review
    - continuous_learning
    - sme_knowledge_refresh
    - grounded_reverification
    - mission_post_mortems   # only for failed missions
  disabled: []

cost_cap_per_cycle_usd: 8
max_duration_hours: 4
```

## Operations table

| Operation | Triggered by | Effect |
|---|---|---|
| `start_cycle` | Schedule | Mark `dreaming` state; lock dream operations |
| `run_operation` | Each operation in `enabled:` list | Execute; capture artifact |
| `write_cycle_summary` | End of cycle | Produce `dreams/<date>.md` |
| `end_cycle` | All operations complete OR window end | Release `dreaming` state |
| `cost_cap_hit` | Mid-cycle cost monitor | Pause remaining operations; log; emit CTO Inbox if >50% remaining |

## Anti-patterns

- **Continuous dreaming.** Schedule-anchored only. Once-per-window.
- **Dream mode that "thinks."** Every operation is a defined, artifact-producing function. No free-form introspection.
- **Dream mode touching source code.** Forbidden by tool allowlist.
- **Dream mode deploying.** Forbidden.
- **Cycles that produce no artifacts.** A successful cycle produces at least the cycle summary. If no operations actually completed, log "skipped: no work needed" — don't pretend.
- **Dream mode dependent on agent judgment.** Each operation is procedural. The agent applies the procedure; it doesn't decide whether to apply it.

## See also

- `engineering-context.md` §14 (Dream Mode concept; off-hours discipline)
- `FORGE_TEAM_OPERATIONS.md` §7 (full dream mode spec)
- `work-schedule` — defines the window
- `knowledge-graph` — KG rebuild operation
- `continuous-learning` — runs inside dream mode
- `grounded-reverification` — runs inside dream mode
- `meditation` — produces post-mortem artifacts during dream mode
- `sme-network` — SME refreshes run during dream mode
