# EverMemOS Integration Reference — Copy-Paste Build Guide

> **What this doc is:** Code snippets and query templates for wiring Liminal → EverMemOS.
> **When to use it:** During the build sprint. Not strategy — just code.

---

## Setup

```
Cloud URL: https://api.evermind.ai/api/v1    (closed beta — whitelist via competition registration)
Local URL: http://localhost:1995/api/v1       (Docker: docker compose up -d)
Auth: Authorization: Bearer <EVERMIND_API_KEY>   (Cloud only — local has no auth)
Console: https://console.evermind.ai/
```

> **Cloud access:** Registered competition email (`shruti@theliminalspace.io`) whitelisted within 1 business day. Until then, use local Docker.

Add to `.env.local`:
```
EVERMIND_API_KEY=<your-key>
EVERMIND_API_URL=https://api.evermind.ai/api/v1   # or http://localhost:1995/api/v1 for local
```

> **API version note (2026-03-15):** Starter kit uses `/api/v1/` endpoints, not `/api/v0/`. The `sender` field takes a user ID string (e.g., `"user_001"`), not `"user"/"assistant"`. Search uses `user_id` param, not `group_id`. Verify Cloud API matches local API before shipping.

---

## Where to Wire — The 10 Gaps in Liminal's Codebase

These are real hardcoded placeholders and `// TODO` stubs in production code. EverMemOS replaces each one. Ordered by demo impact — fix the top 3 and you have the killer demo.

