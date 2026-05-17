---
name: repo-safety-net
description: Prevent accidental commits or publishes of Claude artifacts (memory, missions, settings.local.json, hook scripts), local environment files (.env), and build outputs (source maps, backups). Use this skill at session start to verify the project's .gitignore and .npmignore have the recommended Claude-specific patterns, before any git add/commit/push to scan staged files for sensitive paths, and on any user prompt that mentions "publish", "release", "npm publish", "git push", or "share". Trigger this skill proactively when the user is about to perform an action that ships code outward (commit to a public repo, publish to a registry, push a Docker image), even if they didn't explicitly invoke it. The cost of a single missed file is documented in the wild — Anthropic itself leaked Claude Code's full 512,000-line source on March 31, 2026 from a single missing line in .npmignore. This skill exists because the failure mode is recurring and the fix is mechanical.
---

# Repo Safety Net

A defensive discipline that prevents Claude artifacts and other sensitive files from leaking via `git push`, `npm publish`, `docker push`, or any other ship-outward operation. The threat model is documented and recurring; this skill reduces the failure mode to mechanical checks.

## Why this exists

Multiple recent incidents make this non-optional:

- **March 31, 2026 — Anthropic's own Claude Code source leak.** A missing `*.map` line in `.npmignore` shipped 59.8 MB of source maps containing 512,000 lines of TypeScript across ~1,900 files. Within hours the code was mirrored, archived to GitHub, and rewritten in Python and Rust. Acknowledged by Anthropic engineering as plain developer error.
- **April 2026 — `.claude/` directory leaking API tokens in published npm packages.** Independent research showed teams shipping `.claude/settings.local.json` (which can contain API keys, hook scripts with hardcoded secrets, and personal preferences) inside their npm tarballs. Mitigation per the researchers: add `.claude/` to `.npmignore` AND `.gitignore`.
- **January 2026 — Claude Code reads `.env` despite `.gitignore`/`.claudeignore`.** Open GitHub issue marked HIGH PRIORITY; `.claudeignore` does not actually prevent Claude Code from reading the file. Defense-in-depth via the deny patterns in `settings.json` is more reliable.

The pattern across all three: **the AI tool is creating new categories of files developers don't have ingrained ignore-discipline for.** `.gitignore` patterns for `node_modules/` and `.env` are reflexive after years of pain. `.claude/`, `*.map`, `*.sourcemap`, `.claudeignore` itself, and personal-settings files are not yet reflexive — and the leak rate reflects that.

## When this skill triggers

**Proactive triggers (run without explicit invocation):**

- Session start, when a non-trivial task is about to begin, run a quick repo-hygiene check: are the recommended `.gitignore` and (if applicable) `.npmignore` patterns present?
- The user's prompt mentions any of: `publish`, `npm publish`, `release`, `git push`, `git add`, `git commit`, `share this repo`, `make this public`, `open source this`, `docker push`, `helm package`.
- Just before any tool call that performs a ship-outward action: run a final pre-flight scan.
- Files matching dangerous patterns appear in the diff or in tool input: `.env`, `.env.local`, `*.pem`, `*.key`, `id_rsa*`, `*.p12`, `settings.local.json`, `.claude/missions/*`, `.claude/sessions/*`, `*.map` files in non-build directories.

**Hard-skip triggers:**

- The user has explicitly said `"skip safety check"`, `"I know what I'm doing"`, or has just done a full check this session.
- The repository is private and the operation is local-only (commit to a personal feature branch with no remote).

## The three ignore files (one is not enough)

These are different files for different ecosystems. Confusing them is the most common mistake.

### `.gitignore` — what git ignores

Applies to `git add`, `git commit`, `git push`. Does NOT apply to `npm publish` (which ignores `.gitignore` entirely if `.npmignore` exists). Does NOT apply to `docker build` (which uses `.dockerignore`).

### `.npmignore` — what npm publishes

