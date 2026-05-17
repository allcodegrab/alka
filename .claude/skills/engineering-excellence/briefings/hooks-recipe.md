# Hooks recipe — deterministic ground-truth signals

Claude Code hooks fire on lifecycle events (`UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `SessionStart`, `PreCompact`, etc.) and run shell commands or HTTP calls or inline prompts. They are **configuration-layer**, not skill-layer — they always fire, regardless of which skills are loaded, and their stdout (for specific events) becomes additional context Claude can see.

This recipe gives the engineering-excellence suite the deterministic ground-truth signals that `prompt-buddy` Phase B and `verify-rigorously` rely on. Without these hooks, the suite still works; with them, every loop ends with hard evidence rather than self-report.

**Critical caveat repeated for clarity:** these hooks complement the skills, they don't replace AI judgment. They produce signals (test exit code, format diff, type errors). The skills decide what to do with them. The two together — deterministic hooks + AI orchestration — is what makes the suite meaningfully better than either alone.

## Where to install

- **`<repo>/.claude/settings.json`** — committed, team-shared. Use for hooks the whole team needs (auto-format, test-on-edit, dangerous-command block).
- **`<repo>/.claude/settings.local.json`** — gitignored, personal. Use for personal preferences (notifications, sounds).
- **`~/.claude/settings.json`** — user-global. Use sparingly; project hooks belong in the project.

Hook scripts go in `<repo>/.claude/hooks/` and are referenced via `$CLAUDE_PROJECT_DIR/.claude/hooks/<script>.sh` for portability across working directories.

## Recommended set (start here, add only what earns its place)

### 1. Auto-format on every edit (`PostToolUse`)

The buddy's Phase B should never flag style issues. Hook handles them deterministically.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read p; case \"$p\" in *.ts|*.tsx|*.js|*.jsx) npx prettier --write \"$p\" 2>/dev/null ;; *.py) ruff format \"$p\" 2>/dev/null && ruff check --fix \"$p\" 2>/dev/null ;; *.java) [ -f \"$p\" ] && google-java-format -i \"$p\" 2>/dev/null ;; esac; exit 0; }"
          }
        ]
      }
    ]
  }
}
```

Adapt the case statement to your project's language(s). The hook is fire-and-forget: it formats, doesn't block.

### 2. Type-check changed file (`PostToolUse`, source files only)

Ground-truth signal that Phase B reads. Type errors surface immediately.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read p; case \"$p\" in *.ts|*.tsx) npx tsc --noEmit 2>&1 | head -20 ;; *.py) mypy --strict \"$p\" 2>&1 | head -20 ;; *.java) [ -f mvnw ] && ./mvnw -q compile 2>&1 | head -20 ;; esac; exit 0; }"
          }
        ]
      }
    ]
  }
}
```

stdout from `PostToolUse` is debug-only by default, so this populates the debug log without bloating context. To surface failures into Claude's context, change to `"PreToolUse"` on the next operation, OR use the SubagentStop / Stop variants below.

### 3. Block dangerous bash (`PreToolUse`)

Deterministic safety check. Refuses destructive operations on production paths regardless of what the model "thinks".

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | python3 -c \"import re,sys; cmd=sys.stdin.read(); patterns=[r'\\brm\\s+.*-[a-z]*r[a-z]*f.*\\s+/', r'sudo\\s+rm', r'chmod\\s+777', r'git\\s+push.*--force.*(main|master|prod)', r'DROP\\s+(DATABASE|TABLE)', r'TRUNCATE\\s+TABLE.*production']; sys.exit(2 if any(re.search(p, cmd, re.IGNORECASE) for p in patterns) else 0)\""
          }
        ]
      }
    ]
  }
}
```

Exit 2 blocks the action and surfaces the message back to Claude. Tune the pattern list to your project's actual production-critical paths.

### 4. Force completeness on stop (`Stop`)

If the loop tries to end with TodoWrite items still `in_progress`, block the stop. This is the deterministic version of "honest done": the loop cannot self-report completion when its own tracker says otherwise.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.stop_hook_active' < /dev/stdin | python3 -c \"import json,sys; data=json.loads(open('$CLAUDE_TRANSCRIPT_PATH').read().strip().split('\\n')[-1]); todos=data.get('todos',[]); open_items=[t for t in todos if t.get('status')=='in_progress']; sys.exit(2 if open_items else 0)\" 2>/dev/null || exit 0"
          }
        ]
      }
    ]
  }
}
```

Note: this hook is best implemented as a custom script with full TodoWrite parsing. The shell version above is a sketch — invest in a proper Python script if you adopt this hook.

### 4.5. Repo safety net — block sensitive files on git/npm/docker outbound (`PreToolUse`)

The deterministic counterpart to the `repo-safety-net` skill. Refuses any `git add`, `git commit`, `git push`, `npm publish`, `npm pack`, `docker build`, or `docker push` that would ship sensitive files (`.env`, `*.key`, `*.pem`, `.claude/settings.local.json`, `.claude/missions/`, source maps, etc.).

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git add*|git commit*|git push*|npm publish*|npm pack*|docker build*|docker push*)",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/repo-safety-check.sh"
          }
        ]
      }
    ]
  }
}
```