| # | Gap | File | Current state | What EverMemOS replaces it with |
|---|-----|------|--------------|-------------------------------|
| **1** | No transformation proof | — (no file — feature doesn't exist) | Can't show "you changed over 3 months" | Reconstructive recollection generates transformation narrative from accumulated MemCells |
| **2** | Shadow dialogue has no memory | `src/lib/archetypes/shadow-dialogue.ts:62` | Starts fresh every session — no awareness of past shadow encounters | Retrieve past shadow encounters → deepen inquiry across sessions |
| **3** | Imprints generate in isolation | `src/lib/myths/compiler.ts:99` | Semiotic compiler can't see previous Imprints' motifs | Query previous Imprints' motifs → weave continuity into new generation |
| **4** | Council can't detect recurring topics | `src/lib/archetypes/pattern-detection.ts:118` | `recurringTopics: []` — hardcoded empty array | Semantic consolidation reveals topic patterns across sessions |
| **5** | Council can't correlate archetypes with coherence | `src/lib/archetypes/pattern-detection.ts:117` | `coherenceCorrelation: 0` — hardcoded zero | Store check + council data → query which archetypes correlate with coherence changes |
| **6** | Coherence forecast limited to 14 days | `src/lib/thresholds/trajectory.ts:141` | Can't see seasonal patterns or personal baselines | Long-term memory enables months of pattern data for forecasting |
| **7** | Phase advancement ignores quality | `src/lib/dashboard/phase-inference.ts:28` | Binary thresholds — score above X = advance | Personal coherence history → quality-aware, personalized transitions |
| **8** | Ritual prompts repeat generically | `src/lib/rituals/micro-rituals.ts:480` | Same prompt every week regardless of user history | Memory of what resonated → personalized prompt selection |
| **9** | Streak breaks have no root cause | `src/lib/daily-practice/streak-calculator.ts:76` | `{ newStreak: 1 }` — just resets, no context | Memory provides context: "broke during a high-stress transition week" |
| **10** | Proactive insights are pattern-blind | `src/lib/dashboard/proactive-surfacer.ts:125` | Can't correlate which tools help in which states | Temporal-semantic correlation from accumulated practice data |

**Build strategy:** Pick the top 2–3 that demo well in 90 seconds. **#1 + #2 + #3** is the killer trio (Arc Memory + Shadow Memory + Imprint Continuity).

---

## Layer 1: Episodic Ingestion (POST /memories)

> **API v1 note:** `sender` takes a user ID string (not `"user"`/`"assistant"`). The `metadata` field structure should be verified against Cloud API docs — the starter kit shows a flat structure without `group_id`/`tags`/`scene`. The snippets below use what we *expect* works based on the GitHub docs. **Verify with real API before shipping.**

### Coherence Check → Memory

After `CoherenceService.submitCheck()` completes:

```typescript
await fetch(`${process.env.EVERMIND_API_URL}/memories`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EVERMIND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message_id: `coherence-${checkId}`,
    create_time: timestamp,
    sender: userId,  // user ID string, not "user"
    content: `Coherence check: overall ${score}. Factors: stability=${factors.stability}, vitality=${factors.vitality}, agency=${factors.agency}, connection=${factors.connection}, expression=${factors.expression}, clarity=${factors.clarity}, wholeness=${factors.wholeness}. Dominant: ${dominant}. Weakest: ${weakest}. Mode: ${mode}.`,
    metadata: {
      group_id: `user-${userId}`,
      tags: ['coherence-check', `phase:${currentPhase}`, `tier:${coherenceTier}`],
      scene: 'daily-practice',
    },
  }),
})
```

**Example content string:**
```
Coherence check: overall 72/100. Stability: 68, Vitality: 75, Agency: 82,
Connection: 65, Expression: 70, Clarity: 78, Wholeness: 66. Dominant: agency.
Weakest: connection. Phase: EMERGING. This is the third check this week
showing agency rising while connection declines.
```

**Tags:** `['coherence-check', 'phase:EMERGING', 'tier:mid', 'dominant:agency']`

---

### Myth Event (Threshold Moment) → Memory

After `myth_events` insert:

```typescript
await fetch(`${process.env.EVERMIND_API_URL}/memories`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EVERMIND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message_id: `myth-${eventId}`,
    create_time: timestamp,
    sender: userId,  // user ID string
    content: `Threshold moment (${event_type}): ${raw_content}. Motifs: ${motifs.join(', ')}. Polarities: ${polarities.map(p => `${p.pole_a}↔${p.pole_b}`).join(', ')}. Shadow contacted: ${shadow_elements.contacted}. Coherence at moment: ${coherence_snapshot.overall}.`,
    metadata: {
      group_id: `user-${userId}`,
      tags: ['myth-event', `type:${event_type}`, `phase:${phase}`, ...motifs],
      scene: 'interior-threshold',
    },
  }),
})
```

**Example content string:**
```
Threshold moment (dissolution): 'I realized the role I've been performing
isn't mine anymore.' Motifs: identity_dissolution, mask_removal. Polarities:
authenticity↔belonging (tension: 0.85). Shadow contacted: fear of being unseen.
Coherence at moment: 58/100. Micro-action: 'Name one space where you show up
without the mask.'
```

**Tags:** `['myth-event', 'type:dissolution', 'phase:liminal', 'motif:identity_dissolution', 'motif:mask_removal']`

---

### Council Deliberation → Memory

After council session save:

```typescript
await fetch(`${process.env.EVERMIND_API_URL}/memories`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EVERMIND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message_id: `council-${conversationId}`,
    create_time: timestamp,
    sender: userId,  // user ID string — council output stored under the user's memory
    content: `Council deliberation on "${topic}". Archetypes present: ${archetypes.join(', ')}. Synthesis: ${synthesisSnippet}. Convergence signal: ${convergenceSignal}. User reaction: ${reaction}.`,
    metadata: {
      group_id: `user-${userId}`,
      tags: ['council', ...archetypes.map(a => `archetype:${a}`)],
      scene: 'council-session',
    },
  }),
})
```

**Example content string:**
```
Council deliberation on 'Should I leave this job?' Archetypes: Warrior, Lover,
Sage. Warrior urged decisive action, Lover named the relational cost, Sage
reframed as identity question not career question. Synthesis: 'The question
isn't whether to leave—it's who you become by staying.' User reaction: resonant.
```

**Tags:** `['council', 'archetype:warrior', 'archetype:lover', 'archetype:sage']`

---

## Layer 2: Semantic Queries (GET /memories/search)

> **API v1 note:** Starter kit shows search as GET with JSON body (non-standard HTTP). Uses `user_id` param, not `group_id`. Retrieval methods: `keyword`, `vector`, `hybrid`, `rrf`, `agentic`. Memory types: `episodic_memory`, `profile`, `foresight`, `event_log`. **Verify exact request format with Cloud API before shipping.**

### Before Council Response — Retrieve Relevant Memory

```typescript
const response = await fetch(`${process.env.EVERMIND_API_URL}/memories/search`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.EVERMIND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `What patterns has this user shown around ${topic}? What archetypes have been most helpful?`,
    user_id: userId,
    retrieve_method: 'agentic',
  }),
})
const memories = await response.json()
// Inject retrieved context into Council archetype prompts
```

### Before Imprint Generation — Reconstruct Journey

```typescript
const response = await fetch(`${process.env.EVERMIND_API_URL}/memories/search`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.EVERMIND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `What threshold moments, recurring motifs, and shadow patterns define this user's inner journey?`,
    user_id: userId,
    retrieve_method: 'agentic',
  }),
})
const memories = await response.json()
// Feed into Imprint artifact generation as accumulated context
```

---

## Layer 3: Reconstructive Queries (Demo-Winning Feature)

These demonstrate Phase 3 — reconstructive recollection. Most competitors won't touch this.

### Query: Recurring Motifs

```
"What recurring motifs appear across this user's threshold moments?"
→ Returns: dissolution + mask_removal appeared 3 times in 2 months
```

### Query: Archetype Evolution

```
"How has this user's relationship with the Warrior archetype evolved?"
→ Returns: Initially dismissed (3 interactions), now most-consulted (12 interactions, resonance 0.87)
```

### Query: State-Decision Correlation

```
"What was this user's coherence state when they last faced a career decision?"
→ Returns: Agency was high (82) but Connection was low (65) — same pattern as current moment
```

### Query: Transformation Arc (THE demo moment)

```
"Reconstruct this user's transformation arc over the past 3 months"
→ Returns: ENDING phase (Jan) → stuck 3 weeks → LIMINAL (Feb) → threshold moment (mask_removal) → EMERGING (Mar) → agency rising, connection work needed
```

---

## API Reference (v1 — from Starter Kit)

| Endpoint | Method | Purpose | When we use it |
|---|---|---|---|
| `/api/v1/memories` | POST | Store a message (episodic trace) | After check, council, myth event |
| `/api/v1/memories` | GET | Fetch memories by type | Debugging, data verification |
| `/api/v1/memories/search` | GET | Search memories (hybrid/agentic) | Before Council prompt, before Imprint gen |
| `/api/v1/memories` | DELETE | Delete memories | Cleanup, testing |
| `/health` | GET | System health | Smoke test on setup |

**Retrieval strategies (`retrieve_method`):**
- `keyword` — BM25 keyword matching (fast)
- `vector` — vector similarity only
- `hybrid` — keyword + vector (recommended for most queries)
- `rrf` — reciprocal rank fusion
- `agentic` — LLM-guided multi-round (most powerful — use for demo moments and reconstructive queries)

**Memory types (`memory_types`):**
- `episodic_memory` — raw experiences (our primary use)
- `profile` — user preferences and patterns
- `foresight` — forward-looking predictions
- `event_log` — system events

**Response shape:**
```json
{
  "status": "ok",
  "message": "Success description",
  "result": { /* response data */ }
}
```
