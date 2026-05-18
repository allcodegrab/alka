---
name: knowledge-graph
description: Builds and maintains the project's typed entity-relationship knowledge graph (files, symbols, decisions, tickets, PRs, conventions, missions, findings, SME knowledge). Provides the `forge.knowledge.query()` tool that every role calls when seeking context. Triggers at session start (cold rebuild), on file save (incremental update), on commit (graph snapshot), on mission close (lessons absorbed), and on SME crawl (knowledge subgraph update). The structural backbone of the universal memory system.
---

# Knowledge Graph

A typed entity-relationship view of the project, in-memory (petgraph in Rust), rebuilt from durable sources on project open. Combined with BM25 (tantivy) and dense embeddings (Voyage 3-Large) for hybrid retrieval.

## Why the graph exists alongside embeddings

Three things pure embeddings can't do for code:

1. **Exact symbol match.** A query for `UserService.findById` is an identifier, not a vibe. Dense embeddings return things "similar in style." BM25 returns the actual match. The graph confirms the match resolves to the right symbol.
2. **Relationships.** "What calls `SkillLoader.load`?" is a call-graph traversal, not a similarity query.
3. **Decision lineage.** Why we chose Drizzle is in `decisions.md`. Embeddings would semi-match; the graph knows decisions are first-class nodes.

The graph is the structured layer. BM25 + embeddings handle text retrieval. Together they're "hybrid retrieval." See `engineering-context.md` §3 for the full stack.

## When this skill triggers

| Trigger | Action |
|---|---|
| Project open (cold start) | Full rebuild from `.claude/memory/` + filesystem walk + git log. Target: <3s for 100k files. |
| File save | Incremental update: re-parse changed file, update its symbol nodes and edges. Target: <200ms. |
| Commit | Snapshot the graph state; tagged with commit SHA. |
| Mission close | Absorb the mission's outputs (decisions, PRs, findings) as new nodes/edges. |
| SME crawl (during dream mode) | Update the SME's knowledge subgraph. |
| Manual `forge knowledge rebuild` | Full rebuild on demand. |

## Hard skip

- During an active mission's verification phase: no full rebuild (would conflict with verifier reads). Incremental updates only.
- During dream mode if conflict with another scheduled operation: defer to next cycle.

## Graph schema

### Nodes

| Type | Key | Attributes | Source |
|---|---|---|---|
| `File` | path | language, loc, last_modified, owner_role | filesystem walk |
| `Symbol` | qualified_name | kind (class/fn/var/type/interface), file, line, signature | tree-sitter parse |
| `Decision` | id (`dec-YYYY-MM-DD-NNN`) | summary, why, when, who_decided, status, scope | `decisions.md` |
| `Ticket` | jira_id | title, status, assignee, epic, points | JIRA MCP |
| `PR` | github_id | title, status, reviewer, base, head | GitHub MCP |
| `Commit` | sha | message, author, files, parent | git log |
| `Convention` | id | rule, rationale, scope | `conventions.md` |
| `Playbook` | id | name, steps, when_to_use | `playbooks.md` |
| `Mission` | mission_id | name, status, mode, deadline, cost | mission directory |
| `Finding` | finding_id | severity, type, location, mission_id | verifier outputs |
| `SmeNote` | id | domain, concept, sources, version, confidence | SME crawls |

### Edges

| From | Edge | To |
|---|---|---|
| File | `contains` | Symbol |
| Symbol | `references` | Symbol |
| Symbol | `depends_on` | File |
| Decision | `decided_by` | (role-id or "cto") |
| Decision | `supersedes` | Decision |
| Decision | `cited_by` | Mission, PR, Convention |
| Mission | `produced` | PR, Commit |
| Mission | `cited` | Decision, Convention, Playbook |
| Mission | `had_finding` | Finding |
| PR | `reviewed_by` | (role — typically pr-reviewer) |
| Ticket | `implemented_by` | Mission |
| Finding | `found_by` | (verifier role) |
| Finding | `blocks` | PR |
| SmeNote | `applies_to` | File, Symbol, Convention |

## The retrieval tool

Every role has access to:

