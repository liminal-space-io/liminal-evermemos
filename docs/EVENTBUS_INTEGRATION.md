# EventBus Integration — How EverMemOS Wires into Liminal Space

> **What this doc is:** Architectural reference for how EverMemOS integrates with Liminal's event-driven coherence system.
> **Audience:** Judges evaluating Technical Depth, and developers reading the codebase.

---

## The Pattern: 16th Handler on a 15-Handler EventBus

Liminal's coherence route uses an **EventBus** that publishes `check_completed` events to 15 parallel handlers via `Promise.allSettled()`. Each handler runs independently — one failure never blocks another.

EverMemOS becomes the **16th handler**. Three lines of registration code, zero impact on response time:

```typescript
// src/app/api/coherence/route.ts
eventBus.subscribe("check_completed", new EverMemOSHandler(logger));
```

The handler (`src/services/events/handlers/EverMemOSHandler.ts`) formats the coherence check into an EverMemOS MemCell and calls `storeMemory()`. Fire-and-forget — if EverMemOS is unreachable, the handler logs a warning and the app continues normally.

---

## Three Channels, Two Patterns

### Channel 1: Coherence Checks → EventBus Handler

Already integrated. `EverMemOSHandler` subscribes to `check_completed` alongside the 15 existing handlers (analytics, phase updates, XP, archetype routing, etc.).

```
POST /api/coherence → CoherenceService → EventBus.publish()
  ├─ AnalyticsHandler
  ├─ PhaseUpdateHandler
  ├─ ArchetypeResonanceHandler
  ├─ ... (12 more)
  ├─ IdentitySignalHandler
  └─ EverMemOSHandler ← stores episodic trace in EverMemOS
```

### Channel 2: Council Deliberations → Per-Route

Council has its own route at `src/app/api/council/deliberation/route.ts`. After the deliberation completes and the identity signal is emitted, a fire-and-forget call stores the council MemCell:

```typescript
void storeCouncilDeliberation({
  conversationId, userId, timestamp, topic,
  archetypes, synthesisSnippet, convergenceSignal, reaction
}).catch(() => {})
```

### Channel 3: Threshold Moments → Per-Route

Myth events have their own route at `src/app/api/myths/route.ts`. After the `myth_events` row is inserted:

```typescript
void storeThresholdMoment({
  eventId, userId, timestamp, eventType,
  rawContent, motifs, polarities, shadowContacted, coherenceSnapshot, phase
}).catch(() => {})
```

---

## Why EventBus for Channel 1 but Not 2 & 3

The coherence route already has a `Promise.allSettled()` EventBus with 15 handlers. Adding a 16th follows the existing pattern — clean architecture that judges recognize.

Council and myth routes don't have an EventBus. Creating one just for EverMemOS would be over-engineering for the timeline. The `void store().catch(() => {})` pattern is the right amount of architecture.

---

## Graceful Degradation

All three channels are fire-and-forget:
- **Channel 1:** `EverMemOSHandler` catches all errors, logs at `warn` level
- **Channel 2 & 3:** `void storeX().catch(() => {})` — promise rejection silently absorbed

The client (`src/lib/evermemos/client.ts`) adds a second layer:
- `isEnabled()` gate — returns silently when `EVERMEMOS_ENABLED !== 'true'`
- `safeFetch()` wrapper — 10s timeout, catches network errors
- `withEverMemOSFallback()` — wraps any EverMemOS call with a fallback value

**The app works identically with or without EverMemOS.** It just *accumulates* when memory is available.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/services/events/handlers/EverMemOSHandler.ts` | Channel 1: coherence → EverMemOS |
| `src/lib/evermemos/client.ts` | API wrapper (store, search, health, fallback) |
| `src/lib/evermemos/channels.ts` | Channel adapters (coherence, council, threshold) |
| `src/lib/evermemos/formatters.ts` | MemCell formatting (content strings, tags) |
| `src/lib/evermemos/types.ts` | EverMemOSMessage, MemoryResult |
| `src/app/api/agent/arc/route.ts` | Arc Memory — agentic retrieval + narrative |
