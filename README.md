# Liminal Space x EverMemOS — Memory for Inner Life

> AI that remembers every moment of your inner transformation — and reflects your arc back to you.

**Deployed URL:** [theliminalspace.io](https://theliminalspace.io)

---

## 1. Features

Liminal Space is a production app for inner life — daily reflections, multi-agent Jungian dialogue, and visual artifacts that track psychological development over time. With EverMemOS, Liminal gains long-term memory across three features:

- **Arc Memory** — An agent that reconstructs your psychological transformation arc from months of accumulated EverMemOS data. Query: *"Reconstruct this user's transformation arc over the past 3 months."* Result: a timeline narrative showing phase transitions (ENDING → LIMINAL → EMERGING), recurring motifs, and coherence evolution.

- **Shadow Memory** — Shadow dialogue that remembers past encounters. Before each session, EverMemOS retrieves prior shadow themes so the inquiry deepens across sessions instead of starting fresh. *"Your shadow remembers what you worked through last month."*

- **Imprint Continuity** — Each Imprint (a visual artifact of inner state, rendered as an impressionist oil painting) draws on the full history of previous Imprints. EverMemOS queries recurring motifs so the semiotic compiler weaves continuity: *"This Imprint echoes your recurring theme of sovereignty."*

---

## 2. How We Use Memory

Liminal stores and retrieves memory through EverMemOS's three-phase lifecycle:

### Phase 1: Episodic Trace (Ingestion)

Three data channels create MemCells in EverMemOS after each user interaction:

| Channel | Liminal Event | MemCell Content |
|---------|--------------|-----------------|
| Coherence Check | User rates 7 inner factors (stability, vitality, agency, connection, expression, clarity, wholeness) | Factor scores, dominant/weakest factor, transition phase, coherence tier |
| Council Deliberation | 2-4 Jungian archetype agents deliberate on user's question via Claude API | Topic, archetypes present, synthesis, convergence signal, user reaction |
| Threshold Moment (Imprint) | User captures a moment of inner change — semiotic compiler extracts motifs and polarities | Event type, raw reflection, motifs, polarities, shadow elements, coherence snapshot |

### Phase 2: Semantic Consolidation (Pattern Extraction)

EverMemOS consolidates raw episodic traces into structured patterns:
- Recurring motifs across threshold moments (e.g., `identity_dissolution` appeared 3 times in 2 months)
- Archetype correlations with coherence changes (e.g., Sage consultations correlate with clarity increases)
- Phase transition patterns across weeks and months

### Phase 3: Reconstructive Recollection (The Demo Moment)

The Arc Memory agent uses `retrieve_method: 'agentic'` to perform LLM-guided multi-round retrieval, reconstructing a transformation narrative from accumulated MemCells:

```
Query: "Reconstruct this user's transformation arc over the past 3 months"

Result: ENDING phase (Jan) → stuck 3 weeks → LIMINAL (Feb) →
        threshold moment (mask_removal) → EMERGING (Mar) →
        agency rising, connection work needed.
        Recurring motif: sovereignty.
        Archetype evolution: Warrior dismissed → now most-consulted.
```

This demonstrates the complete **Memory → Reasoning → Action** loop:
- **Memory:** Episodic traces accumulated from coherence checks, council sessions, threshold moments
- **Reasoning:** Agentic retrieval reconstructs the transformation arc from consolidated patterns
- **Action:** Personalized narrative and guidance generated from reconstructed context

---

## 3. How Memory Helps Users

Without EverMemOS, Liminal Space has 10 concrete gaps in its production codebase — hardcoded placeholders and `// TODO` stubs where cross-session memory should exist:

| Gap | Before EverMemOS | After EverMemOS |
|-----|-----------------|-----------------|
| No transformation proof | Can't show "you changed over 3 months" | Reconstructive recollection generates transformation narrative |
| Shadow dialogue has no memory | Starts fresh every session | Retrieves past shadow encounters — deepens inquiry across sessions |
| Imprints generate in isolation | Can't see previous motifs | Queries recurring motifs — weaves continuity into new generation |
| Council can't detect patterns | `recurringTopics: []` hardcoded | Semantic consolidation reveals topic patterns across sessions |
| Coherence forecast limited | Only 14 days of data | Long-term memory enables months of pattern data |

EverMemOS transforms Liminal from an app that *facilitates* inner work into one that *perceives* inner transformation — remembering who you were, understanding who you're becoming, and reflecting your arc back to you.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Liminal Space                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │Coherence │  │ Council  │  │ Threshold Moments │  │
│  │  Check   │  │Dialogue  │  │    (Imprints)     │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│       ▼              ▼                 ▼              │
│  ┌──────────────────────────────────────────────┐    │
│  │         EverMemOS Integration Layer          │    │
│  │    POST /memories (Episodic Trace)           │    │
│  └──────────────────┬───────────────────────────┘    │
│                     │                                 │
└─────────────────────┼─────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │       EverMemOS        │
         │                        │
         │  Episodic Trace        │
         │       ↓                │
         │  Semantic Consolidation│
         │       ↓                │
         │  Reconstructive        │
         │  Recollection          │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Query Layer          │
         │                        │
         │  Arc Memory (agentic)  │
         │  Shadow Memory (hybrid)│
         │  Motif Query (hybrid)  │
         └────────────────────────┘
```

## Tech Stack

- **App:** Next.js 14 (App Router), React 18, TypeScript
- **Database:** Supabase (Postgres + Auth)
- **AI:** Claude API (narrative generation, Council deliberation)
- **Memory:** EverMemOS Cloud API (`api.evermind.ai`)
- **Design:** Frontier design system, Framer Motion
- **Deploy:** Vercel

## Demo

Visit [theliminalspace.io](https://theliminalspace.io) — Arc Memory demo coming soon at `/agent/arc?demo=true`.

## Video

Coming soon.

---

Built by [Shruti Rajagopal](https://theliminalspace.io) — UC Berkeley (Cognitive Science + Computer Science). Solo founder of Liminal Space.
