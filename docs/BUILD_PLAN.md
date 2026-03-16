# Memory Genesis 2026 — Build Plan

> **What this doc is:** Task-by-task execution plan with owner assignments and milestone gates.
> **Status:** DRAFT — idea selection not locked. Default: Arc Memory + Shadow Memory + Imprint Continuity.
> **Decision needed:** Confirm feature set before starting Phase 2.

---

## The Build: What We're Shipping

**Primary feature:** Arc Memory — an agent that reconstructs your psychological transformation arc from accumulated EverMemOS data.

**Supporting features:**
- Shadow Memory — shadow dialogue retrieves past shadow encounters before starting
- Imprint Continuity — Imprint generation queries previous motifs to weave recurring themes

**Why this trio:** Each demonstrates a different phase of the EverMemOS lifecycle:
- Arc Memory = Reconstructive Recollection (Phase 3 — the demo-winning phase)
- Shadow Memory = Semantic Consolidation (Phase 2 — pattern-aware dialogue)
- Imprint Continuity = Episodic Trace → Consolidation (Phase 1→2 — motif threading)

Together they show the full Memory → Reasoning → Action loop in 90 seconds.

---

## Timeline

```
Mar 15 (TODAY)     Preliminary submission — working integration, basic demo
Mar 16–22          Polish week 1 — Arc Memory UI, shadow memory, Imprint continuity
Mar 23–29          Polish week 2 — demo video, GitHub repo, community campaign
Mar 30–Apr 3       Final polish — demo rehearsal, edge cases, performance
Apr 4              Grand Finale — Computer History Museum, Mountain View
```

---

## Phase 0: Foundation (Today — March 15)

**Goal:** Preliminary submission with working EverMemOS integration.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 0.1 | Get EverMemOS API key from console.evermind.ai | Shruti | ☐ | Need this before anything else |
| 0.2 | Add `EVERMIND_API_KEY` + `EVERMIND_API_URL` to `.env.local` | Shayaun | ☐ | See INTEGRATION_REFERENCE.md § Setup |
| 0.3 | Create `src/lib/evermemos/client.ts` — typed API wrapper | Shayaun | ☐ | POST /memories, GET /memories/search, error handling |
| 0.4 | Wire coherence check → EverMemOS (Channel 1) | Shayaun | ☐ | After `CoherenceService.submitCheck()`, POST memory. See INTEGRATION_REFERENCE.md § Layer 1 |
| 0.5 | Wire myth events → EverMemOS (Channel 3) | Shayaun | ☐ | After `myth_events` insert. See INTEGRATION_REFERENCE.md § Layer 1 |
| 0.6 | Wire council sessions → EverMemOS (Channel 2) | Shayaun | ☐ | After council save. See INTEGRATION_REFERENCE.md § Layer 1 |
| 0.7 | Seed demo data — 5-7 synthetic MemCells across phases | Shruti | ☐ | Coherence checks showing arc: ENDING(Jan) → LIMINAL(Feb) → EMERGING(Mar) |
| 0.8 | Smoke test: POST a memory, search it back | Shayaun | ☐ | Verify Cloud API works. If issues → Supabase pgvector fallback |
| 0.9 | Submit preliminary version on evermind.ai/activities | Shruti | ☐ | Basic README + working integration proof |

### Phase 0 Gate
- [ ] At least one data channel posting to EverMemOS successfully
- [ ] Search query returns stored memories
- [ ] Preliminary submission uploaded

---

## Phase 1: Arc Memory (March 16–20)

**Goal:** The headline feature — transformation narrative agent.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.1 | Create `/api/agent/arc` route | Shayaun | ☐ | Accepts `userId`, optional `?demo=true` |
| 1.2 | Build reconstructive query logic | Shayaun | ☐ | `retrieve_method: 'agentic'` — queries EverMemOS for transformation arc |
| 1.3 | Narrative generation prompt | Shruti | ☐ | Claude API call: memories in → natural language arc narrative out |
| 1.4 | Arc Memory UI component | Shruti | ☐ | Timeline visualization + narrative card. Frontier tokens. Framer Motion. |
| 1.5 | `/agent/arc?demo=true` flow | Shayaun | ☐ | Pre-seeded data, no auth required, judges can click through |
| 1.6 | Connect ImprintRenderer to arc view | Shruti | ☐ | Show Imprints along the timeline — this IS the Aha Case moment |

### Phase 1 Gate
- [ ] `/agent/arc?demo=true` returns a transformation narrative from EverMemOS data
- [ ] UI shows timeline + narrative + Imprint(s)
- [ ] Memory → Reasoning → Action loop is visible in one click

---

## Phase 2: Shadow Memory + Imprint Continuity (March 21–25)

**Goal:** Two supporting features that deepen the EverMemOS integration story.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1 | Shadow dialogue pre-query | Shayaun | ☐ | Before shadow session starts, query EverMemOS for past shadow encounters |
| 2.2 | Inject retrieved context into shadow prompt | Shayaun | ☐ | "Your shadow remembers..." — past themes woven into new session |
| 2.3 | Imprint motif query | Shayaun | ☐ | Before Imprint generation, query previous Imprints' motifs from EverMemOS |
| 2.4 | Motif continuity in semiotic compiler | Shruti | ☐ | Weave recurring motifs into new Imprint — "echoes your theme of sovereignty" |
| 2.5 | Demo flow for shadow + Imprint continuity | Both | ☐ | Decide: separate demo paths or integrated into Arc Memory view? |

