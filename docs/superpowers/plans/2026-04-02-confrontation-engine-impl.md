# Confrontation Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the POC and PRD to reflect the "Interlocutor" concept — memory as confrontation, not perception — for the Memory Genesis Grand Finale (April 4, Computer History Museum).

**Architecture:** Two artifacts change: (1) the single-file POC HTML — all 3 scenes rewritten around claim/response/correction interactions, (2) the PRD markdown — reformatted from the approved design spec into principal-level PRD structure. All backend code (EverMemOS client, channels, EventBus, archetypes) stays untouched.

**Tech Stack:** HTML/CSS/JS (POC), Markdown (PRD). No build system. No dependencies.

**Spec:** `docs/superpowers/specs/2026-04-02-confrontation-engine-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `LIMINAL_EVERMEMOS_POC.html` | Rewrite | 3 scenes: Day 1 vs Day 90 confrontation, Council with standing, Disputable Arc |
| `docs/EVERMEMOS_PRD.md` | Rewrite | Principal-level PRD with persona, JTBD, flows, metrics, open questions |
| `docs/GRAND_FINALE_KIT.md` | Modify | Update pitch script and social copy to match confrontation concept |
| `docs/NARRATIVE_FRAME.md` | Modify | Update tagline framing and anti-patterns |

---

## Task 1: Rewrite POC Scene 1 — Day 1 vs Day 90

**Files:**
- Modify: `LIMINAL_EVERMEMOS_POC.html` (lines 366-434 — Scene 1 HTML, comment starts at 366, content div at 368; lines 8-352 — CSS; lines 576-670 — Scene 1 JS)

**What changes:** The memory toggle is removed. Scene 1 becomes a two-state comparison — Day 1 (the system has nothing to say) vs Day 90 (the system makes a claim, user responds). The hero moment is no longer "toggle memory on" — it's "the system has earned standing."

### Steps

- [ ] **Step 1: Replace Scene 1 HTML content**

Remove the memory toggle (`mem-toggle-wrap`), the `no-memory` div, and the `memLayer` div. Replace with:

**Day 1 state (visible by default):**
- Same 7-factor grid (keep existing factor display)
- Below the factors: a minimal response — `"Recorded."` in silver, low opacity
- Subtle label: `"Day 1 — The system doesn't know you yet."`

**Day 90 state (revealed on click/keypress):**
- Same 7-factor grid with the delta values visible
- Below the factors: **The Claim** — a confrontation card replacing the perception card:
  - Header: `"THE SYSTEM'S CLAIM"` (violet accent, like perception but with assertion language)
  - Assertion (1 line, bold): `"You've been avoiding connection for nine days."`
  - Evidence (specific MemCells): `"Jan 14: agency 82, connection 47. Today: agency 85, connection 44. Last time this gap appeared, connection collapsed to 31 by Feb 2."`
  - Edge (the part she won't like): `"Last time, you told yourself it was fine. It wasn't."`
- **Three response buttons:** `"Yes"` / `"No — here's what's happening"` / `"Show me the evidence"`
- When "No" is clicked: a text input appears with placeholder `"What's actually happening?"` and a brief simulated correction: `"I'm not avoiding it. I'm prioritizing differently this time."` — stored as a correction MemCell indicator
- When "Show me" is clicked: expand to show the raw MemCells with dates

**Transition control:** Replace the memory toggle with a `"Day 1 → Day 90"` button or use `M` key to switch between Day 1 and Day 90 states.

- [ ] **Step 2: Add new CSS classes for confrontation UI**

New classes needed:
- `.claim` — the confrontation card (replaces `.perception`). Violet left border, but assertion tone not observation tone.
- `.claim-assertion` — bold, 20px display font, the one-line position
- `.claim-evidence` — structured evidence block with MemCell citations and dates
- `.claim-edge` — italic, slightly rose-tinted, the uncomfortable part
- `.response-bar` — three-button row (Yes / No / Show me)
- `.response-btn` — pill button style, subtle borders
- `.response-btn.active` — selected state
- `.correction-input` — text input that appears on "No" click
- `.correction-text` — the user's correction displayed after submission
- `.evidence-expand` — expandable MemCell list (dates + content)
- `.day-label` — "Day 1" / "Day 90" state label
- `.day-toggle` — button or indicator to switch states

Reuse existing color variables (`--violet`, `--gold`, `--rose`, `--teal`). The claim card uses `--violet` border (system speaking) and `--rose` for the edge element.

- [ ] **Step 3: Rewrite Scene 1 JavaScript**

Replace `toggleMemory()` with `toggleDay()`:
- `dayState` variable: `'day1'` or `'day90'`
- Day 1: show factors without deltas, show "Recorded." message, hide claim
- Day 90: show factors with deltas (staggered animation), show claim card (staggered: assertion → evidence → edge → response bar)
- `M` key still works (calls `toggleDay()` instead of `toggleMemory()`)
- Click handlers on response buttons: "Yes" highlights green, "No" reveals correction input, "Show me" expands evidence panel
- Correction input: on Enter, show the correction text and a `"Correction stored as MemCell"` indicator
- **Note:** For hackathon demo, corrections are simulated in-memory only. Store as JS object `{ id, text, timestamp }` in a session array. Do not persist to localStorage.

Update `animateCheck()` to reset to Day 1 state.

- [ ] **Step 4: Test Scene 1 in browser**

Open `LIMINAL_EVERMEMOS_POC.html` in Chrome.
- Verify: Scene 1 loads showing Day 1 (factors visible, "Recorded." message, no claim)
- Press `M`: transitions to Day 90 (factors get deltas, claim card appears with staggered animation)
- Click "No": correction input appears
- Click "Show me": evidence panel expands with MemCell dates
- Press `M` again: returns to Day 1
- Arrow right: navigates to Scene 2

- [ ] **Step 5: Commit**

```bash
git add LIMINAL_EVERMEMOS_POC.html
git commit -m "feat(poc): rewrite Scene 1 — Day 1 vs Day 90 confrontation replaces memory toggle"
```

---

## Task 2: Rewrite POC Scene 2 — Council With Standing

**Files:**
- Modify: `LIMINAL_EVERMEMOS_POC.html` (lines 436-495 — Scene 2 HTML, lines 211-261 — Scene 2 CSS, lines 672-682 — Scene 2 JS)

**What changes:** The Council scene keeps its structure (retrieval → voices → synthesis) but the content changes to reflect archetypes with *standing* — they reference specific past interactions and confront with distinct styles.

### Steps

- [ ] **Step 1: Rewrite Scene 2 HTML content**

Keep the structural elements (retrieval panel, voice cards, synthesis). Change the content:

**Retrieval panel:**
- Label changes from `"EverMemOS · Retrieved before deliberation"` to `"MEMORY RETRIEVAL · 3 MemCells across 8 weeks"`
- Same three memory items but reworded to emphasize the *relationship*:
  - Jan 20: `"Council on sovereignty. Warrior urged action. You called it 'too aggressive' and dismissed it. (Your words, not mine.)"`
  - Feb 10: `"Threshold: 'The role I've been performing isn't mine anymore.' You named sovereignty before the system did."`
  - Feb 24: `"Shadow: 'Fear of being unseen.' Second encounter. You said 'it's different this time.' The data says it's the same pattern."`

**Voice cards — distinct confrontation styles:**

**Warrior (Rose, confronts bluntly):**
- Role label: `"Speaks first — unlike January, when you dismissed it"`
- Quote: `"You told me I was too aggressive. Then you spent three weeks stuck. I'm going to say it again: stop waiting for permission."`
- Memory annotation: `"In January, you dismissed the Warrior. In February, you dissolved the mask. Now the Warrior speaks first — and you're listening. Not because it changed. Because you did."`

**Sage (Violet, confronts by questioning):**
- Role label: `"Asks the question you're avoiding"`
- Quote: `"You've consulted me four times when clarity was above 80. Every time, you already knew the answer. What do you actually come to me for?"`
- Memory annotation: `"Sage consultations correlate with your highest clarity scores. The pattern isn't that the Sage makes you clear. It's that you seek the Sage when you're already clear — looking for permission to trust yourself."`

**Sovereign (Teal, confronts by waiting):**
- Role label: `"New presence — earned, not given"`
- Quote: `"The Warrior and the Sage have been arguing for weeks. I'm what happens when you stop choosing between them."`
- No memory annotation — the Sovereign's brevity IS the confrontation.

**Synthesis:**
- Change from observational to confrontational: `"The map is the motif. Sovereignty isn't ahead of you — it's what you've been building. The question isn't 'how do I step into what's next.' It's 'why do you keep asking permission for something you're already doing?'"`

- [ ] **Step 2: Add CSS for distinct confrontation voice styles**

Minor additions:
- `.voice.warrior .voice-quote` — slightly more assertive weight (font-weight 500 instead of 400)
- `.voice.sage .voice-quote` — ends with `?` — question styling (no special CSS needed, just noting the voice pattern)
- Memory annotations: make them more prominent than current (opacity 0.7 instead of 0.5 when visible, slightly larger font)

- [ ] **Step 3: Update Scene 2 JavaScript**

Same staggered animation as current — no structural change needed. Just verify the new content elements have the correct IDs for the animation sequence.

- [ ] **Step 4: Test Scene 2 in browser**

Navigate to Scene 2 (arrow right from Scene 1).
- Verify: retrieval panel fades in, then voices stagger in with memory annotations
- Verify: Warrior voice feels blunt, Sage voice ends with a question, Sovereign is brief
- Verify: Synthesis holds tension, doesn't resolve it

- [ ] **Step 5: Commit**

```bash
git add LIMINAL_EVERMEMOS_POC.html
git commit -m "feat(poc): rewrite Scene 2 — Council archetypes with standing and distinct confrontation styles"
```

---

## Task 3: Rewrite POC Scene 3 — The Disputable Account

**Files:**
- Modify: `LIMINAL_EVERMEMOS_POC.html` (lines 497-574 — Scene 3 HTML, lines 263-343 — Scene 3 CSS, lines 684-695 — Scene 3 JS, lines 697-725 — painting/trajectory generators)

**What changes:** Scene 3 becomes "The System's Account" — a structured claim about the arc that the user can mark up section by section. Paintings stay but are repositioned as visual evidence. The passive narrative paragraph becomes three disputable sections.

### Steps

- [ ] **Step 1: Rewrite Scene 3 HTML content**

**Header:**
- Change `arc-tag` from `"Reconstructive Recollection · 23 MemCells · 3 months"` to `"THE SYSTEM'S ACCOUNT · 23 MemCells · 3 months · Disputable"`
- Change `arc-title` from `"3 months of inner life, reconstructed from memory"` to `"The system's account of who you've been. Mark what's wrong."`

**Paintings:** Keep the three-painting layout. Add label above each: `"Visual evidence — [Phase]"`. Keep existing SVG generation code.

**Trajectory line:** Keep as-is.

**Replace the single narrative paragraph with three disputable sections:**

Each section has:
- Section header (phase name + month)
- The system's claim (2-3 sentences)
- Evidence cited (specific MemCells)
- **Three markup buttons:** `Accurate` / `Wrong` / `Missing something`
- When "Wrong" is clicked: brief simulated correction appears
- When "Missing" is clicked: brief simulated addition appears

**Section 1 — Where You Were (January / ENDING):**
- Claim: `"You entered January carrying an identity that no longer fit. Agency was high but masking low connection. The Warrior was present but you dismissed it as 'too aggressive.' The system reads this as avoidance — performing strength to avoid vulnerability."`
- Evidence: `"coherence-001 · Jan 6 — agency 82, connection 47 · coherence-003 · Jan 14 — Warrior dismissed"`
- Simulated "Wrong" correction: `"It wasn't avoidance. I genuinely didn't see the connection gap. That's different."`

**Section 2 — What Shifted (February / LIMINAL):**
- Claim: `"The structure cracked open in February. Coherence dropped. The mask-removal threshold on Feb 10 was the pivot — you named what was ending. Shadow work started. You told the shadow 'it's different this time.' The data says it was the same pattern."`
- Evidence: `"myth-002 · Feb 10 — mask_removal, sovereignty · shadow-001 · Feb 24 — 'fear of being unseen'"`
- Simulated "Wrong" correction: `"The shadow work WAS different. The first time I was performing. The second time I meant it."`

**Section 3 — Where You Are (March / EMERGING):**
- Claim: `"Something is crystallizing. Agency and clarity are at personal highs. The Warrior hasn't vanished — you consult it now instead of dismissing it. The system's read: sovereignty is the through-line. The question is whether the connection gap is a choice or a blind spot."`
- Evidence: `"coherence-007 · Mar 14 — agency 85, connection 44 · council-003 · Mar 10 — Warrior speaks first"`
- Simulated "Missing" addition: `"What's missing: the cost. The clarity came from cutting people off. That's not sovereignty — that's armor."`

**Motifs section:** Keep, but reword as "Recurring patterns the system detected" with the confrontation framing.

**Architecture section:** Keep the M → R → A loop and stats. Change category claim from `"Not a journal. Not a chatbot. A cognitive architecture for inner life."` to `"Not a mirror. An interlocutor. Memory gives the system standing."`

**Colophon:** Keep `"Built with EverMemOS · Liminal Space"` and `"Memory for who you're becoming."`

- [ ] **Step 2: Add CSS for disputable sections**

New classes:
- `.arc-section` — disputable section container (card style, like `.voice` but wider)
- `.arc-section-head` — section header with phase dot + month
- `.arc-section-claim` — the system's claim text (display font, italic)
- `.arc-section-evidence` — evidence citations (mono font, gold accents, like `.mem-item`)
- `.arc-markup` — three-button row (Accurate / Wrong / Missing)
- `.arc-markup-btn` — pill buttons, similar to `.response-btn`
- `.arc-markup-btn.accurate` — teal accent when selected
- `.arc-markup-btn.wrong` — rose accent when selected
- `.arc-markup-btn.missing` — gold accent when selected
- `.arc-correction` — correction/addition text that appears on Wrong/Missing click

- [ ] **Step 3: Update Scene 3 JavaScript**

- **Note:** The disputable sections don't exist in the current POC. The current Scene 3 has a single `<div class="arc-narr">` narrative paragraph and a `<div class="ph-details">` block. Task 3 Step 1 creates 3 entirely new `.arc-section` containers from scratch — this is new HTML, not a find-and-replace.
- Keep `animateArc()` structure but update element IDs for new sections
- Add staggered animation: paintings → trajectory → section 1 → section 2 → section 3 → motifs → architecture
- Add click handlers for markup buttons per section:
  - "Accurate": highlight button teal, show small "Confirmed" indicator
  - "Wrong": highlight button rose, reveal correction text below section
  - "Missing": highlight button gold, reveal addition text below section
- Keep painting generator and trajectory drawing code unchanged

- [ ] **Step 4: Test Scene 3 in browser**

Navigate to Scene 3 (arrow right from Scene 2).
- Verify: paintings load and animate in sequence
- Verify: three disputable sections appear with staggered animation
- Verify: clicking "Wrong" on Section 1 reveals the correction text
- Verify: clicking "Missing" on Section 3 reveals the addition text
- Verify: clicking "Accurate" on Section 2 highlights teal
- Verify: architecture section and colophon appear at bottom

- [ ] **Step 5: Commit**

```bash
git add LIMINAL_EVERMEMOS_POC.html
git commit -m "feat(poc): rewrite Scene 3 — disputable account with section markup replaces passive narrative"
```

---

## Task 4: POC Global Updates — Navigation, Key Hints, Bar

**Files:**
- Modify: `LIMINAL_EVERMEMOS_POC.html` (bar labels, key hints, global CSS tweaks)

**What changes:** Update the top bar labels, keyboard hints, and scene labels to match the new concept. Projector-readability fixes.

### Steps

- [ ] **Step 1: Update bar labels and key hints**

- Scene 1 bar label: `"1 / 3 · The Ritual"` (was `"1 / 3 · The Check"`)
- Scene 2 bar label: `"2 / 3 · The Council"` (unchanged)
- Scene 3 bar label: `"3 / 3 · The Arc"` (unchanged)
- Scene 1 bar memory indicator: Remove the `barMem` div from Scene 1. Replace with a `day-indicator` that shows `"Day 1"` or `"Day 90"`.
- Key hint: Change from `"← → to navigate · M to toggle memory"` to `"← → scenes · M to toggle Day 1 / Day 90"`
- Scene 2 and 3 bar: Keep `"Memory On"` indicator (these scenes always show memory-informed state)

- [ ] **Step 2: Projector-readability CSS fixes**

- Increase painting SVGs from 200×200 to 260×260 (update `width` and `height` attributes on SVG elements AND in `genPainting()` function's `sz` variable)
- Increase `.factor-name` from `7px` to `9px`
- Increase `.factor-delta` from `9px` to `10px`
- Increase `.key-hint` opacity from `0.2` to `0.35`
- Increase `.factor-bar` height from `2px` to `3px`
- Increase `.lc-tag` from `6.5px` to `8px`
- Increase `.bar-scene-label` from `9px` to `10px`
- Audit all remaining projector-facing labels:
  - `.mem-item-date`: currently `9px` — verify legible alongside 260px paintings
  - `.ph-name`: currently `8px` — bump to `9px` for consistency
  - `.voice-role`: currently `9px` — check if needs bump
  - `.motif-name`: currently `7.5px` — bump to `9px`
  - `.st` (stats): currently `7.5px` — bump to `9px`

- [ ] **Step 3: Test full navigation flow**

Open in Chrome. Full-screen the window.
- Scene 1: Day 1 state visible. Press M → Day 90. Press M → Day 1.
- Arrow right → Scene 2 animates in.
- Arrow right → Scene 3 animates in.
- Click scene dots — all 3 navigate correctly.
- Arrow left from Scene 1 — no action (doesn't go negative).
- Check at 1080p resolution (resize window to 1920×1080) — text readable, paintings visible.

- [ ] **Step 4: Commit**

```bash
git add LIMINAL_EVERMEMOS_POC.html
git commit -m "feat(poc): update nav labels, key hints, projector-readability fixes"
```

---

## Task 5: Rewrite the PRD

**Files:**
- Rewrite: `docs/EVERMEMOS_PRD.md`
- Reference: `docs/superpowers/specs/2026-04-02-confrontation-engine-design.md`

**What changes:** The PRD is rewritten from the approved spec. The spec has the right content — the PRD reformats it into the principal-level document structure (status strip, standalone exec summary, conclusion-first sections, decision/rationale separation, consistent section anatomy, visible open questions).

### Steps

- [ ] **Step 1: Write the PRD**

**Section mapping from spec to PRD:** The PRD reorders sections from the spec. Spec Sections 1-7 + 9 are reorganized into PRD sections 1-8, with an added Exec Summary as front-matter and a combined "What Changes" table (Spec Section 10). Spec sections 11 (Hackathon Demo) and 12 (Code Mapping) are folded into PRD appendices.

Structure (each section follows Decision → Evidence → Risks → Open Questions):

```
---
Status strip (author, date, version, status, reviewers)
---

