---
name: sme-network
description: A separate tier of roles — subject matter experts — that crawl Tier 1-2 sources in their domain, maintain a domain knowledge subgraph, and respond to consultations from other roles via the `forge.sme.consult()` tool. SMEs don't write code, don't make decisions, don't participate in missions as workers — they inform. Sleeping by default; activated on consultation OR scheduled crawl during dream mode. Tier 1-2 citations required on every response. Five recommended SMEs for the Bakstage/Mandalore stack: java-spring, typescript-frontend, mongodb-firestore, aws-cloud, voice-ai.
---

# SME Network

Subject matter experts as a separate role tier. Crawl Tier 1-2 sources in their domain. Maintain a domain knowledge subgraph. Respond to consultations. Don't code, don't decide, don't implement.

## Why this is its own tier

Three reasons a dedicated SME tier earns the complexity:

1. **Token efficiency.** An implementer reading 40 pages of Spring Boot docs burns Opus tokens for one answer. SMEs have the knowledge pre-distilled in their subgraph.
2. **Citation discipline.** SMEs are structurally configured to cite Tier 1-2 only. An ad-hoc web search by an implementer might surface a 2019 Stack Overflow answer.
3. **Currency.** SMEs are refreshed weekly via dream mode. Ad-hoc reads have whatever staleness the LLM's training cutoff dictates.

## When this skill triggers