If absent, npm uses `.gitignore`. **If present, npm uses ONLY `.npmignore`.** This is exactly how Anthropic's source leak happened: their `.gitignore` was correct; their `.npmignore` was missing the `*.map` rule.

Critical: a `.npmignore` that exists but is INCOMPLETE is more dangerous than no `.npmignore` at all.

### `.dockerignore` — what Docker excludes from builds

Applies to `docker build` context. Without it, the entire repo (including `.git/`, `node_modules/`, `.claude/`, secrets) gets sent to the build daemon and may end up in the image.

## The recommended patterns

Templates are in `repo-safety-net/templates/`. Copy them into the project on first run, then audit periodically.

### Claude-specific patterns (apply to ALL three files)

```gitignore
# Claude Code — local/personal state (never commit)
.claude/settings.local.json
.claude/.local/
.claude/sessions/
.claude/missions/
.claude/agent-memory/
.claude/transcripts/

# Claude Code — generated tool outputs
.claudeignore.cache
.claude/.cache/
```

**What stays committed:** `.claude/skills/`, `.claude/agents/`, `.claude/commands/`, `.claude/settings.json` (the team-shared one), `.claude/memory/` (deliberately curated, team-shared knowledge — see `project-memory` skill).

**What never commits:** `settings.local.json` (personal hooks, possibly API keys), `.local/` (any local override), `sessions/` (Claude Code's session state), `missions/` (transient multi-agent work), `agent-memory/` (subagent persistent memory at `~/.claude/agent-memory/`), `transcripts/` (full conversation logs that may contain pasted secrets).

### Environment and credential patterns

```gitignore
# Environment files
.env
.env.*
!.env.example
!.env.template
*.env

# Credentials and keys
*.pem
*.key
*.p12
*.pfx
id_rsa
id_rsa.*
id_ed25519
id_ed25519.*
*.kdbx
secrets.json
credentials.json

# Cloud provider configs
.aws/credentials
.gcp/
.azure/
firebase-service-account*.json
```

### Build outputs that have leaked sources before

```gitignore
# Source maps (these caused the Claude Code leak)
*.map
*.js.map
*.css.map
*.sourcemap

# Editor / backup files
*.bak
*.orig
*.swp
*.swo
*~
.#*
\#*\#
.DS_Store
Thumbs.db
```

### `.npmignore`-specific additions (for npm packages)

```
# Tests should generally not ship
tests/
__tests__/
*.test.js
*.test.ts
*.spec.js
*.spec.ts

# Coverage reports
coverage/
.nyc_output/

# Dev tooling configs
.eslintrc*
.prettierrc*
.editorconfig
.vscode/
.idea/

# CI configs (rarely needed in published package)
.github/
.gitlab-ci.yml
.circleci/
azure-pipelines.yml
```

### `.dockerignore`-specific additions

```
# Dev dependencies that bloat image
node_modules/
.npm/
.yarn/
.pnpm-store/

# VCS
.git/
.gitignore
.gitattributes

# Claude artifacts (entire .claude/ — Docker doesn't need any of it)
.claude/

# Tests
tests/
__tests__/
coverage/

# Documentation that's not needed at runtime
docs/
README.md
CONTRIBUTING.md
*.md
!LICENSE.md

# Multi-stage build caches
.cache/
target/
build/
dist/
out/
```

## The verification protocol

### At session start (cheap, runs once)

1. Check `.gitignore` exists. If not, propose creating one from `templates/.gitignore`.
2. Check `.gitignore` contains the **must-have minimum**:
   - `.claude/settings.local.json`
   - `.env`
   - `*.key`, `*.pem`
3. If `package.json` exists and project publishes to npm, check `.npmignore` exists and contains `*.map`, `.claude/`.
4. If `Dockerfile` exists, check `.dockerignore` exists and contains `.claude/`, `.git/`.
5. Surface any gaps to the user with a one-line summary and the specific patterns to add. Do not block on this; just inform.

### Before any `git commit` or `git push`

Run a fast staged-file scan:

```bash
# Get the list of staged files
git diff --cached --name-only

# Check against danger patterns
git diff --cached --name-only | grep -E '\.(env(\.|$)|key$|pem$|p12$|sourcemap$|map$)|\.claude/(settings\.local|sessions|missions|transcripts|agent-memory)'
```

If any match, **stop and ask the user before proceeding.** Do not auto-unstage; the user might have a legitimate reason (rare). Show them the matched files and ask explicitly.

### Before any `npm publish` / `npm pack`

Run `npm pack --dry-run` and inspect the file list. Look specifically for:
- `*.map` files
- `.claude/` paths
- `.env` files
- Tests directories

If any are listed, stop. The published tarball will contain them.

### Periodic audit (manual or weekly)

```bash
# Find Claude artifacts already tracked by git (should be empty for the dangerous ones)
git ls-files | grep -E '\.claude/(settings\.local|sessions|missions|transcripts|agent-memory)'

# Find any committed .env-like files
git ls-files | grep -E '\.env$|\.env\.[^.]+$' | grep -v 'example\|template'

# Find any committed source maps in the repo
git ls-files | grep -E '\.map$'
```

If any return results, those are leaks already in the history. Removing them from HEAD doesn't remove them from history; use `git filter-repo` or BFG Repo-Cleaner to scrub, and assume any secret in those files is compromised (rotate it).

## Hook integration

The deterministic version of this discipline lives in Claude Code hooks. See `engineering-excellence/briefings/hooks-recipe.md` for the full recipe. The relevant hook for this skill:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git add*|git commit*|git push*|npm publish*|docker push*)",
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