# Executive Summary (stands alone — the complete argument compressed)

## 1. The Problem
Decision: Memory as perception is wrong. Replace with memory as confrontation.
Evidence: Three failures of current concept.
Risks: Current users may expect the old model.
Open: Is there overlap?

## 2. The Persona — Maya
Decision: Specific human, specific moment.
Evidence: Empathy map, needs table, pains table.
Risks: Constructed, not validated. Narrow band.
Open: Male Maya? Minimum self-awareness threshold?

## 3. The Job
Decision: Confrontation-based self-knowledge.
Evidence: JTBD statement. Critical pain (unreliable self-narration).
Risks: Assumes user values truth over comfort.
Open: Is there a non-confrontation entry point?

## 4. Product Thesis — Memory Enables Standing
Decision: Claim → Response → Correction is the atomic unit of value.
Evidence: 18 months of learnings (correction loop, pattern > score, D7 > D1).
Risks: Flywheel depends on correction quality improving claims.
Open: How fast does the flywheel spin?

## 5. Four Workflows
(Ritual, Confrontation, Council, Arc — from the spec)

## 6. Confrontation Tone
(Three registers + safety guardrails)

## 7. What EverMemOS Uniquely Enables
(Standing, not perception)

## 8. Metrics
(Correction rate, return-after-correction, claim specificity, self-narrative convergence)