Install the script:

```bash
mkdir -p .claude/hooks
cp repo-safety-net/templates/repo-safety-check.sh .claude/hooks/
chmod +x .claude/hooks/repo-safety-check.sh
```

The script reads the hook's stdin JSON, identifies the operation type (git add/commit/push, npm publish/pack, docker), runs the appropriate scan (staged files for git; `npm pack --dry-run` for npm), and exits 2 if any pattern matches the deny-list. The deny-list and allow-list are inside the script — version-controlled, project-scoped.

**Why this is hook-only and not skill-only:** the skill (`repo-safety-net`) provides AI-level judgment ("is this `.env.example` a legitimate exception?"); the hook provides deterministic enforcement ("regardless of what Claude thinks, this exact file pattern blocks the operation"). The two work together — the skill makes the judgment when there's nuance; the hook prevents ship-outward operations when there's a clear pattern match. Defense in depth.

This is the most important hook to install if your project ships outward (publishes packages, builds container images, pushes to public repos). The Anthropic Claude Code source leak (March 31, 2026) would have been prevented by an equivalent hook checking the npm package contents.

### 5. Inject `engineering-context.md §17` summary on sensitive prompts (`UserPromptSubmit`)

When the user prompt mentions auth / payments / production, automatically inject the §17 multi-agent thresholds into context, so the buddy and engineering-excellence both see them without re-reading the whole context file.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.user_prompt' | grep -iE '(auth|payment|production|migrat|prod\\b|secret|credential)' >/dev/null && cat $CLAUDE_PROJECT_DIR/engineering-context.md | sed -n '/^## §17/,/^---$/p' || true"
          }
        ]
      }
    ]
  }
}
```

stdout from `UserPromptSubmit` becomes additional context for Claude — the §17 section is now in scope for that turn, automatically.

### 6. SessionStart context priming (`SessionStart`)

When a session starts (or resumes after compaction), restore key context the model will need.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '## Session start context'; echo ''; echo '### Git status'; cd $CLAUDE_PROJECT_DIR && git status --short 2>/dev/null | head -10; echo ''; echo '### Recent journal entries'; tail -40 $CLAUDE_PROJECT_DIR/.claude/memory/journal.md 2>/dev/null; echo ''; echo '### Active tasks (working.md)'; cat $CLAUDE_PROJECT_DIR/.claude/memory/working.md 2>/dev/null | head -40"
          }
        ]
      }
    ]
  }
}
```

stdout becomes context. Keep total under ~2000 tokens. Use `head -N` aggressively.

## What NOT to put in hooks

- **AI judgment.** Hooks should produce signals (exit codes, structured output), not opinions. If you want AI judgment, use a skill or a subagent.
- **Long-running checks.** Hooks have a 60-second default timeout. Long test suites belong in the verify phase, not in a hook.
- **Hooks that depend on each other.** Hooks for the same event run in parallel; ordering is not guaranteed.
- **Hooks that touch production.** Local dev only. Hooks run with your user permissions and execute even in `--dangerously-skip-permissions` mode.

## Verifying hooks are working

```bash
# In Claude Code:
/hooks               # Interactive editor + lists currently-installed hooks
```

Run a noop tool call (like `Read` on a small file) and check that `PostToolUse` hooks fired in the debug log. If they didn't, the matcher syntax or the script path is wrong.

## How `prompt-buddy` Phase B reads these signals

In Phase B, the buddy looks for ground-truth artifacts produced during the loop:

- **Test results**: did `npm test` / `pytest` / `./mvnw test` actually run? With what exit code?
- **Type-check results**: was `tsc --noEmit` / `mypy` clean?
- **Auto-format**: was the diff formatted? (Yes if hook 1 is installed.)
- **Verification mission artifacts**: are there findings in `.claude/missions/<slug>/artifacts/`?

If these are present, Phase B has solid evidence. If they're missing — say tests didn't run — Phase B's `Ground-truth evidence` section reports `not run` honestly, and the recommendation is `extend with: run tests`.

This is why the hooks matter: they make the signals reliably present so the buddy doesn't have to guess.

## Adoption order (don't enable all at once)

1. **Hook 1 (auto-format)** — uncontroversial, immediate quality-of-life.
2. **Hook 4.5 (repo-safety-net) IF the project publishes outward** — npm package, public Docker image, public git repo. Documented leak risk; this hook is the deterministic floor under the `repo-safety-net` skill.
3. **Hook 2 (type-check)** — adds ground-truth without changing flow.
4. **Hook 6 (SessionStart context)** — improves session-resume; safe.
5. **Hook 3 (dangerous-bash block)** — once you've defined your project's production-critical patterns.
6. **Hook 5 (UserPromptSubmit injection)** — once the team is comfortable with §17 patterns.
7. **Hook 4 (Stop completeness gate)** — most invasive; adopt last after the rest are stable.

Each hook should earn its place. If a hook fires more often than it adds value, remove it. Hook fatigue degrades the system as much as hook absence.
