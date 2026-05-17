# Anvil — Forge's Design System

> The design language for Forge. Modern, clean, compact, sharp.
>
> *Forge* is the editor. *Anvil* is the unmoving precise base it's built on.

---

## 1. Aesthetic Direction

**One sentence:** Industrial Precision — function-first, data-dense, monospace as personality, single signal accent, no decoration that doesn't earn its space.

**The bold commitment.** Most AI tools in 2026 look the same: dark background, purple-blue gradient, soft rounded cards, lots of empty space, Inter at 14px. Cursor 3 "Glass" leans into a *softer* aesthetic with rounded panels and gradient washes. Linear is restrained-dark with violet. Vercel/Geist is pure mono. Forge goes in a different direction.

Forge looks like a **machinist's CNC console** — every line is intentional, every pixel earns its place, the only color is the one that says *act now*. The metaphor is heat-shaped steel, not glowing neon. Density over breathing room. Sharp 1px borders over soft shadows. Monospace metadata everywhere because developers read code, not marketing copy.

**Inspiration set** *(study these, don't copy)*: Linear's restraint, Vercel's typographic discipline, Warp's block-grouped output, Zed's theme-token rigor, Bloomberg Terminal's information density, the original IA Writer's typography pride, Things 3's selection state, Raycast's keyboard-first command pattern.

**Anti-references** *(what we are not)*: any purple-blue gradient, any glassmorphism, any Apple Liquid Glass mimicry, any AI-startup landing page from 2024-2026, any "playful illustration" decorative empty state, any 16px+ rounded button.

---

## 2. Ten Design Principles

These override all token-level choices when they conflict.

1. **Density is a feature.** A developer at 14" 1080p should see 60+ lines of code with all panels open. Whitespace is paid for in lines lost. Use it when it buys legibility; never as decoration.
2. **One signal color.** *Forge Amber* (`#FF5C1F`) is reserved for "user, attend here." Active agents, primary CTAs, the one risk above threshold. Used in two states maximum: full saturation for attention, 60% for hover. Never used for branding, never used to "add visual interest."
3. **Sharp edges, hairline borders.** Radii: 0px / 4px / 6px / 8px. Nothing larger. Borders are 1px solid. Shadows exist only for floating overlays — and even then, a single 1px ring beats a 12px blur.
4. **Monospace is the personality font.** Anything that is data — file paths, costs, durations, model names, hashes, keyboard shortcuts, line numbers, hex colors, byte counts — is monospace. The UI's typographic rhythm comes from alternating between proportional UI text and monospace data, not from font weight variety.
5. **Keyboard-first, mouse-equal.** Every action visible in the UI has a keyboard shortcut shown next to it. Every panel can be opened, focused, and dismissed without leaving the home row.
6. **No motion without purpose.** Motion communicates state change (agent started, diff applied, error fired). It never decorates. Default duration 120ms; 180ms maximum. No bounce, no spring on UI chrome. Streaming agent output is the one place we use a steady cursor pulse.
7. **State first, decoration second.** A button reveals its hover, focus, active, disabled, loading, success, danger, and read-only states with the same care a Bloomberg Terminal applies to a P&L cell. Every state is testable and unambiguous.
8. **Diffs and counts are first-class typography.** `+12 -3` is a sentence in this design system. The minus is `--color-danger`, the plus is `--color-success`, both are monospace, and they sit at the same baseline. Treat numeric data as text, not as chart decoration.
9. **Sensitive surfaces look sensitive.** Anything irreversible (delete, force-push, run `terraform apply`, accept risky diff) wears a `--color-danger` border. Anything that touches real money (cost over threshold, billable cloud-agent run) wears Forge Amber and a confirmation. Sensitive intent is visible from across the room.
10. **The editor's content is more important than the editor.** When code is rendered, the editor chrome recedes. Borders thin. Status bar dims. The cursor is the only thing not desaturated. The same principle applies during agent runs: the diff stream is loud; the panel that holds it is quiet.

---

## 3. Design Tokens

All tokens are CSS custom properties. Token names use kebab-case prefix `--`.

### 3.1 Color — Forge Dark (default)

```css
/* surfaces — bottom to top of elevation stack */
--surface-canvas:        #0A0B0D;  /* editor background, app frame */
--surface-base:          #0E1014;  /* panel background */
--surface-raised:        #14171C;  /* card, popover, input bg */
--surface-overlay:       #1A1E25;  /* dropdown, command palette */
--surface-sunken:        #07080A;  /* code block background within UI */

/* borders — three weights only */
--border-subtle:         #1A1E25;  /* dividers between zones */
--border-default:        #262B33;  /* card outlines, input borders */
--border-strong:         #3A4049;  /* focused input, selected row */

/* text — four weights */
--text-primary:          #E8EAED;  /* default body and code */
--text-secondary:        #9CA3AF;  /* labels, metadata, descriptions */
--text-tertiary:         #6B7280;  /* timestamps, gutter, helper */
--text-disabled:         #4A5057;  /* disabled state */

/* signal — the only saturated color in chrome */
--accent:                #FF5C1F;  /* Forge Amber, full strength */
--accent-hover:          #FF7A45;  /* lighter, hovered */
--accent-active:         #E54A0F;  /* darker, pressed */
--accent-muted:          rgba(255, 92, 31, 0.12);  /* tint backgrounds */
--accent-on:             #0A0B0D;  /* text on Amber surfaces */

/* semantic — used only where meaning requires them */
--success:               #2EBD6F;  /* test pass, diff added, build green */
--success-muted:         rgba(46, 189, 111, 0.12);
--warning:               #E0A93B;  /* lint warn, cost approaching budget */
--warning-muted:         rgba(224, 169, 59, 0.12);
--danger:                #E5484D;  /* test fail, diff deleted, error */
--danger-muted:          rgba(229, 72, 77, 0.12);
--info:                  #4C8DFF;  /* info banners, agent thinking state */
--info-muted:            rgba(76, 141, 255, 0.12);

/* agent state colors — derived, used in mission control */
--agent-idle:            var(--text-tertiary);
--agent-planning:        var(--info);
--agent-running:         var(--accent);
--agent-blocked:         var(--warning);
--agent-success:         var(--success);
--agent-failed:          var(--danger);

/* diff colors — used in the gutter and ghost diff stream */
--diff-add-bg:           rgba(46, 189, 111, 0.10);
--diff-add-border:       var(--success);
--diff-del-bg:           rgba(229, 72, 77, 0.10);
--diff-del-border:       var(--danger);
--diff-mod-bg:           rgba(76, 141, 255, 0.10);
--diff-mod-border:       var(--info);

/* risk classifier — 5 stops, derived */
--risk-0:                var(--success);
--risk-1:                #B8C238;  /* yellow-green */
--risk-2:                var(--warning);
--risk-3:                #E07B3B;  /* orange */
--risk-4:                var(--danger);
```

### 3.2 Color — Forge Light (opt-in)

Same semantic mapping; inverted values. Defined here for tooling. Default is dark.

```css
--surface-canvas:        #FAFAF9;
--surface-base:          #FFFFFF;
--surface-raised:        #F4F4F2;
--surface-overlay:       #FFFFFF;
--surface-sunken:        #EFEFEC;
--border-subtle:         #ECECE8;
--border-default:        #D6D6D1;
--border-strong:         #A8A8A2;
--text-primary:          #0A0B0D;
--text-secondary:        #4A5057;
--text-tertiary:         #6B7280;
--text-disabled:         #A8A8A2;
/* signal and semantic colors keep their dark-mode hex values — they're calibrated to read on both surfaces */
```

### 3.3 Color — Forge High Contrast (accessibility)

WCAG 2.2 AAA. Pure black canvas, pure white text, no muted greys (use `--text-primary` for all text), accent shifts to `#FFB300` for higher contrast against pure white text on Amber buttons.

### 3.4 Typography

**Two families. No exceptions.**

```css
/* UI display + body — Satoshi (free, Fontshare) */
/* Distinctive geometric grotesque. Not Inter, not Geist. */
--font-sans: 'Satoshi', 'Söhne', 'Aktiv Grotesk', system-ui, sans-serif;

/* Code + metadata — Commit Mono (free) */
/* Sharper than JetBrains Mono, less playful than Berkeley, free. */
/* Fallback chain protects users who haven't loaded it. */
--font-mono: 'Commit Mono', 'Berkeley Mono', 'JetBrains Mono', ui-monospace, 'Menlo', monospace;
```

**The pairing rationale.** Satoshi's geometric letterforms read precisely at 13–18px and have distinctive characters (the `a`, the `g`, the `Q`) that prevent the system from looking like every other Inter-default product. Commit Mono is sharper and more vertical than JetBrains Mono, which lets metadata sit close to UI text without competing for visual weight. Both are free. Both are uncommon enough in 2026 dev tools that the system has a typographic signature.

**Type scale.** A geometric ratio (1.125 minor third) tightened toward small sizes.

| Token | Size | Line height | Letter spacing | Weight | Use |
|---|---|---|---|---|---|
| `--text-xs` | 10px | 12px (1.2) | +0.04em | 500 | gutter line numbers, keyboard shortcut badges |
| `--text-2xs` | 11px | 14px (1.27) | +0.02em | 500 | status bar, mission control timestamps |
| `--text-sm` | 12px | 16px (1.33) | +0.01em | 500 | secondary UI labels, breadcrumbs |
| `--text-base` | 13px | 18px (1.38) | 0 | 500 | default UI body |
| `--text-md` | 14px | 20px (1.43) | 0 | 500 | composer body, chat input |
| `--text-lg` | 16px | 22px (1.38) | -0.005em | 600 | section heads, dialog titles |
| `--text-xl` | 20px | 26px (1.30) | -0.01em | 600 | mission control names, pane titles |
| `--text-2xl` | 24px | 30px (1.25) | -0.015em | 700 | settings page headings |
| `--text-display` | 32px | 36px (1.13) | -0.02em | 700 | onboarding, marketing within app |

**Code typography is separate.**

```css
--code-size:        13px;
--code-line-height: 20px;        /* 1.54 — IDE convention */
--code-tracking:    0;
--code-weight:      400;          /* never bold code globally */
--code-font:        var(--font-mono);
```

**Numeric data styling.** Use `font-variant-numeric: tabular-nums` everywhere a number changes (cost meter, token counter, line counts, durations). This prevents the wobble that ruins data dashboards.

### 3.5 Spacing — 4px base grid

```css
--space-0:   0;
--space-px:  1px;
--space-0-5: 2px;
--space-1:   4px;
--space-1-5: 6px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
--space-20:  80px;
```

**Density rule.** Inside the editor chrome, prefer `--space-1` to `--space-3` between adjacent elements. Reserve `--space-4+` for *separation between zones*. In marketing surfaces and settings, the scale opens up; in chrome it stays tight.

### 3.6 Radius

```css
--radius-0:    0;       /* containers that touch zone edges */
--radius-sm:   4px;     /* inputs, buttons, badges, pills */
--radius-md:   6px;     /* cards, dropdowns, popovers */
--radius-lg:   8px;     /* modals, command palette */
/* Nothing larger exists. Pill buttons are forbidden. */
```

### 3.7 Borders

```css
--border-width:        1px;
--border-width-strong: 1.5px;     /* focus rings only */
```

Always 1px hairline. Focus rings step up to 1.5px and use `--border-strong` or `--accent` depending on focus type.

### 3.8 Shadows

Used sparingly — overlays only. Sharp design uses borders, not blur, for elevation.

```css
--shadow-pop:    0 1px 0 0 var(--border-default);                              /* button rest — simulates a hairline lift */
--shadow-menu:   0 8px 24px -4px rgba(0,0,0,0.4), 0 0 0 1px var(--border-default);
--shadow-modal:  0 24px 48px -12px rgba(0,0,0,0.6), 0 0 0 1px var(--border-default);
--shadow-focus:  0 0 0 2px var(--accent-muted), inset 0 0 0 1px var(--accent);
```

### 3.9 Motion

```css
--ease-out:      cubic-bezier(0.16, 1, 0.3, 1);     /* default */
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);    /* state changes */
--ease-linear:   linear;                             /* progress, streams */

--duration-instant: 80ms;     /* hover state */
--duration-fast:    120ms;    /* default */
--duration-base:    180ms;    /* panel reveal */
--duration-slow:    240ms;    /* modal in/out */
/* No motion is slower than 240ms in chrome. Agent diff streaming is content, not chrome. */
```

**Reduced-motion mode.** When `prefers-reduced-motion: reduce`, all chrome animations collapse to opacity-only with `--duration-instant`. The agent stream still streams text, but characters reveal instantly rather than typewritering.

### 3.10 Z-index scale

```css
--z-canvas:      0;
--z-elevated:    10;     /* sticky headers within scrollers */
--z-overlay:     100;    /* dropdowns, tooltips */
--z-popover:     200;    /* command palette */
--z-modal:       300;
--z-toast:       400;
--z-debug:       9999;
```

---

## 4. Layout — The Six-Zone Shell

```
┌──┬─────────┬─────────────────────────────┬───────────────────┐
│A │ B       │                             │                   │
│  │         │                             │                   │
│  │ Side    │     C — Editor              │   D — AI Surface  │
│  │ Panel   │                             │   (Composer /     │
│  │         │                             │    Chat /         │
│  │         │                             │    Mission peek)  │
│  │         │                             │                   │
│  │         │                             │                   │
│  │         │                             │                   │
├──┴─────────┴─────────────────────────────┴───────────────────┤
│ E — Status Bar                                                │
└───────────────────────────────────────────────────────────────┘
        F — Mission Control (overlay or full-screen, F3)
```

| Zone | Size | Purpose |
|---|---|---|
| **A — Activity Bar** | 44px fixed | Mode switcher: Explorer · Search · Source Control · Run · Agents · Skills · Marketplace · Settings |
| **B — Side Panel** | 240–320px, drag-resizable, collapsible | File tree / search results / agent list / skill picker depending on activity bar selection |
| **C — Editor** | flex, takes remaining width | Monaco. Multi-tab. Diff view, notebook view, image view as needed. |
| **D — AI Surface** | 360–520px, drag-resizable, collapsible (Cmd+I to toggle) | Composer, chat, mission peek, plan tabs |
| **E — Status Bar** | 24px fixed | Git status · LSP errors · cost meter · risk indicator · model selector · permission mode · TPS |
| **F — Mission Control** | full-screen overlay or split (F3) | Gantt swimlanes for parallel agents |

**Density modes.** Three settings affecting spacing inside chrome:

- `compact` — default. As described above.
- `comfortable` — increases all chrome paddings by `--space-1`. Used by 10% of users; mainly accessibility.
- `spacious` — increases by `--space-2`. Rare; for shared-screen pairing or demos.

The editor body itself never changes density (code is code).

---

## 5. Component Library

### 5.1 Primitives

#### Button

Three variants. No more. Pill shapes forbidden.

```
┌──────────────────┐
│  Primary  ⌘↵     │   bg: accent, text: accent-on, hover: accent-hover
└──────────────────┘
┌──────────────────┐
│  Secondary       │   bg: surface-raised, border: border-default, text: text-primary
└──────────────────┘
  Tertiary           text: text-secondary, hover: text-primary, no bg, no border (ghost)
```

| Token | Value |
|---|---|
| height-sm | 24px |
| height-md | 28px |
| height-lg | 32px |
| padding-x | `--space-3` (sm), `--space-3` (md), `--space-4` (lg) |
| radius | `--radius-sm` |
| font | `--font-sans`, `--text-sm` (sm/md), `--text-md` (lg), weight 600 |
| keyboard-hint | inline at right, mono, text-tertiary |
| icon | 14px (sm/md), 16px (lg), 1.5px stroke, gap `--space-2` |

States: rest, hover, active, focus (ring), disabled, loading (replaces label with `<Spinner />`), success-flash (200ms green border), danger.

**Danger variant.** Border becomes `--danger`, text stays `--text-primary`. Hover fills `--danger-muted`. Used for destructive actions only. Never as the visual style for "submit."

#### Input

```
┌──────────────────────────────┐
│ Label                        │   text-secondary, text-2xs, +0.02em, mono optional for technical fields
├──────────────────────────────┤
│ Value content                │   height 28px, padding-x space-3, font-mono if field accepts paths/keys/values
└──────────────────────────────┘
  Help text · 12px text-tertiary
```

States include `invalid` (border `--danger`, message below in `--danger`), `valid` (no border change; quiet), `read-only` (bg `--surface-sunken`, text `--text-secondary`).

**Path & code inputs are monospace.** This is consistent rule, not opt-in.

#### Select / Combobox

Native-looking, custom-implemented. Uses `--shadow-menu` for the dropdown. Keyboard-navigable. Filter-as-you-type by default.

#### Switch / Toggle

24px × 14px track, 10px thumb. `--accent` when on. No iOS-style oversized switches.

#### Checkbox / Radio

14px square. Sharp, not round. `--accent` when checked, with a 1.5px stroke checkmark.

#### Tabs

Underline-style only. No filled "pill" tabs. Active tab gets a 2px `--accent` underline on the inside edge. Inactive tabs: `--text-secondary`.

#### Badge / Pill

Used for: tags, file types, agent states, model names, skill names, keyboard shortcuts.

| Variant | Background | Text | Border |
|---|---|---|---|
| neutral | none | `--text-secondary` | `--border-default` |
| accent | `--accent-muted` | `--accent` | none |
| success | `--success-muted` | `--success` | none |
| warning | `--warning-muted` | `--warning` | none |
| danger | `--danger-muted` | `--danger` | none |
| mono | `--surface-sunken` | `--text-secondary` | `--border-default` (used for kbd) |

Height 18px (xs) or 20px (sm). Padding-x `--space-2`. Radius `--radius-sm`. Always monospace when content is data (file extension, hash, model id).

#### Tooltip

Single line preferred. `--surface-overlay` bg, `--border-default` border, 6px radius, `--text-sm`, max-width 240px. Delay 400ms in (250ms for keyboard focus); 0ms out. Shows the keyboard shortcut if one exists.

#### Toast / Notification

Bottom-right by default. 280px width. `--surface-overlay` bg, left edge 2px `--accent` (or semantic). Auto-dismiss 4s; never auto-dismisses if it contains an action.

#### Spinner / Progress

Two forms:
- **Spinner** — 12px or 16px, 1.5px stroke, rotates linearly at 1000ms. Used inside buttons during loading.
- **Progress bar** — 2px height, `--accent` fill on `--surface-sunken` track. Determinate by default; indeterminate variant is a 30%-wide shuttle moving left-to-right at 1200ms linear.

#### Divider

1px line, `--border-subtle`. Horizontal or vertical. Never thicker.

#### Keyboard hint (`<kbd>`)

A monospace pill: `--surface-raised` bg, `--border-default` border, `--text-xs`, 18px height, padding-x `--space-1-5`, radius `--radius-sm`. `⌘`, `⌥`, `⇧`, `⌃`, `↵`, `⌫` glyphs preferred over names.

### 5.2 Composite

#### Card

`--surface-raised` bg, `--border-default` border, `--radius-md`, padding `--space-4`. Cards never have shadows in default state. Hover over interactive cards adds a `--border-strong` border, no movement.

#### Panel

A card that takes a zone (Side Panel, AI Surface). Internal structure:

```
┌────────────────────────────────┐
│ Header   ← title + chips + ⋯   │  height 36px, border-bottom subtle
├────────────────────────────────┤
│                                │
│ Body (scrolls)                 │
│                                │
├────────────────────────────────┤
│ Footer (optional)              │  height 36px, border-top subtle
└────────────────────────────────┘
```

#### Command Palette (Cmd+K)

The single most-used UI surface besides the editor. Critical.

```
┌──────────────────────────────────────────────┐
│ ⌘  Type a command or paste a path…           │   text-md, monospace caret
├──────────────────────────────────────────────┤
│ AGENTS                                       │   text-2xs, secondary, uppercase, +0.06em
│  ▸ Run the test-author specialist on…   ⌥A   │   text-md, accent on hover
│  ▸ Spawn three implementers in parallel ⌥3   │
│  ▸ Promote local agent to cloud         ⌥↑   │
│ FILES                                        │
│  src/agent-runtime/orchestrator/plan.ts      │   monospace
│  …                                           │
└──────────────────────────────────────────────┘
```

- 540px wide, max 60vh tall, centered.
- `--shadow-modal`, `--radius-lg`.
- Section headers `--text-2xs`, uppercase, `+0.06em` tracking, `--text-secondary`.
- Results have an icon (14px), label, optional path, keyboard hint right-aligned.
- Active row gets `--accent-muted` bg and `--text-primary` text. No bold on active — selection is color-only.
- Fuzzy matching highlights matched characters with `--accent` (no background).

#### Diff view

Side-by-side in the editor; ghost-overlay during agent streaming. Both share token usage.

```
  237      const room = new VoiceRoom();          │  237      const room = new VoiceRoom(source);
  238    + room.source = 'sip_video_call';        │  238      // source-passing handled in constructor
  239                                              │  239
```

- Line numbers: `--text-tertiary`, `--text-xs` mono.
- Added: `--diff-add-bg` 4px left border `--diff-add-border`.
- Deleted: `--diff-del-bg` 4px left border `--diff-del-border`.
- Modified runs within a line: subtle background tint, no character-level highlight unless explicitly toggled.
- Hunk header: monospace 12px, `--text-secondary`, with hunk number badge (`Hunk 3 of 7`) clickable for jump.

#### Modal / Dialog

Centered, max-width 480px (confirmation) or 720px (form). `--shadow-modal`, `--radius-lg`. Backdrop is `rgba(0,0,0,0.5)` — *not* a blur. Sharp = no blur on backdrops.

Confirmation modals always have the primary action on the right; danger confirmations have the danger button on the right, secondary on the left, and the danger button label restates the action (`Delete 3 files`, not `Confirm`).

### 5.3 AI-native components

These are the differentiators. Designed from scratch for Forge.

#### Agent Card

Used in the Agents activity panel and in Mission Control swimlane headers.

```
┌────────────────────────────────────────────────────┐
│ ● Implementer                          $0.18  4m12s│  ← state dot, name, cost, duration
│   sonnet-4-6 · packages/skill-loader              │  ← model, scope (text-secondary, mono for scope)
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 63%                  │  ← progress bar inside card
│ Writing manifest.test.ts                          │  ← current action, italic, text-secondary
└────────────────────────────────────────────────────┘
```

- State dot: 6px circle, `--agent-{state}` color, pulses (opacity 0.4 ↔ 1.0, 1200ms) when running.
- Name: `--text-md`, weight 600.
- Cost: monospace, tabular-nums, `--text-secondary`. Turns `--warning` at 80% of budget; `--danger` over.
- Progress bar: 2px height; absent when state is `planning` or `blocked`.
- Action line: `--text-sm` italic — italic distinguishes "what the agent is currently doing" from "what the agent said."
- Hover: full border `--border-strong`. Click: opens that agent's transcript in the AI Surface.

#### Mission Swimlane (Mission Control)

The signature view. Renders parallel agents on a horizontal time axis.

```
TIME →   0:00            1:00            2:00            3:00            4:00            5:00
        ┌───────────────────────────────────────────────────────────────────────────────────┐
ORCH    │ ████ plan ──→ fanout ─────────────────────────────────────→ critique → merge ████│
        ├───────────────────────────────────────────────────────────────────────────────────┤
IMPL-A  │      ████████ skill-loader: write manifest.ts ─────────────────→ ✓               │
        ├───────────────────────────────────────────────────────────────────────────────────┤
IMPL-B  │      ████████ skill-loader: write index.ts ────→ ⚠ critic-reject ── retry ─→ ✓   │
        ├───────────────────────────────────────────────────────────────────────────────────┤
TESTS   │              ████████ vitest run ──────────────────────────→ ✓                  │
        ├───────────────────────────────────────────────────────────────────────────────────┤
CRITIC  │                                              █ scan ✓  █ scan ✓                  │
        └───────────────────────────────────────────────────────────────────────────────────┘
```

- One row per agent. Row height 36px, padding `--space-2` vertical.
- Time axis: ticks at meaningful intervals; auto-scrolls left as session extends past visible window.
- Run bar: `--agent-running` color, `--radius-sm`, height 16px, centered in row. Hover reveals tooltip with first 60 chars of current action.
- Branching: when an agent retries (critic-reject loop), a second bar starts after the failure marker; both are connected by a thin 1px `--border-subtle` line.
- Success marker: 8px `✓` in `--success`, at the right end of the bar.
- Failure marker: 8px `⚠` in `--danger`.
- Click a bar: opens that span's transcript. Right-click: copy transcript / fork session / promote to cloud.

#### Ghost Diff Stream

The agent's diff appears live in the editor, in the gutter and as inline ghost text, while it's being written.

- The agent's intended insertion appears in `--text-tertiary` (so it reads as "not yet committed") with a 1px blinking cursor in `--accent` at the write head.
- A `--diff-add-bg` background fills behind the line as soon as the line break commits.
- A 2px `--accent` left border marks every line currently being written (separate from the diff gutter's `--success` border for completed lines).
- After 200ms of no new tokens, the ghost text "settles" to full `--text-primary` and the cursor disappears.
- Reject hunk: `Cmd+Backspace`. Hunk dissolves with opacity 1 → 0 over 120ms.

This is the editor's most expensive visual moment. It's the one place we permit a small animation — because it communicates *the agent is writing right now*.

#### Cost Meter

Status-bar component, expandable.

```
collapsed:   $  0.42                          (monospace, tabular)
hover:       $  0.42 / $5.00  ▢▢▢▢▢▢▢▢▰▱     (3-stop bar, last stop is budget)
```

- Always-visible at right of status bar.
- Text turns `--warning` at 80% of session budget, `--danger` at 100% (a hook may pause the session at threshold).
- Click: opens cost breakdown popover — per agent, per model, per tool. Sortable.

#### Risk Classifier Indicator

Status-bar component, shows risk of the *currently proposed* tool call.

```
   RISK  ▮▯▯▯▯  LOW
   RISK  ▮▮▮▯▯  MED
   RISK  ▮▮▮▮▮  HIGH        ← border turns danger, requires Cmd+Y to approve
```

- 5-bar dot-matrix style; bars fill with the appropriate `--risk-N` color.
- Label is monospace, uppercase, `--text-xs`, `+0.06em`.
- When `HIGH`, the entire status bar gains a 1px `--danger` top border until the call is approved or rejected.

#### Skill Pill

Used in the composer to indicate "this skill will be applied to this turn."

```
[ ⚒ spring-boot-controller  ]    ← prefix glyph (skill-type indicator), name, dismiss × on hover
```

- `--accent-muted` bg, `--accent` text, `--radius-sm`, height 22px, padding-x `--space-2`.
- Glyph 12px, 1.5px stroke. Glyph differs by skill type: `⚒` codegen, `🔍` review, `✦` codemod, `□` template (these are visual placeholders; the actual glyphs come from the icon library, not emoji).
- Dismissable. Click pill to view skill source.

#### Permission Mode Switcher

Status-bar segmented control.

```
[ MANUAL │ SUGGEST │ APPROVE │ AUTO │ SAND │ TREE │ YOLO ]
                              ▔▔▔▔
```

- 7 segments, each `--text-2xs` uppercase, padding-x `--space-2`.
- Active segment gets `--accent-muted` bg, `--accent` text, `--accent` 1px bottom border.
- YOLO segment border is dashed `--danger`. Cannot be activated without a typed confirmation (`type "YOLO"`).

#### Capability Graph Pill Picker

When a subagent spawns, the orchestrator shows the K capabilities it provisioned for that subagent. Surface for transparency and trust-building.

```
Provisioned for @implementer-B:
[ Read ] [ Write ] [ Edit ] [ Glob ] [ Bash:test ] [ MCP:github:create_pr ] [ Skill:write-pr ]   +2 more
```

- Each is a monospace pill: `--surface-sunken` bg, `--border-default` border, `--text-xs`.
- Hover: pill tooltip shows the tool's full schema.

#### Critic Verdict Block

Inline in the agent transcript when a critic verdicts a diff.

```
┌───────────────────────────────────────────────────────────┐
│ CRITIC                                            REJECTED│   warning border, monospace label
│ tsc: 2 errors                                             │   text-mono small
│  · TS2322 Type 'string' is not assignable to type 'Skill' │
│  · TS2532 Object is possibly 'undefined'                  │
│ vitest: 1 failing                                         │
│  · src/skill-loader/manifest.test.ts > rejects unsigned  │
│ Sending back to implementer with structured feedback.     │   text-sm italic, text-secondary
└───────────────────────────────────────────────────────────┘
```

- Border: `--warning` for `REJECTED`, `--success` for `APPROVED`.
- Header monospace, uppercase, `+0.04em` tracking.
- Findings monospace, bullet character is `·` (middot), not `•`.

#### Best-of-N Comparison

When a tournament/best-of-N run completes, candidates render side-by-side.

```
┌─────────────────┬─────────────────┬─────────────────┐
│ A · opus       │ B · sonnet      │ C · opus, t=0.9 │
│ 318 LOC · 4.2s │ 290 LOC · 3.1s  │ 322 LOC · 4.0s  │
│ ✓ tests        │ ✓ tests          │ ✗ tests          │
│ ✓ lint         │ ⚠ 1 warning     │ ✓ lint           │
│ $0.42          │ $0.18           │ $0.39           │
│ [ Select ]      │ [ Select ]       │ [ Select ]       │
└─────────────────┴─────────────────┴─────────────────┘
```

- Three (or N) cards. Card border becomes `--accent` on the recommended candidate (by critic verdict).
- All metrics monospace.
- "Select" applies that candidate's worktree.

---

## 6. Iconography

**Library:** Lucide as primary; custom for AI-specific glyphs (agent, skill, capability, mission).

**Style rules:**
- 1.5px stroke, never filled (except: state dot indicators, which are filled circles).
- Three sizes: 12px, 14px, 16px. Nothing else in chrome.
- Icons inherit `currentColor`. Never hardcoded.
- A label next to an icon is preferred. Icon-only buttons exist only in the activity bar and in tight toolbars; both have tooltips with shortcuts.

**Custom Forge glyphs** (live in `packages/icons/`):
- `agent` — three-stacked-dots arrangement, monospace-aligned
- `agent-running` — `agent` with the bottom-right dot enlarged
- `skill` — a struck-anvil silhouette
- `capability` — a chevron-bracketed brace
- `mission` — overlapping rectangles representing parallel lanes
- `critic` — a magnifier with a tick
- `worktree` — a forked-branch graph
- `forge` (brand) — a single chevron-strike

---

## 7. Editor Theme (Monaco token theme)

The code coloring inside the editor. Calibrated against the chrome.

| Token | Color | Notes |
|---|---|---|
| editor.background | `#0A0B0D` | matches `--surface-canvas` |
| editor.foreground | `#E8EAED` | matches `--text-primary` |
| editor.lineHighlight | `rgba(255, 255, 255, 0.03)` | very subtle |
| editorLineNumber | `#4A5057` | matches `--text-disabled` |
| editorLineNumber.active | `#9CA3AF` | matches `--text-secondary` |
| editor.selectionBackground | `rgba(255, 92, 31, 0.20)` | accent-tinted |
| editor.findMatchHighlight | `rgba(255, 92, 31, 0.30)` | accent-tinted |
| editorBracketHighlight.foreground1 | `#B8C238` | calm yellow-green |
| editorBracketHighlight.foreground2 | `#4C8DFF` | info blue |
| editorBracketHighlight.foreground3 | `#E07B3B` | warning-orange |
| editorCursor.foreground | `#FF5C1F` | accent |
| **Syntax** | | |
| keyword | `#E07B3B` | desaturated orange |
| string | `#B8C238` | yellow-green |
| number | `#4C8DFF` | info |
| comment | `#6B7280` italic | text-tertiary |
| function | `#E8EAED` | primary — functions are the protagonists |
| type | `#A8D4FF` | soft cyan |
| variable | `#E8EAED` | |
| operator | `#9CA3AF` | secondary |
| punctuation | `#6B7280` | tertiary |

**Principle:** functions and identifiers stay near-white (the protagonists of code); keywords are warm; numbers and types are cool. The accent (`#FF5C1F`) is reserved for the cursor and selection — never used for syntax.

---

## 8. Patterns

### 8.1 Streaming agent output

- New chunks fade in over `--duration-fast` from `--text-tertiary` to `--text-primary`.
- The current write-head cursor is a 1px `--accent` bar pulsing 0.3 ↔ 1.0 opacity at 800ms.
- Long-running streams show an idle indicator after 2s of no tokens: `--text-tertiary` italic "Thinking…" — *no* spinner.
- Tool call announcements appear as inline monospace blocks: `→ Read src/skill-loader/manifest.ts` (`--text-secondary`).

### 8.2 Error display

- Inline at the source. Never in a separate console unless the user opens one.
- Border-left 2px `--danger`, padding-left `--space-3`, mono, `--text-sm`.
- Show file:line:col as a monospace link when applicable. Click jumps the editor.

### 8.3 Empty states

No illustrations. Ever. An empty file tree shows: nothing. An empty agent list shows: a single line of monospace help text plus the keyboard shortcut to start one. An empty inbox shows: zero state with a single `Cmd+K` hint.

### 8.4 Loading

Three patterns:
- **Optimistic** — render the destination immediately; don't show loading. Default for navigation.
- **Skeleton** — used only when the structure is known but content isn't (file tree on cold open). Skeletons are flat `--surface-raised` rectangles; no shimmer, no pulse. Sharp.
- **Inline spinner** — used in buttons during destructive or expensive actions.

### 8.5 Notifications & confirmations

- Reversible actions: no confirmation, but show a 4-second toast with `Undo (⌘Z)`.
- Destructive but recoverable (file delete, branch delete): one-step modal, primary action labels the action (`Delete 3 files`).
- Irreversible (force-push, prod deploy, `terraform apply`): two-step — type the verb to confirm.

### 8.6 Onboarding

Single page, no carousel. Three blocks: connect a model provider (BYOK), open a folder, run a sample agent. Each block is a card with a checkbox-style completion marker. The whole onboarding finishes in under 60 seconds.

---

## 9. Accessibility

**Hard rules.**

- All chrome text meets WCAG 2.2 AA at minimum. The `--text-tertiary` token is the lower bound; anything dimmer is non-text decoration.
- Focus indicators are visible on every interactive element. Never `outline: none` without a replacement.
- Keyboard navigation is complete — every action reachable without mouse. Tab order is left-to-right, top-to-bottom, with explicit `tabindex` only when DOM order can't honor visual order.
- All icons have `aria-label` when they carry meaning; `aria-hidden="true"` when decorative next to a text label.
- Color is never the only signal. Risk classifier pairs color with a 5-bar dot-matrix and a text label. Diff colors pair with `+`/`−` glyphs in the gutter.
- High Contrast theme available with a single toggle. AAA contrast throughout.
- Reduced motion respected via `prefers-reduced-motion`.

**Screen reader semantics.**

- Agent transcripts announce as `region role="log" aria-live="polite"`.
- Critic verdicts announce as `region role="status"` for `APPROVED`, `role="alert"` for `REJECTED`.
- The cost meter is `role="status"` with `aria-label` describing the dollar amount.
- The risk classifier is `role="status"` with `aria-label` and announces only when the level changes.

---

## 10. Voice & Tone

The product's voice is part of the design system. Every label and message follows.

**Principles.**

1. **Direct, not chatty.** "Apply diff" not "Would you like to apply this diff?"
2. **Concrete, not abstract.** "3 files changed, 47 lines added" not "Some changes were made."
3. **Naming is engineering.** Never say "AI." Always say what specifically: "the implementer," "Sonnet 4.6," "your `spring-boot-controller` skill."
4. **No exclamation marks.** None. Not in success states. Not in onboarding. Forge is a precision instrument.
5. **No emoji in chrome.** Inside agent transcripts where users paste content with emoji, fine. In the system's own copy, never.
6. **Error messages name the cause and offer a next step.** Bad: "Something went wrong." Good: "The github MCP server returned 401. Re-authenticate in Settings → MCP, or run `forge mcp auth github`."
7. **Confidence calibration.** When the system is uncertain, say so. "The implementer believes this is complete; the critic has not yet verified." Don't say "Done!" before the critic agrees.
8. **Don't apologize for refusing.** When the permission system blocks something, state what was blocked and why. Don't say "I'm sorry, I can't do that."

**Glossary discipline.** The same word means the same thing across the product. *Run* is a single agent execution. *Mission* is a multi-agent session with a goal. *Skill* is a `SKILL.md` artifact. *Capability* is a tool exposed via MCP, a built-in tool, or a skill. *Permission mode* is the session-wide permission setting. Words are not interchanged.

---

## 11. Implementation Notes

**CSS architecture.** Vanilla CSS custom properties + CSS Modules. No Tailwind in the editor (its utilities don't pay back complexity at this scale). Tailwind allowed in marketing and cloud admin React surfaces.

**Theming.** All themes share the same token *names*; only values differ. The user can switch themes without DOM reflows because no token names change. A theme is a single JSON file matching the Zed token schema (this gets us free interop with Zed themes for free distribution).

**Font loading.** Both fonts are bundled (woff2, variable where available), not loaded over network. The editor starts fully styled the moment the window mounts.

**Density mode** is a single class on `<body>`: `density-compact` / `density-comfortable` / `density-spacious`. CSS multiplies a `--density-scale` variable used in padding tokens.

**Token export.** Tokens publish as: CSS file, JSON file (Zed-compatible), Figma tokens plugin, and a TypeScript module with type-safe accessors (`tokens.color.accent.base`).

**Per-component CSS file lives next to the component.** Single source of truth: the design token reference and the component implementation share a directory.

---

## 12. What This Design Is Not

Stating the opposites explicitly so the system stays disciplined:

- Not glassmorphism. No blurred backdrops, no translucent panels.
- Not maximalist. No decorative gradients, no atmospheric noise textures.
- Not playful. No illustrated empty states, no celebratory animations, no character mascots.
- Not Apple-like. No oversized rounded corners, no large hero-style padding, no SF Pro.
- Not Cursor-like. No purple-blue gradients, no rounded panel chrome, no "agent" pet metaphors.
- Not Linear-like. We share their discipline; we don't share their violet, their sparse-by-default density, or their preference for shadow-elevation.
- Not Vercel-like. We respect Geist; we choose a different family because Geist is *the* 2026 Vercel ecosystem font and we're not in that ecosystem.

---

## 13. Open Questions

Items deliberately undecided, to be settled before Phase 1 ships:

- **Font licensing.** Satoshi is free under Fontshare's terms; verify embedding rights in a distributed Electron app. Fallback: Aktiv Grotesk (paid) or Söhne (paid, premium tier).
- **Brand mark.** No logo specified yet. The Forge glyph in §6 is a placeholder; the final mark belongs to brand work, not UI design system work.
- **Dual cursors.** When the user is typing alongside an agent stream, do we render two cursors? Decision: yes, but the agent cursor is `--accent` and the user cursor is `--text-primary`. Open question: do we mute the agent cursor while the user is actively typing?
- **Light theme parity.** Light theme is defined but unvalidated for the Mission Control swimlane component, which depends on a darker substrate for the agent run bars to read clearly. May require a separate "Light Studio" theme tweak.
- **Voice mode UI.** When push-to-talk is held (Ctrl+M), what surface appears? Current placeholder: a 240px-wide pill at the bottom-center of the AI Surface showing waveform + timer. Open: full-screen takeover for accessibility?

---

*Version 0.1 — May 16, 2026. Living document; update via PR with `design-tokens` label.*