## 9. Open Questions
(Ranked by severity with "Blocks" column)

## 10. What Changes
(Table: current vs reconceived)

## Production Context
(271 routes, 125 migrations, 16th handler, fire-and-forget)

---
Memory for who you're becoming. Built with EverMemOS.
```

- [ ] **Step 2: Include presenter notes as HTML comments**

Add `<!-- PRESENTER NOTE: -->` comments at section breaks with timing cues and demo transitions, matching the GRAND_FINALE_KIT pitch script. These notes should map to the reconceived demo flow (Day 1 vs Day 90, Council with standing, Disputable Account).

- [ ] **Step 3: Verify PRD reads as standalone document**

Read the executive summary in isolation. Does it contain: the bet, the persona, the job, the scope, the risk, and the ask? If someone reads only page one, do they know everything?

- [ ] **Step 4: Commit**

```bash
git add docs/EVERMEMOS_PRD.md
git commit -m "feat(prd): complete rewrite — confrontation engine with persona, JTBD, flows, metrics"
```

---

## Task 6: Update Grand Finale Kit and Narrative Frame

**Files:**
- Modify: `docs/GRAND_FINALE_KIT.md`
- Modify: `docs/NARRATIVE_FRAME.md`

### Steps

- [ ] **Step 1: Update GRAND_FINALE_KIT.md pitch script**

Rewrite the 5-minute pitch script to match the reconceived demo:

```
[0:00-0:30] Open on Imprints. "This is 3 months of inner transformation."
[0:30-1:30] Day 1 vs Day 90. "Day 1: Recorded. Nothing. Day 90:
  The system has something to say." Show claim. Show "No."
  Show correction. "The argument IS the product."
