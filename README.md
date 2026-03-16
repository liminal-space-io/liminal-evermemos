# Liminal Space x EverMemOS

> **Memory for who you're becoming.**

Liminal Space is a production app for inner life — daily coherence tracking, multi-agent Jungian dialogue, and visual artifacts that map psychological development over time. EverMemOS gives it long-term memory: every reflection becomes an **episodic trace**, patterns consolidate into self-knowledge, and an agent reconstructs your transformation arc across months.

**Deployed URL:** [theliminalspace.io](https://theliminalspace.io)

---

## 1. Features

### Arc Memory
An agent that performs **reconstructive recollection** across months of accumulated **MemCells** — generating a transformation narrative that reflects the user's psychological arc back to them.

*"Over six weeks, you moved from dissolution to emergence. Your recurring motif is sovereignty. The Sage archetype correlates with your highest coherence."*

### Shadow Memory
Shadow dialogue that queries EverMemOS for past shadow encounters before each session. Instead of starting fresh, the inquiry deepens across sessions.

*"Your shadow remembers what you worked through last month."*

### Imprint Continuity
Each Imprint (a visual artifact rendered as an impressionist oil painting) draws on prior motifs via **semantic consolidation**. The semiotic compiler weaves continuity into new generations.

*"This Imprint echoes your recurring theme of sovereignty."*

---

## 2. How We Use Memory

Three data channels flow into EverMemOS as **MemCells**. Three query types flow back out.

```
                        INGESTION (Episodic Trace)
                        ─────────────────────────

    ┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
    │  Coherence   │     │   Council    │     │    Threshold     │
    │   Check      │     │  Dialogue    │     │ Moment (Imprint) │
    │              │     │              │     │                  │
    │ 7 factors    │     │ 2-4 Jungian  │     │ Semiotic capture │
    │ scored 1-10  │     │ archetypes   │     │ motifs, shadow,  │
    │ phase, tier  │     │ deliberate   │     │ polarities       │
    └──────┬───────┘     └──────┬───────┘     └────────┬─────────┘
           │                    │                      │
           │         POST /memories (MemCell)          │
           ▼                    ▼                      ▼
    ┌──────────────────────────────────────────────────────────┐
    │                                                          │
    │                       EverMemOS                          │
    │                                                          │
    │   Episodic Trace ──► Semantic Consolidation ──►          │
    │                      Reconstructive Recollection         │
    │                                                          │
    │   Raw MemCells        Patterns extracted        Meaning  │
    │   stored              across MemScenes          rebuilt  │
    │                                                          │
    └───────┬───────────────────┬──────────────────────┬───────┘
            │                   │                      │
            ▼                   ▼                      ▼

                       RETRIEVAL (Queries)
                       ──────────────────

    ┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
    │ Arc Memory   │     │   Shadow     │     │     Imprint      │
    │              │     │   Memory     │     │   Continuity     │
    │ Agentic      │     │              │     │                  │
    │ retrieval    │     │ Hybrid       │     │ Hybrid retrieval │
    │ reconstructs │     │ retrieval    │     │ queries prior    │
    │ transformation     │ recalls past │     │ motifs for       │
    │ arc narrative│     │ shadow work  │     │ weaving into     │
    │ across months│     │ into new     │     │ new generation   │
    │              │     │ sessions     │     │                  │
    └──────────────┘     └──────────────┘     └──────────────────┘
```

### EverMemOS Lifecycle

#### Phase 1: Episodic Trace

Every user interaction creates a **MemCell** — the atomic unit of memory in EverMemOS:

| Channel | Liminal Event | MemCell Content | Tags |
|---------|--------------|-----------------|------|
| Coherence Check | User rates 7 inner factors (stability, vitality, agency, connection, expression, clarity, wholeness) | Factor scores, dominant/weakest, transition phase | `coherence-check`, `phase:EMERGING`, `tier:mid` |
| Council Deliberation | 2-4 Jungian archetype agents deliberate on user's question via Claude API | Topic, archetypes, synthesis, convergence signal | `council`, `archetype:sage`, `archetype:warrior` |
| Threshold Moment | User captures a moment of inner change — semiotic compiler extracts motifs and polarities | Event type, motifs, polarities, shadow elements, coherence snapshot | `myth-event`, `type:dissolution`, `motif:sovereignty` |

MemCells are grouped into a **MemScene** per user — `group_id: "user-{userId}"` — representing the totality of one person's inner journey.

#### Phase 2: Semantic Consolidation

EverMemOS consolidates raw episodic traces into structured patterns:

- Recurring motifs across threshold moments (e.g., `identity_dissolution` appeared 3 times in 2 months)
- Archetype correlations with coherence changes (e.g., Sage consultations correlate with clarity increases)
- Phase transition patterns across weeks and months
- Shadow themes that surface repeatedly across sessions

#### Phase 3: Reconstructive Recollection

The Arc Memory agent uses `retrieve_method: 'agentic'` — LLM-guided multi-round retrieval — to reconstruct a transformation narrative from accumulated MemCells:

```
Query: "Reconstruct this user's transformation arc over the past 3 months"

Result: ENDING phase (Jan) → stuck 3 weeks → LIMINAL (Feb) →
        threshold moment (mask_removal) → EMERGING (Mar) →
        agency rising, connection work needed.
        Recurring motif: sovereignty.
        Archetype evolution: Warrior dismissed → now most-consulted.
```

### The Memory → Reasoning → Action Loop

1. **Memory** — Episodic traces accumulate from coherence checks, council sessions, and threshold moments. Each becomes a MemCell in the user's MemScene.

2. **Reasoning** — Agentic retrieval reconstructs the user's transformation arc from consolidated patterns. The system identifies recurring motifs, archetype evolution, and phase transitions.

3. **Action** — Personalized narrative, guidance, and artifacts generated from reconstructed context. The Council remembers past advice. Shadow dialogue deepens across sessions. Imprints weave recurring motifs.

---

## 3. How Memory Helps Users

Without EverMemOS, Liminal Space has concrete gaps in its production codebase — hardcoded placeholders and `// TODO` stubs where cross-session memory should exist:

| Gap | Before EverMemOS | After EverMemOS |
|-----|-----------------|-----------------|
| No transformation proof | Can't show "you changed over 3 months" | **Reconstructive recollection** generates transformation narrative from accumulated MemCells |
| Shadow dialogue has no memory | Starts fresh every session | Retrieves past shadow encounters via **semantic consolidation** — deepens inquiry across sessions |
| Imprints generate in isolation | Can't see previous motifs | Queries recurring motifs from **MemScene** — weaves continuity into new generation |
| Council can't detect patterns | `recurringTopics: []` hardcoded | **Semantic consolidation** reveals topic patterns across sessions |
| Coherence forecast limited | Only 14 days of data | Long-term **episodic traces** enable months of pattern data for forecasting |

EverMemOS transforms Liminal from an app that *facilitates* inner work into one that *perceives* inner transformation — remembering who you were, understanding who you're becoming, and reflecting your arc back to you.

---

## Architecture Details

See [docs/INTEGRATION_REFERENCE.md](docs/INTEGRATION_REFERENCE.md) for code snippets, API templates, and the full list of 10 integration points.

See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) for the phased execution plan.

