---
name: org-chart
description: Manages the engineering team as configuration-as-code. Reads `.forge/org-chart.yaml` at session start; generates `.claude/agents/*.md` files; verifies they're in sync; surfaces role-change diffs to the CTO. Triggers at session start (before any mission planning) and on any change to `org-chart.yaml`. The org chart is the single source of truth for the team's composition; this skill enforces that.
---

# Org Chart

The org chart is the team's composition, defined in YAML, tracked in git. This skill is the bridge between YAML and the runtime: it reads the YAML, generates the Claude Code custom subagent files, verifies they match, and surfaces drift.

## Why the org chart is configuration-as-code

Three reasons it earns the discipline:

1. **Changes are reviewable.** Adding a role is a PR. Removing a role is a PR. You can grep history for "when did we get @migrations-specialist?" and find the answer.
2. **Drift is impossible.** The YAML is the truth; the `.md` files are generated. They can't disagree because the generator is deterministic.
3. **Onboarding is fast.** When you open the project six months later, the team is documented in 60 lines of YAML. No need to read every `.md` file in `.claude/agents/`.

## When this skill triggers

- Session start (before mission planning): verify YAML and `.md` files are in sync; report drift if any.
- On `forge org-chart sync`: regenerate `.md` files from YAML.
- On `.forge/org-chart.yaml` save / commit: trigger regeneration + CI check.
- On §18 team-modifications operations that promote mission-scoped changes to persistent.

## Hard skip

- During an active mission: don't regenerate `.md` files. Wait until the mission closes. (Regenerating mid-mission could break a running specialist that has an open transcript.)
- For mission-scoped team modifications: those go in `team-delta.yaml`, not `org-chart.yaml`. This skill doesn't touch deltas.

## The org-chart.yaml schema

```yaml
version: 1
name: <project-name>
cto: <CTO ID>

# Role definitions
roles:
  - id: <role-id>                    # used as @<role-id> mention; must be unique
    title: <human-readable title>
    tier: leadership | planning | build | verify | release | knowledge
    reports_to: <role-id of supervisor; CTO is allowed for VP only>
    model: <claude-opus-4-7 | claude-sonnet-4-6 | gemini-2-5-pro | gpt-5-4>
    tools: [<allowed tools>]
    skills: [<preloaded skill names>]
    isolation: none | worktree | container | cloud
    max_turns: <integer; default 30>
    color: <UI hint: blue|purple|cyan|green|orange|pink|yellow|red|gold|teal|white>
    can_approve: [<list of action types this role can approve without CTO>]
    must_escalate: [<list of action types that require CTO>]
    schedule: always-on | business-hours | on-demand | idle-time-only

# Policies (cross-role rules; enforced at generation time)
policies:
  - id: <policy-id>
    applies_to: <pattern, e.g., "impl-*" or "*-verifier">
    rule: <YAML expression of the constraint>

# Generation metadata
generated:
  agents_directory: .claude/agents
  last_sync: <ISO timestamp>          # auto-updated by the sync command
```

## What the generator produces

For each role, a `.claude/agents/<role-id>.md` file:

```markdown
---
name: <role-id>
description: <generated from role metadata; describes when this subagent applies>
tools: <from YAML>
disallowedTools: <derived from policies; e.g., verifiers get [Edit, Write, Bash]>
model: <from YAML>
skills: <from YAML, comma-separated>
maxTurns: <from YAML>
permissionMode: <derived; default for orchestrator, acceptEdits for impl, default for verifiers>
isolation: <from YAML>
color: <from YAML>
memory: project
---

<Role-specific instructions: pulled from role-templates/<tier>/<role-id>.md.tpl
if a template exists, else from a default template per tier.>
```

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `verify` | Session start | Compare YAML to `.md` files; report drift |
| `sync` | `forge org-chart sync` | Regenerate all `.md` files |
| `diff` | `forge org-chart diff` | Show YAML changes since last commit |
| `validate` | Pre-commit hook | Reject invalid YAML (missing fields, invalid models, policy violations) |

## Policies enforced at generation time

The schema supports `policies` that constrain how `.md` files are generated. Examples in your org chart:

```yaml
policies:
  - id: orchestrator-no-edit-tools
    applies_to: vp-engineering
    rule: "tools intersect [Edit, Write, Bash] must be empty"

  - id: verifier-read-only
    applies_to: "*-verifier"
    rule: "disallowedTools must include [Edit, Write]; Bash allowed only for perf/tests"

  - id: pr-reviewer-uses-gemini
    applies_to: pr-reviewer
    rule: "model must be gemini-2-5-pro"

  - id: implementers-worktree-isolated
    applies_to: "impl-*"
    rule: "isolation must be worktree"

  - id: sme-read-only
    applies_to: "sme-*"
    rule: "disallowedTools must include [Edit, Write, Bash]; cannot participate in missions"
```

If a YAML edit violates a policy, the validator rejects it. Policies are git-tracked; weakening one is a deliberate change with a PR review.

## When the YAML drifts from the agents directory

Possible causes:
- Manual edit to a `.md` file (forbidden — should always come from YAML)
- Failed sync (partial generation)
- Out-of-band tooling that modified an agent file

Drift handling:
- Verify-time: log to journal; emit CTO inbox item if blocking the session start
- Sync-time: regenerate everything; lost edits to `.md` files are reported but discarded (the YAML is the truth)

## Anti-patterns

- **Editing `.md` files directly.** They're generated; manual edits will be overwritten. If you want a permanent role change, edit the YAML.
- **Bypassing the validator.** Don't add roles that violate policies (e.g., giving the orchestrator `Edit` tools "just this once"). The policies exist because of production-tested failure modes.
- **Removing the YAML and relying on `.md` files.** The `.md` files are the runtime; the YAML is the truth. Without YAML, six-month-later debugging is "what did this role look like in May?"
- **Versioning the org chart in a non-git location.** The YAML lives in `.forge/org-chart.yaml` and is committed.

## See also

- `team-modifications` — manages mission-scoped deltas to this chart
- `FORGE_TEAM_MODE.md` §5 (the role roster) and §6 (skills per role)
- `engineering-context.md` §14 (Org Chart concept) and §16 (Agents directory)