[1:30-2:30] Council. "The archetypes remember." Warrior's callback.
  "This isn't wisdom. It's a relationship."
[2:30-3:30] The Arc. "The system's account." Show markup.
  "She marked this wrong. That correction made the next one better."
[3:30-4:15] Architecture. "3 channels, 16th handler. Memory doesn't
  make the system smarter. It makes it harder to dismiss."
[4:15-4:50] "The correction loop IS the product.
  Memory for who you're becoming."
```

Update the 90-second video script similarly.

- [ ] **Step 2: Update social campaign copy**

Update Twitter thread, LinkedIn post, and Discord post to reference confrontation, not perception. Key phrases to change:
- "reflects your arc back to you" → "holds claims about your arc that you can argue with"
- "the system perceives" → "the system confronts"
- "transformation narrative" → "disputable account"
- "Memory → Reasoning → Action" → keep, but add "The correction loop IS the product"
- Keep production stats (271 routes, 125 migrations)
- Keep demo URL

- [ ] **Step 3: Update NARRATIVE_FRAME.md**

Update the technical narrative, elevator pitch, and Do Say / Do NOT Say lists:
- Add to Do Say: "confrontation," "standing," "the receipts," "disputable account," "correction loop"
- Add to Do NOT Say: "perception card," "the system surfaces," "memory toggle"
- Update elevator pitch to lead with the JTBD, not the technology

- [ ] **Step 4: Commit**

```bash
git add docs/GRAND_FINALE_KIT.md docs/NARRATIVE_FRAME.md
git commit -m "docs: update pitch script, social copy, narrative frame for confrontation concept"
```

---

## Task 7: Final Verification

**Files:** All modified files

### Steps

- [ ] **Step 1: Full POC walkthrough**

Open `LIMINAL_EVERMEMOS_POC.html` in Chrome at 1920×1080.
- Scene 1: Day 1 → Day 90 (M key). Claim appears. Response buttons work. Correction input works. "Show me" expands evidence.
- Scene 2: Archetypes animate in sequence. Memory annotations visible. Warrior is blunt, Sage questions, Sovereign is brief.
- Scene 3: Paintings load. Three disputable sections animate. Markup buttons work (Accurate/Wrong/Missing). Corrections appear.
- Navigation: arrow keys work, dots work, no console errors.
- Projector test: text readable at 1080p. Paintings visible. Factor labels legible.

- [ ] **Step 2: PRD standalone read**

Read `docs/EVERMEMOS_PRD.md` from top. Verify:
- Status strip present
- Executive summary is complete argument (bet, persona, job, scope, risk, ask)
- Each section: Decision → Evidence → Risks → Open Questions
- Presenter notes in HTML comments
- No references to "perception card," "memory toggle," or the old concept

- [ ] **Step 3: Pitch rehearsal dry run**

Read through `docs/GRAND_FINALE_KIT.md` pitch script while clicking through POC. Verify:
- Script timing matches POC scene transitions
- Every demo moment referenced in the script exists in the POC
- No references to the old concept

- [ ] **Step 4: Final commit**

```bash
git status
git add -A
git commit -m "chore: final verification pass — confrontation engine POC + PRD complete"
```

---

## Execution Order and Time Estimates

| Task | Depends on | Estimated time |
|------|-----------|---------------|
| Task 1: Scene 1 (Day 1 vs Day 90) | — | 45 min |
| Task 2: Scene 2 (Council with standing) | — | 20 min |
| Task 3: Scene 3 (Disputable Account) | — | 35 min |
| Task 4: Global POC updates | Tasks 1-3 | 15 min |
| Task 5: PRD rewrite | — | 30 min |
| Task 6: Kit + Narrative updates | Task 5 | 15 min |
| Task 7: Final verification | Tasks 1-6 | 15 min |

**Total: ~3 hours**

Tasks 1, 2, 3, and 5 are independent and can be parallelized. Tasks 4 and 6 depend on prior tasks. Task 7 is the final gate.

**Critical path:** Tasks 1 + 4 + 7 (Scene 1 is the hero moment for the demo).

**If time-constrained:** Ship Tasks 1, 2, 3, 4 (POC) first. PRD and Kit updates can happen morning of April 4 if needed. The POC is what judges see. The PRD is what Shruti presents from.