See [docs/NARRATIVE_FRAME.md](docs/NARRATIVE_FRAME.md) for the competition narrative and demo script.

---

## Quick Start

### Prerequisites
- Node.js 18+
- EverMemOS API key ([console.evermind.ai](https://console.evermind.ai))
- Supabase project
- Claude API key (Anthropic)

### Setup

```bash
git clone https://github.com/liminal-space-io/liminal-evermemos.git
cd liminal-evermemos
npm install
```

Create `.env.local`:
```
# EverMemOS
EVERMIND_API_KEY=<your-key>
EVERMIND_API_URL=https://api.evermind.ai/api/v0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-url>
SUPABASE_SERVICE_ROLE_KEY=<your-key>

# Claude API
ANTHROPIC_API_KEY=<your-key>
```

```bash
npm run dev          # Start dev server (localhost:3000)
npm run type-check   # TypeScript validation
npm run build        # Production build
```

### Demo Mode
Visit `/agent/arc?demo=true` for a pre-seeded experience — no auth required.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App | Next.js 14 (App Router), React 18, TypeScript |
| Database | Supabase (Postgres + Auth) |
| AI | Claude API (narrative generation, Council deliberation) |
| Memory | EverMemOS Cloud API (`api.evermind.ai`) |
| Design | Frontier design system, Framer Motion |
| Deploy | Vercel |

---

## Video

Coming soon.

---

Built by [Shruti Rajagopal](https://www.linkedin.com/in/shrutirajagopal/) and [Shayaun Nejad](https://www.linkedin.com/in/shayaun/) ([GitHub](https://github.com/allsmog)).
