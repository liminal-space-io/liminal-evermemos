# Liminal Space x EverMemOS

> **Memory for who you're becoming.**

Liminal Space is a production app for inner life — daily coherence tracking, multi-agent Jungian dialogue, and visual artifacts that map psychological development over time. EverMemOS gives it long-term memory: every reflection becomes an **episodic trace**, patterns consolidate into self-knowledge, and an agent reconstructs your transformation arc across months.

**Deployed URL:** [theliminalspace.io](https://theliminalspace.io)

### Production Context

This isn't a hackathon prototype — EverMemOS integrates into a **shipped production codebase**:

- **125+ database migrations** (Supabase/Postgres) — coherence scores, archetype memory, identity signals, myth events, semiotic mappings
- **15-handler EventBus** processing every coherence check in parallel via `Promise.allSettled()` — EverMemOS becomes the 16th handler
- **12 Jungian archetype agents** with distinct voices, memory, and personality — powered by GPT-4o-mini with per-archetype system prompts
- **7-factor coherence scoring model** (stability, vitality, agency, connection, expression, clarity, wholeness) — the quantitative backbone of the ontology
- **Semiotic compiler** that transforms threshold moments into Imprints — impressionist oil painting artifacts driven by phase, coherence, motifs, and polarity tensions
- **5 transition phases** (initiation → dissolution → liminal → integration → emergence) tracking psychological development over months
- **Custom design system** (`frontier.ts`) with chakra-aligned color tokens, glass morphism, and ritual-grade animation

The code in this repo mirrors the production architecture — 66 source files across the same domain boundaries. Proprietary algorithms (semiotic compiler, pattern detection, shadow dialogue routing) are stubbed to protect IP while preserving the full type system and integration surface.

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

This repo mirrors Liminal's production architecture — **66 source files** across API routes, services, libraries, and domain logic — wired to EverMemOS for long-term memory.

### Codebase Structure

```
src/
├── app/api/              # 6 API routes
│   ├── agent/arc/        # Arc Memory — agentic retrieval + narrative
│   ├── coherence/        # Coherence checks (EventBus, 15+ handlers)
│   ├── council/          # Council deliberation (multi-archetype dialogue)
│   ├── myths/            # Threshold moments + semiotic extraction
│   └── archetypes/       # Shadow pattern dialogue
├── lib/
│   ├── evermemos/        # EverMemOS client, channels, formatters, types
│   ├── semiotic/         # Semiotic compiler (glyphs, mapping, calibration)
│   ├── council/          # Archetype memory, pattern detection
│   ├── identity/         # Identity signal computation
│   ├── archetypes/       # Shadow dialogue, voices, patterns
│   ├── agent/            # Council deliberation logic
│   └── api/              # Auth guard, validation, idempotency
├── services/
│   ├── coherence/        # Coherence scoring service
│   └── events/           # EventBus + handlers (inc. EverMemOSHandler)
├── types/                # Domain types (database, identity)
└── styles/               # Frontier design system tokens
```

### EventBus Integration

Liminal's coherence system uses a **15-handler EventBus** — every coherence check triggers analytics, phase updates, archetype routing, XP, and more in parallel via `Promise.allSettled()`. EverMemOS becomes the 16th handler: one file, three lines of registration, zero impact on response time.

### Three Channels, Two Patterns

- **Channel 1 (Coherence):** EventBus handler — follows existing 15-handler pattern
- **Channel 2 (Council):** Per-route fire-and-forget — `void storeCouncilDeliberation().catch(() => {})`
- **Channel 3 (Threshold):** Per-route fire-and-forget — `void storeThresholdMoment().catch(() => {})`

### Graceful Degradation

All channels are fire-and-forget. The EverMemOS client adds: `isEnabled()` gate (env-controlled), `safeFetch()` with 10s timeout, GET→POST auto-fallback for search, and `withEverMemOSFallback()` wrapper. **The app works identically with or without EverMemOS.**

### Further Reading

- [docs/EVENTBUS_INTEGRATION.md](docs/EVENTBUS_INTEGRATION.md) — How all 3 channels wire into the existing architecture
- [docs/INTEGRATION_REFERENCE.md](docs/INTEGRATION_REFERENCE.md) — API templates and the full list of 10 integration points
- [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) — Phased execution plan
- [docs/NARRATIVE_FRAME.md](docs/NARRATIVE_FRAME.md) — Competition narrative and demo script

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
EVERMIND_API_URL=https://api.evermind.ai/api/v1
EVERMEMOS_ENABLED=true

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

# EverMemOS tools
npx ts-node scripts/seed-demo-data.ts    # Seed 7 synthetic MemCells across phases
npx ts-node scripts/smoke-test.ts        # Health check + store/search round-trip
```

### Demo Mode
Visit `/agent/arc?demo=true` for a pre-seeded experience — no auth required.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App | Next.js 15 (App Router), React 19, TypeScript 5.7 |
| Database | Supabase (Postgres + Auth) |
| AI | Claude API via `@anthropic-ai/sdk` (narrative generation, Council deliberation) |
| Memory | EverMemOS Cloud API (`api.evermind.ai/api/v1`) |
| Logging | pino (structured JSON logging) |
| Design | Frontier design system |
| Deploy | Vercel |

---

## Video

Coming soon.

---

Built by [Shruti Rajagopal](https://www.linkedin.com/in/shrutirajagopal/) and [Shayaun Nejad](https://www.linkedin.com/in/shayaun/) ([GitHub](https://github.com/allsmog)).
