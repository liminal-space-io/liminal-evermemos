# EverMemOS Integration Reference — Copy-Paste Build Guide

> **What this doc is:** Code snippets and query templates for wiring Liminal → EverMemOS.
> **When to use it:** During the build sprint. Not strategy — just code.

---

## Setup

```
Base URL: https://api.evermind.ai/api/v0
Auth: Authorization: Bearer <EVERMIND_API_KEY>
Console: https://console.evermind.ai/
```

Add to `.env.local`:
```
EVERMIND_API_KEY=<your-key>
EVERMIND_API_URL=https://api.evermind.ai/api/v0
```

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
    sender: 'user',
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
    sender: 'user',
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
    sender: 'assistant',
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

> **API NOTE:** The snippets below show `body` on GET requests — this is non-standard HTTP. Check EverMemOS docs to confirm whether `/memories/search` accepts query params, POST body, or both. The Cloud API may differ from local Docker. Verify before building.

### Before Council Response — Retrieve Relevant Memory

```typescript
const response = await fetch(`${process.env.EVERMIND_API_URL}/memories/search?` + new URLSearchParams({
  query: `What patterns has this user shown around ${topic}? What archetypes have been most helpful? What phase transitions have they experienced?`,
  retrieve_method: 'agentic',
  group_id: `user-${userId}`,
}), {
  headers: { 'Authorization': `Bearer ${process.env.EVERMIND_API_KEY}` },
})
const memories = await response.json()
// Inject retrieved context into Council archetype prompts
```

### Before Imprint Generation — Reconstruct Journey

```typescript
const response = await fetch(`${process.env.EVERMIND_API_URL}/memories/search?` + new URLSearchParams({
  query: `What threshold moments, recurring motifs, and shadow patterns define this user's inner journey?`,
  retrieve_method: 'agentic',
  group_id: `user-${userId}`,
  tags: 'myth-event',
}), {
  headers: { 'Authorization': `Bearer ${process.env.EVERMIND_API_KEY}` },
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

## API Reference

| Endpoint | Method | Purpose | When we use it |
|---|---|---|---|
| `/memories` | POST | Store episodic trace | After check, council, myth event |
| `/memories` | GET | Retrieve with filters | Debugging, data verification |
| `/memories/search` | GET | Hybrid/agentic retrieval | Before Council prompt, before Imprint gen |
| `/conversation/metadata` | POST/PATCH | Tag conversations | Tag with phase, archetype, coherence tier |
| `/request-status` | GET | Check indexing status | Verify memory indexed before retrieval |
| `/health` | GET | System health | Smoke test on setup |

**Retrieval strategies:**
- `hybrid` — BM25 + vector (default, good for most queries)
- `lightweight` — keyword only (fast, use for simple lookups)
- `agentic` — LLM-guided multi-round (most powerful — use for demo moments and reconstructive queries)