```typescript
forge.knowledge.query({
  intent: string,              // natural language
  symbols?: string[],          // exact identifiers to BM25-prioritize
  types?: NodeType[],          // restrict to certain node types
  scope?: string,              // path prefix to restrict scope
  k?: number,                  // default 12
  include_graph?: boolean,     // pull connected nodes (default true)
  rerank?: boolean             // run cross-encoder rerank (default true)
}) => {
  chunks: Array<{
    content: string,
    citation: string,          // file:line or decisions.md#dec-X
    node_type: NodeType,
    score: number
  }>,
  graph_expansion: Array<{
    node: Node,
    edge_path: string[],       // how this node connected to a chunk
    relevance: number
  }>,
  confidence: 'high' | 'medium' | 'low'
}
```

## Retrieval pipeline

```
1. Parse query → extract intent + named symbols
2. BM25 (tantivy) fetches top 200-500 candidates by lexical match
3. Vector index (Voyage 3-Large embeddings) re-ranks to top 50 by semantic similarity
4. Cross-encoder reranker (BGE-Reranker-v2) scores top 20
5. Diversity constraint reduces to top 12 (no near-duplicates)
6. Graph expansion: for each chunk, pull connected nodes 1-2 hops out
7. Return packed context (<30k tokens)
```

Latency target: <300ms p95 end-to-end.

## What every retrieval gets recorded

For auditability, every `forge.knowledge.query()` call is logged:
- to the mission's `whiteboard.md` (if inside a mission)
- to `.claude/transcript/<role>.jsonl` (always)
- includes: query, top-K returned, citations, role, timestamp

This means six months later you can answer: "what context did @impl-c have when implementing the JWT verifier?"

## Memory tiers (matches `project-memory` skill)

The graph absorbs durable sources, not the other way around:

```
Working set   (mission-scoped)     → whiteboard.md
Episodic      (timeline)           → journal.md (append-only)
Semantic      (stable conventions) → conventions.md (curated)
Procedural    (repeatable ops)     → playbooks.md (curated)
Decisions     (immutable ledger)   → decisions.md (append-only)
                                     ↓
                                     ↓ (graph absorbs all)
                                     ↓
Graph         (entity-relation)    → in-memory, rebuilt on open
Vector        (semantic embeddings) → in-memory, rebuilt on open
BM25          (lexical)            → in-memory, rebuilt on open
```

The durable files are the truth. The in-memory layers are derivatives — losing them is annoying (rebuild time), not catastrophic (truth is preserved).

## Incremental updates

A file save triggers:
1. Re-parse the file with tree-sitter
2. Diff old symbol set against new
3. Remove deleted symbol nodes; add new ones
4. Update affected edges (refs, deps)
5. Re-embed only changed symbols (Voyage 3-Large is debounced — wait 2s for further saves)
6. Update BM25 index (incremental; tantivy supports this)

Target: <200ms on file save. The user shouldn't notice.

## Embedding policy

- **Default:** Voyage 3-Large API (`voyage-3` model). $0.12/1M tokens.
- **Cost-optimized:** Google `text-embedding-005` for low-value indexing. $0.006/1M tokens (20× cheaper).
- **Offline / sensitive:** BGE-M3 self-hosted via Ollama. No API call.
- **Switch via:** `.forge/config.yaml` → `knowledge.embedder: voyage-3-large | google-005 | bge-m3`.

For a typical project (~500k LOC), full initial embedding costs ~$5-10 (one-time). Incremental updates are cheap (few hundred tokens per file).

## Anti-patterns

- **Embedding everything every time.** Use incremental updates; debounce; cache aggressively.
- **Graph that pretends to know things it doesn't.** If a query has no matches, return empty + low confidence — don't hallucinate connections.
- **Treating the graph as persistent storage.** It's a derivative. Persist to `.claude/memory/` instead.
- **Cross-role contamination.** A mission's transient state should not pollute the project graph until the mission closes. Use the mission directory as a staging area.
- **Vector-only retrieval.** Dense embeddings alone miss exact identifiers. Always hybrid.

## See also

- `engineering-context.md` §3 (frameworks stack) and §14 (Knowledge Graph concept)
- `FORGE_TEAM_MODE.md` §9 (Universal Knowledge System — full design)
- `project-memory` — the durable layer this skill absorbs from
- `decision-ledger`, `sme-network` — write to the graph