### Phase 2 Gate
- [ ] Shadow dialogue references past shadow work from EverMemOS
- [ ] New Imprint acknowledges recurring motifs from stored history
- [ ] All three features demoed in under 90 seconds

---

## Phase 3: Demo + Community (March 26–April 3)

**Goal:** Win Popular Developer ($5K) + polish for Grand Finale.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.1 | Record 90-second demo video | Shruti | ☐ | Follow script in MEMORY_GENESIS_BRIEF.md § Demo Strategy |
| 3.2 | Create standalone GitHub repo or clean module | Shayaun | ☐ | `liminal-evermemos` — the integration layer others can learn from |
| 3.3 | Write README with EverMemOS vocabulary | Both | ☐ | "MemCell", "episodic trace", "reconstructive recollection" — by name |
| 3.4 | Deploy public `?demo=true` URL | Shayaun | ☐ | Judges must be able to click through without auth |
| 3.5 | Twitter campaign — demo video + "vote for inner life" | Shruti | ☐ | Day of submission, not after |
| 3.6 | LinkedIn post — founder angle + competition narrative | Shruti | ☐ | "Liminal Space was selected for Memory Genesis..." |
| 3.7 | Discord engagement — post in EverMind Discord | Both | ☐ | Community Impact = 30% of score. Be visible. |
| 3.8 | Prepare 5-minute live pitch for April 4 | Shruti | ☐ | Champion prize requires strong in-person pitch |
| 3.9 | Edge case hardening + error states | Shayaun | ☐ | What happens when EverMemOS is slow? Graceful fallbacks. |
| 3.10 | Final quality gates | Both | ☐ | type-check, lint, test, build — all green |

### Phase 3 Gate
- [ ] Demo video recorded and uploaded
- [ ] GitHub repo public with clean README
- [ ] Social campaign posted (Twitter + LinkedIn minimum)
- [ ] Public demo URL live and working
- [ ] Live pitch rehearsed

---

## Owner Summary

| Person | Primary responsibilities |
|--------|------------------------|
| **Shruti** | API key, demo data seeding, narrative prompts, UI components, demo video, social campaign, live pitch, brand/copy |
| **Shayaun** | EverMemOS client, API integration (all 3 channels), Arc Memory route, shadow/Imprint queries, GitHub repo, deployment, error handling |

**Division of labor principle:** Shayaun builds the pipes (data flowing to/from EverMemOS). Shruti builds what people see (UI, narrative, demo, campaign).

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| EverMemOS Cloud API down or slow | Can't demo | Supabase pgvector fallback — store memories locally, wire real EverMemOS before April 4 |
| `agentic` retrieval too slow for demo | Awkward pause in 90s video | Pre-cache demo queries. Use `hybrid` retrieval with targeted tags as backup. |
| GET-with-body API mismatch | Search queries fail | Check if `/memories/search` accepts query params vs POST body. INTEGRATION_REFERENCE.md has a warning. |
| Shadow dialogue has no persistence | Nothing to retrieve from EverMemOS | Wire shadow dialogue saves in Phase 0 (add to Channel 2), or use synthetic seed data |
| ImprintRenderer rendering issues on demo URL | Aha Case moment fails | Test on multiple browsers. Have a recorded fallback video of the Imprint rendering. |
| Low GitHub stars / community votes | Lose Popular Developer $5K | Start campaign early. Cross-post. Ask existing Liminal audience to star. |

---

## Infrastructure Checklist

- [ ] `.env.local` has `EVERMIND_API_KEY` + `EVERMIND_API_URL`
- [ ] EverMemOS Cloud API accessible (not just local Docker)
- [ ] Vercel deployment includes evermemos env vars
- [ ] `?demo=true` route bypasses auth
- [ ] Demo data seeded and retrievable
- [ ] `.vercelignore` excludes heavy dirs (pre-deploy check)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Mar 15 | Web over Desktop | Desktop adds Nextron build overhead with no guarantee judges can run it. Web = public URL judges click. Desktop differentiation not worth the risk for 20-day timeline. |
| Mar 15 | Killer trio (Arc + Shadow + Imprint) over single feature | Three features show all three EverMemOS phases. One feature only shows one phase. 30% Memory Integration score demands full lifecycle demo. |
| Mar 15 | Cloud API over Docker local | Docker requires MongoDB + ES + Milvus + Redis. Cloud API = one env var. Fallback: Supabase pgvector. |
| Mar 15 | Arc Memory as headline, not Interior Voice | Research sessions recommended leading with Interior Voice (Shadow Dialogue with memory) — more visceral in 90 seconds. Counter-argument: Arc Memory is the Phase 3 (Reconstructive Recollection) feature, which is what most competitors won't touch. Arc Memory also produces the visual timeline + ImprintRenderer integration = Aha Case moment. Shadow Memory is the emotional hook but Arc Memory is the technical differentiator. **Revisit after Phase 1 build** — if Shadow Memory demos better, swap lead order in the 90-second script. Both are being built regardless. |
| | | |

*Add decisions here as they're made.*