- `forge.sme.consult({domain, question, context, max_cost_usd})` called by any non-SME role
- Scheduled crawl (during dream mode; per SME's `crawl_schedule`)
- CTO direct invocation (`@sme-<domain> <question>`)
- Mission planning (orchestrator may pre-consult relevant SMEs at brief acceptance)

## Hard skip

- SMEs do NOT initiate. They respond to queries, not to perceived gaps.
- SMEs do NOT cross-consult each other directly. If a question spans domains (e.g., MongoDB schema for a React app), the consulting role queries both SMEs and synthesizes.
- SMEs do NOT participate in missions as implementers/verifiers.

## The five recommended SMEs (for your stack)

| SME | Domain | Tier 1 sources | Tier 2 sources |
|---|---|---|---|
| `@sme-java-spring` | Java 21, Spring Boot 3.x, Spring Security, JPA, Spring Cloud | docs.spring.io, openjdk.org | Baeldung, Spring Engineering Blog |
| `@sme-typescript-frontend` | TS 5.x, React 19, Angular 18, Preact | typescriptlang.org, react.dev, angular.dev | Vercel Blog, React Team posts |
| `@sme-mongodb-firestore` | MongoDB 7, Firestore, Mongoose | mongodb.com/docs, firebase.google.com/docs | MongoDB Engineering, Firebase blog |
| `@sme-aws-cloud` | AWS (S3, Lambda, ECS, RDS, EventBridge, Kinesis) | docs.aws.amazon.com | AWS News Blog, AWS re:Invent |
| `@sme-voice-ai` | Gemini Live, Deepgram, WebRTC, 100ms, VideoSDK, SIP telephony | Provider docs | Voice-AI engineering blogs |

SMEs are added/removed via team-modifications.

## Lifecycle states (sme-specific)

| State | Meaning |
|---|---|
| `sleeping` | Default. No tokens. Knowledge base in KG. |
| `crawling` | Scheduled refresh from Tier 1-2 (during dream mode) |
| `consulting` | Another role queried; SME wakes, retrieves, responds, sleeps |

## Tool: `forge.sme.consult()`

```typescript
const answer = await forge.sme.consult({
  domain: 'java-spring',
  question: 'What is the recommended pattern for transactional outbox in Spring Boot 3.3 with Mongo?',
  context: {
    mission_id: 'mandalore-event-publisher',
    current_file: 'packages/mandalore-outbox/src/Publisher.java',
    decision_to_make: 'change streams vs polling for outbox processing'
  },
  max_cost_usd: 0.50
});

// Returns:
// {
//   answer: string,        // structured response with citations
//   citations: URL[],      // Tier 1-2 only
//   confidence: 'high' | 'medium' | 'low',
//   cost_usd: number,
//   sme_id: 'sme-java-spring',
//   timestamp: ISO8601
// }
```

The SME's response structure:

- **Answer** — concrete; cites Tier 1-2 sources
- **Citations** — at least one Tier 1 if confidence is `high`
- **Confidence** — `high` (multiple Tier 1 citations agree); `medium` (Tier 1 + Tier 2 corroborate); `low` (Tier 2 only or sources disagree)
- **Cost** — actual cost incurred
- **Knowledge update** — if the SME learned something new during the consult, the subgraph is updated

## What SMEs do NOT do

- **Don't write code.** No `Edit`/`Write` tools.
- **Don't make decisions.** They inform; the consulting role decides (or escalates to CTO).
- **Don't crawl Tier 3-4 unless CTO-directed.** Knowledge bases are Tier 1-2.
- **Don't participate in missions directly.** Consulted, not employed.
- **Don't auto-update skills.** Continuous-learning owns that pipeline. SMEs feed knowledge into the KG; updates to skills come via CTO-approved proposals.

## Knowledge base schema

Each SME's knowledge lives in a subgraph of the project KG, under `domain:<sme-id>`. Nodes:

- `Concept` — domain concept ("transactional outbox")
- `Source` — Tier 1-2 URL + crawl timestamp
- `Pattern` — recommended pattern with rationale
- `Anti-pattern` — documented bad pattern
- `Version` — technology version this knowledge applies to

Edges:
- `Pattern -[applies_to]-> Version`
- `Pattern -[contrasts_with]-> Anti-pattern`
- `Pattern -[cited_by]-> Source`
- `Pattern -[supersedes]-> Pattern`

## SME role configuration (in org-chart.yaml)

```yaml
- id: sme-java-spring
  title: Java/Spring SME
  tier: knowledge
  reports_to: vp-engineering
  model: claude-sonnet-4-6
  tools: [Read, Grep, Glob, WebFetch]      # no Edit, no Write, no Bash
  skills: [research-first, unbiased-development, sme-network]
  isolation: none
  max_turns: 30
  schedule: on-demand                       # idle by default
  crawl_schedule:
    tier_1_docs: weekly                     # during dream mode
    tier_2_blogs: weekly
  knowledge_subgraph: domain:sme-java-spring
  consultation_cost_cap_usd: 0.50
```

## Operations

| Operation | Triggered by | Effect |
|---|---|---|
| `consult` | `forge.sme.consult()` call | Wake SME; retrieve from subgraph; if stale or missing, fast crawl; respond |
| `crawl` | Schedule (during dream mode) | Refresh Tier 1-2 sources; update subgraph |
| `update_knowledge` | After consult or crawl | Persist new patterns/concepts to subgraph |
| `cite` | Every response | Tier 1-2 citations mandatory |
| `sleep` | After response | Release state; subgraph remains |

## Anti-patterns

- **SMEs as full-time team members.** They're consulted, not employed. Idle 90% of the time is correct.
- **SMEs that argue with implementers.** SMEs respond; verifiers catch ground-truth issues. If an implementer disagrees with an SME, the implementer ships; ground-truth gates judge.
- **SMEs cross-consulting each other.** No agent-to-agent chat. Consulting role queries multiple SMEs sequentially.
- **SMEs auto-updating skills.** Their job is to inform; continuous-learning produces skill-update proposals.
- **SMEs without citations.** Every response must have at least one Tier 1-2 citation. If the SME has no citation, the response is `confidence: low` with that flagged.

## Operations and surfaces

- **Dashboard:** SMEs appear as a dedicated tier (idle most of the time). Click a SME to see their subgraph stats (concepts indexed, last crawl, consultations this week).
- **CLI:** `forge sme list`, `forge sme consult <domain> "<question>"`, `forge sme refresh <domain>`.

## See also

- `engineering-context.md` §14 (SME concept; knowledge graph)
- `FORGE_TEAM_OPERATIONS.md` §10 (full SME spec)
- `knowledge-graph` — SME subgraphs live here
- `continuous-learning` — adjacent skill; SMEs feed knowledge, continuous-learning proposes skill changes
- `research-first` (engineering-excellence-v6) — source tier discipline
- `org-chart` — SME role configuration