The `repo-safety-check.sh` script does the staged-file scan above and exits 2 if it finds danger patterns. The hook is deterministic — no AI judgment, no false positives from creative interpretation.

## Anti-patterns this skill exists to prevent

- **Trusting `.claudeignore` alone.** The mechanism is documented as not fully effective; defense-in-depth via `.gitignore` + `.npmignore` + `.dockerignore` + `settings.json` deny patterns is needed.
- **Adding `.claude/` to `.gitignore` but not `.npmignore`.** The `.gitignore` rule means git won't track them, but if they were already committed before the rule was added, or if the npm package's `files` field in `package.json` includes a parent directory, the npm tarball may still contain them.
- **Auto-removing files the user staged.** This skill informs and asks; it does not silently unstage. The user might be intentionally publishing a sample `.env.example` (note the `!.env.example` allow pattern in templates).
- **Running this skill on every prompt.** It's gate-shaped: at session start, before publish-class operations, and on demand. Not continuous.
- **Treating this skill as "done" because the patterns are added.** New file types and new threat classes appear regularly. Run the periodic audit. Patterns added in 2024 won't catch tomorrow's incident class.

## Recovery if a leak has already happened

If `git ls-files` shows committed sensitive files:

1. **Treat the secret as compromised.** Rotate immediately — API keys, tokens, passwords. The file is in git history; removing it from HEAD doesn't help.
2. **Decide whether to scrub history.** If the repo is public and the leak is recent, scrub: `git filter-repo --path <file> --invert-paths`. Then force-push (warns collaborators). If the repo is private and you trust the access list, scrubbing may be optional.
3. **For npm leaks specifically:** the published tarball is permanently in npm's archive. Mitigation = unpublish (within 72 hours of publish, by Anthropic policy at the time of writing) and rotate. After 72 hours, you cannot fully unpublish; you can only deprecate.
4. **For source-map leaks:** the source is in the wild. There's no recovery; treat it as public.

## See also

- **`version-control-craft`** — the broader git discipline this skill protects.
- **`project-memory`** — explains what under `.claude/memory/` IS for committing (curated knowledge) vs what isn't (working state).
- **`engineering-excellence/briefings/hooks-recipe.md`** — deterministic ground-truth checks via hooks.
- **`templates/.gitignore`, `templates/.npmignore`, `templates/.dockerignore`** — the actual recommended files; copy these into the project on first use.
