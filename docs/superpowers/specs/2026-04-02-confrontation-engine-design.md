---
title: "The Interlocutor — Structured Confrontation Engine for Inner Life"
author: Shruti Rajagopal
date: 2026-04-02
version: 1.0
status: Draft — awaiting founder review
context: Memory Genesis Grand Finale (April 4, Computer History Museum)
reviewers: Shruti Rajagopal (product), Shayaun Nejad (engineering)
---

# The Interlocutor

**Liminal Space × EverMemOS — Product Concept v2**

---

## Executive Summary

**The bet:** Memory doesn't enable perception. Memory enables *standing* — the ability to hold a position grounded in months of evidence the user has forgotten or revised. Liminal Space is a structured confrontation engine for people in psychological transition. It captures inner state daily, accumulates evidence via EverMemOS, and makes claims about who the user is becoming that are specific enough to argue with. Value is generated in the argument, not the observation.

**The persona:** Maya, 34 — in the middle of a major life transition (professional ascent + personal destabilization + first structured inner work). She doesn't need validation, tracking, or coaching. She needs something that holds the unedited record of who she's been and won't let her quietly revise the story.

**The job:** "When I'm changing and can't tell if it's growth or collapse, I want something that holds a claim about who I've been — so I can argue with it and find out who I actually am."

**The scope:** Four workflows — Ritual (daily capture), Confrontation (the atomic unit of value), Council (archetypes with memory), Arc (the disputable account). All use the existing EverMemOS integration (3 channels, 16th EventBus handler, fire-and-forget). The reconception is in what the product *does* with memory, not the infrastructure.

**The risk:** The central calibration problem is when to confront and when to shut up. A system that confronts too often is annoying. A system that never confronts is a dashboard. This is the #1 open question and the #1 engineering challenge.

**The ask:** Rewrite the PRD and POC around this concept for the April 4 Grand Finale. The code stays. The concept changes completely.

---

## 1. The Problem

**Decision:** The current product concept — memory as passive perception — is wrong. It needs to be replaced with memory as confrontation.

**Evidence:**

The current concept stores psychological data, retrieves it over time, and reflects it back as narrative text. Three "moments of perception" show the user text cards about their arc. The memory toggle in the POC shows: without memory = a number, with memory = a number plus a paragraph.

This fails for three reasons:

1. **No persona, no JTBD.** The current PRD has no user. It has a technology (EverMemOS), an ontology (7 factors, 12 archetypes), and an architecture (3 channels, 3 lifecycle phases). Features were built by mapping the API's capabilities to the ontology's data structures. But nobody asked: who is this person, what are they hiring this product to do, and what does "done" look like?

2. **Observation is not a product.** The system observes, retrieves, and narrates — but doesn't change the user's experience in the moment. Reading "your agency went up over 11 weeks" is intellectually interesting but experientially inert. A perception card is a report with better typography.

3. **The language is doing 10x the work of the experience.** "Cognitive architecture," "reconstructive recollection," "the system perceives" — strong vocabulary wrapping a weak interaction. A judge who clicks through the POC sees: scores, text cards, more text cards.

**Risks/Limits:**

- This critique applies to the concept, not the code. The infrastructure (EverMemOS client, channels, EventBus, archetypes, ImprintRenderer) is sound.
- The reconception preserves all existing code and data structures.

**Open Questions:**

- Is the current user base (however small) using the product in the "perception" mode and finding value? If so, the reconception should preserve that path as a fallback.

---

## 2. The Persona

**Decision:** Maya — a specific human in a specific life moment, not a demographic segment.

**Evidence:**

### Maya, 34

Creative director at a mid-stage startup. Recently promoted. Recently divorced. Recently started therapy for the first time. Three things happening at once: most powerful professional position of her life, most destabilized personal moment, and for the first time doing structured inner work that gives her language for the experience.

She's not broken. She's in transition. She knows this intellectually. She can't feel it yet.

### Empathy Map

| Dimension | Detail |
|-----------|--------|
| **Says** | "I feel like a different person every week." "My therapist gets it but I only see her twice a month." "I keep having the same realization over and over." |
| **Thinks** | "Am I actually changing or just rearranging?" "The bold version of me last Tuesday — was that real or manic?" "I can't hold onto the insight once the feeling fades." |
| **Does** | Journals sporadically, never re-reads. Screenshots therapy homework, forgets it exists. Tells friends a clean narrative that doesn't match the mess she feels. |
| **Feels** | Disoriented — ground is shifting. Impatient — change too slow to feel, too fast to track. Distrustful of her own narration. Hungry for structure, not prescription. |

### What Maya Does NOT Want

- A mood tracker (she's not tracking mood — she's tracking who she's becoming)
- A chatbot that validates her (she has friends for that)
- A dashboard of self-metrics (she doesn't want to optimize herself)
- Homework between therapy sessions (she'll resist anything prescribed)
- AI that's "supportive" or "encouraging" (she wants rigor, not comfort)

### What Maya Would Pay For

Something that holds the thread between her therapy sessions, between her good weeks and bad weeks, between the version of her that made the bold move and the version that second-guessed it — and confronts her with the difference, so she can discover for herself that they're the same arc.

**Risks/Limits:**

- Maya is a constructed persona, not a validated one. She's synthesized from 18 months of building and the behavioral signals in the production app.
- The persona skews toward high-self-awareness users already doing inner work. Users who aren't in therapy or don't have language for their experience may need a different onramp.

**Open Questions:**

- What's the minimum self-awareness threshold for this product to work? Can the confrontation model serve someone who isn't already in some form of reflective practice?
- Is there a male Maya? The persona is gendered — is the product?

---

## 3. Needs, Pains, and Job-to-Be-Done

**Decision:** The JTBD is confrontation-based self-knowledge, not longitudinal self-tracking.

**Evidence:**

### Needs (functional → emotional → identity)

| Level | Need | Currently unmet because |
|-------|------|------------------------|
| Functional | Structured capture of inner state without long-form writing | Journaling is effortful, inconsistent, produces unstructured data |
| Functional | Something that remembers across weeks and months | Every app resets. Therapy is biweekly. Her own memory edits the narrative. |
| Functional | Distinguish "stuck in a loop" from "spiral moving upward" | Without external reference across time, these feel identical from inside |
| Emotional | Confidence that change is happening even when it doesn't feel like it | Transition is destabilizing. Without evidence of trajectory, uncertainty → anxiety. |
| Emotional | Something that takes her seriously — rigor, not comfort | AI apps patronize. She wants substance. |
| Identity | To know who she's becoming — as a discovery, not an optimization target | She's not heading toward a target self. She's trying to see what's emerging. |

### Pains

| Pain | Severity | Frequency | Current workaround |
|------|----------|-----------|-------------------|
| Insight evaporates between therapy sessions | High | Biweekly | Scribbled notes she never re-reads |
| Can't tell if a pattern is recurring or new | High | Weekly | Asks friends, gets reassurance instead of truth |
| **Self-narration is unreliable** — she edits the story unconsciously | **Critical** | **Constant** | **Doesn't realize she's doing it** |
| No continuity between good days and bad days | Medium | Daily | Treats each day as disconnected |
| AI tools are shallow — validation, not substance | Medium | Every time she tries one | Deletes the app |

### The Critical Pain

Self-narration is unreliable. Maya tells herself a story about who she is and how she's changing. That story is always plausible but not always true. She rounds up on good days, rounds down on bad days. The version she tells friends is coherent in ways the actual experience isn't.

She doesn't need a system that narrates her arc for her. She needs a system that holds the actual record and says "here's what actually happened" so she can push back against her own revisionism.

### The Job

> **When** I'm in the middle of becoming someone I don't fully recognize yet,
> **I want** a system that holds the unedited record of who I've been and makes claims about the shape of my change,
> **So that** I can confront those claims — agree, disagree, correct — and in doing so, discover what I actually believe about who I'm becoming.

**Risks/Limits:**

- The JTBD assumes the user values truth over comfort. Some users in transition want reassurance, not confrontation. This product is not for them — and the PRD should say so explicitly.
- "Unreliable self-narration" as the critical pain is a strong claim. It's supported by the production learning ("the correction loop IS the product") but hasn't been validated with user research.

**Open Questions:**

- Is there a version of this product for people who aren't ready for confrontation yet? Or is that a different product?

---

## 4. Product Thesis

**Decision:** Memory enables standing. The system is an interlocutor — it builds a relationship over months, holds the forensic record, and makes claims specific enough to argue with.

**Evidence:**

### Why Memory Enables Standing (Not Perception)

A system without memory can observe you. A system with memory can argue with you — because it was there, it remembers what you said, and it holds the record you've been unconsciously editing.

Three properties of EverMemOS make this possible:

| Property | What it enables | Why it matters for confrontation |
|----------|----------------|----------------------------------|
| **Episodic trace** (MemCells accumulate over months) | The system can cite "January 14" specifically | Claims are grounded in evidence, not pattern-matching. Harder to dismiss. |
| **Semantic consolidation** (patterns detected across MemScenes) | The system can say "this is the 3rd time this configuration has appeared" | Recurring patterns become confrontable — "you've been here before." |
| **Reconstructive recollection** (agentic retrieval rebuilds arc) | The system can hold a position on the *shape* of the user's change | The arc becomes a disputable account, not a passive narrative. |

### The Core Interaction: Claim → Response → Correction

Every surface in the product runs the same loop:

```
System makes a claim (grounded in MemCells)
  → User responds (agree / disagree / correct)
    → Response becomes a MemCell (highest-signal data)
      → Future claims incorporate the correction
        → The system gets harder to dismiss over time
```

This is the flywheel. The more Maya argues with the system, the better the system knows her, the more precise the confrontations become, the more productive the arguments become.

### What This Is NOT

- Not a dashboard that shows you numbers
- Not a chatbot that asks how you're feeling
- Not a therapist (doesn't treat, doesn't prescribe, doesn't comfort)
- Not a journal (doesn't ask you to write)
- Not a mirror (doesn't just reflect — takes a position)

The closest analogue: a sparring partner who has been watching your footage for months and knows your patterns better than you do.

**Risks/Limits:**

- The line between confrontation and aggression is thin. Tone calibration is critical. See Section 6 (Confrontation Tone).
- "The system gets harder to dismiss over time" assumes corrections improve future claim quality. This needs to be measured, not assumed.

**Open Questions:**

- How fast does the flywheel spin? How many corrections before the system's claims feel meaningfully more precise?

---

## 5. Four Workflows

**Decision:** Four distinct workflows, with the Confrontation as the atomic unit of value. The Ritual feeds it. The Council deepens it. The Arc contextualizes it.

### Flow 1: The Ritual (Daily Capture)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | User-initiated, morning or evening |
| **Duration** | 30-90 seconds |
| **Core interaction** | Rate 7 factors (1-10) → system records → system speaks (Day 4+) |
| **Memory role** | Episodic trace stored. Claim generated from accumulated MemCells. |
| **EverMemOS phase** | Episodic Trace (store) |

**Behavior:**

Days 1-3: "Recorded." No claim. The system admits when it doesn't know you yet. This restraint builds trust — a system that's honest about its ignorance is more credible when it later claims to see a pattern.

Day 1 empty state: "I don't know you yet. Come back for three days and I'll start to see something." This creates anticipation without pretending.

Day 4+: After the check, one claim. Not a summary ("your agency is 85"). A position:
- "You've been avoiding connection for nine days."
- "This is the same configuration as January 14."
- "You say you're stuck. Your data says otherwise."

User responds: **Yes** (agreement MemCell) / **No — here's what's actually happening** (correction MemCell) / **Show me** (evidence view: specific MemCells cited by date).

**Engineering note:** For the hackathon demo, claims are hardcoded to the seeded dataset. For production, claims are generated by Claude with a structured prompt that takes the latest check + retrieved MemCells as context. Rules-based triggers determine *when* to generate a claim (not every check — only when evidence is strong enough). Claude determines *what* the claim says.

### Flow 2: The Confrontation (The Product)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | System-initiated, when evidence threshold is met |
| **Duration** | 2-5 minutes |
| **Core interaction** | Assertion + Evidence + Edge → Agree / Disagree / "It's different this time" |
| **Memory role** | Consolidation detects pattern. Retrieval provides receipts. Correction becomes highest-signal MemCell. |
| **EverMemOS phase** | Semantic Consolidation (detect) + Episodic Trace (cite) |

**This is the atomic unit of value.** If Maya hires Liminal Space for one thing, it's this.

**Confrontation structure (three parts):**

1. **The assertion.** One sentence. A position, not a observation. "You're in the same configuration as January 14."
2. **The evidence.** Specific MemCells cited by date. "On January 14: agency 82, connection 47. Today: agency 85, connection 44." The receipts.
3. **The edge.** The part the user won't like. "Last time, you told yourself it was fine. Connection collapsed to 31 by February 2."

**Trigger conditions (when the system confronts):**

| Trigger | Minimum evidence | Tone register | Example |
|---------|-----------------|---------------|---------|
| Recurring configuration | ≥2 prior occurrences with same factor pattern (±10%), ≥4 MemCells | **Direct** (2nd occurrence) or **Pointed** (3rd+) | "This agency/connection gap has appeared 3 times" |
| Self-narrative divergence | User correction MemCell contradicts current factor scores, ≥2 week delta | **Reframing** | "You said 'stuck' but agency rose 40 points" |
| Threshold crossed | Factor hits new personal high or low, ≥3 weeks baseline data | **Direct** | "Lowest connection score in 8 weeks" |
| Motif recurrence | Same motif tag in ≥3 threshold moments across ≥4 weeks | **Pointed** (uses user's own prior words) | "'Sovereignty' in 4 threshold moments" |

**Minimum evidence bar (v1 defaults):** ≥4 relevant MemCells AND ≥14 days of data AND ≥2 factors with >15-point delta from user's personal baseline. Below that threshold, the system hasn't earned standing. This is the #1 calibration parameter. Adjustment dial: each step = ±1 MemCell or ±5 factor points.

**For the hackathon demo:** Triggers are hardcoded to the seeded dataset. Post-demo, the production trigger logic defined above ships as v1 with conservative thresholds (high evidence bar), tuned by monitoring correction rate (see Section 8).

**User response:**
- **"Yes."** — Agreement MemCell. The system's claim was accurate.
- **"No."** — System asks: "What's actually happening?" Free text, 1-2 sentences. Stored as correction MemCell tagged `self-narrative:correction`. These MemCells receive a retrieval boost (tag-weighted) so they surface in future claim generation.
- **"It's different this time."** — Variant of No. System asks for the difference. Stored as correction with `context:differentiation` tag. Next time the system sees this configuration, it holds both the pattern AND the differentiation.
- **"Show me."** — Evidence view expands. Every MemCell cited, with dates, scores, and the user's own prior words. The receipts.

**Engineering note:** "Show me" should be accessible from every claim, not just as a third option. Design the evidence view as a first-class surface. Consider making evidence the *default* state with the assertion as a header — so the user always sees the receipts.

### Flow 3: The Council (Archetypes With Standing)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | User-initiated, or from a confrontation ("I disagree and want to think it through") |
| **Duration** | 5-10 minutes |
| **Core interaction** | Archetypes speak with memory of prior relationship → User pushes back |
| **Memory role** | Hybrid retrieval injects relationship history into archetype prompts |
| **EverMemOS phase** | Semantic Consolidation (pattern context) + Episodic Trace (specific citations) |

**What memory changes:**

Without memory, archetypes are fortune cookies — generic wisdom from a personality template. With memory, they are characters in an ongoing relationship.

- **Warrior** confronts bluntly: "Last time you asked about sovereignty, you told me I was too aggressive and dismissed what I said. Then you spent three weeks stuck."
- **Sage** confronts by asking questions: "You've consulted me four times when clarity was above 80. What do you actually come to me for?"
- **Sovereign** confronts by waiting — saying less, not more. Presence as confrontation.

Each archetype has a distinct confrontation style that matches its personality. Memory annotations under each voice explain *why* this response differs from a non-memory response, citing specific MemCells.

**Archetype availability:**

Base set available from Day 1 (Warrior, Sage, Explorer, Caregiver). Others unlock as the arc develops — the Sovereign doesn't appear until the system detects integration-phase indicators. For the hackathon demo, availability is hardcoded. For production, unlock conditions are defined per archetype (Phase 2).

### Flow 4: The Arc (The Disputable Account)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Weekly cadence or on-demand. NOT the primary experience. |
| **Duration** | 5-15 minutes |
| **Core interaction** | System's account presented as structured claim → User marks up section by section |
| **Memory role** | Agentic retrieval reconstructs full MemScene. Corrections reshape future reconstructions. |
| **EverMemOS phase** | Reconstructive Recollection (full arc) |

**Structure of "The System's Account":**

Three sections, each independently disputable:

1. **Where you were.** Phase, dominant factors, state of archetype relationships. Specific dates. Accompanied by the earliest-phase Imprint painting.
2. **What shifted.** Threshold moments, shadow encounters, key confrontations. What Maya agreed with. What she disputed. Accompanied by the middle-phase Imprint.
3. **Where you are.** Current state. The through-line the system perceives. What it can't see (explicit acknowledgment of limits). Accompanied by the current Imprint.

**Markup interaction (section-level):**

For each section, Maya marks: **Accurate** / **Wrong** / **Missing something** — with optional free text per section. Each markup becomes a correction MemCell scoped to that phase of the arc.

**Imprints as visual evidence:**

The three paintings aren't decorative. They're generated from the coherence data of each phase. "This is what your state data looked like in January. This is March. The difference is visible before you read a word."

---

## 6. Confrontation Tone

**Decision:** Three tonal registers, triggered by context. The system calibrates, not the user.

| Register | When | Example | Emotional effect |
|----------|------|---------|-----------------|
| **Direct** | Clear pattern, strong evidence, user has history with the pattern | "You've been avoiding connection for nine days." | Bracing. Can't hide from it. |
| **Reframing** | User's self-narrative contradicts the data | "You say you're stuck. Your agency has risen 40 points. You're not stuck — you're advancing on one axis and retreating on another." | Disorienting in a productive way. |
| **Pointed** | User has made a prior correction that contradicts current behavior | "Last time this happened, you told me you were 'just focusing on work.' Are you focusing on work right now?" | The system remembers what you said. Uses your own words. |

**The line between confrontation and aggression:**

- The system NEVER evaluates ("you're doing this wrong")
- The system NEVER prescribes ("you should focus on connection")
- The system NEVER alarms ("warning: pattern detected")
- The system ALWAYS cites evidence (no claim without receipts)
- The system ALWAYS offers "Show me" (the user can verify every claim)
- The system ALWAYS accepts correction gracefully (disagreement is data, not failure)

**The difference between a good therapist and a bad one is timing, not content.** The system has the content (the MemCells). The tone register determines the timing.

---

## 7. What EverMemOS Uniquely Enables

**Decision:** Position the integration as "memory gives the system standing" — not "we use all three API phases."

| Flow | Without EverMemOS | With EverMemOS |
|------|-------------------|----------------|
| Ritual | Score recorded, forgotten tomorrow | Score becomes evidence the system can cite against you months later |
| Confrontation | Can only comment on today's check | Can say "you were here before on January 14" — specific, grounded, impossible to hand-wave |
| Council | Archetypes give generic wisdom | Archetypes remember what you said, what you dismissed, what you followed through on — they have *relationship* |
| Arc | Can't exist | Agentic retrieval reconstructs the arc as a disputable account, not a passive narrative |

**The memory doesn't make the system smarter. It makes the system harder to dismiss.**

---

## 8. Metrics

**Decision:** Three primary metrics centered on the confrontation loop.

| Metric | Definition | Target | Why |
|--------|-----------|--------|-----|
| **Correction rate** | % of confrontations where user disagrees and corrects | 20-40% | Too high = system is wrong. Too low = system is unchallenging. Sweet spot = productive argument. |
| **Return-after-correction** | % of users who return within 24h after submitting a correction | >80% | If corrections feel productive, retention should be *higher* after corrections, not lower. This is the flywheel indicator. |
| **Claim specificity** | Average # of MemCell citations per confrontation | ≥3 | Claims without specific evidence are generic observations. The receipts are the product. |
| **Self-narrative convergence** (Phase 2) | % of Arc sections user marks "Accurate" | >70%, trending up over time | Outcome metric. If confrontations are working, the user and system should converge on the arc's shape over months. |

**Guardrails:**

| Signal | Threshold | Action |
|--------|-----------|--------|
| Correction rate >60% for 7 days | System is wrong too often | Raise minimum evidence bar. Reduce confrontation frequency. |
| Correction rate <10% for 7 days | System is unchallenging | Lower evidence threshold. Increase confrontation specificity. |
| Ritual abandonment rate rises >5% after confrontation launch | Confrontations are annoying, not productive | Reduce frequency. Check tone calibration. |
| Day 1 → Day 3 retention <40% | Empty state isn't creating anticipation | Redesign Day 1-3 experience. |
| User reports feeling attacked or judged | Any instance | Manual review: (1) claims were factual, (2) evidence view was offered, (3) tone register was context-appropriate. If all pass, reframe as productive tension. If any fail, adjust claim generation and reduce to Direct register only. |

---

## 9. Open Questions (ranked by severity)

| # | Question | Severity | Blocks | Working POV | How to answer | Decision deadline |
|---|----------|----------|--------|-------------|---------------|-------------------|
| 1 | **When to confront vs. shut up?** The trigger logic is the central calibration problem. | Critical | v1 launch | v1 defaults defined in Section 5: ≥4 MemCells, ≥14 days, ≥2 factors with >15-point delta. Hackathon uses hardcoded triggers. But thresholds need tuning against real correction rates. | Ship v1 defaults. Measure correction rate for 30 days. Adjust dial (±1 MemCell or ±5 factor points per step). | Pre-launch. Hackathon: hardcoded. |
| 2 | **Do corrections actually improve future claim quality?** "Highest-signal data" is an assumption. | High | v1.1 (scaling) | Yes — correction MemCells with `self-narrative:correction` tag receive retrieval boost. But the boost weight is unspecified. | Run 10 correction → future confrontation cycles. Grade whether correction-informed claims are more accurate (3 evaluators, rubric-scored). | 30 days post-launch |
| 3 | **Is "Show me" the default or a drill-down?** Evidence might need to be the primary view. | Medium | Design handoff | Start with evidence visible by default. Let users collapse once they trust the system. Trust is earned, not assumed. | A/B test evidence-default vs. claim-default. Measure correction rate + claim dismissal rate in each. | 60 days post-launch |
| 4 | **What's the minimum self-awareness threshold?** Can this work for users not already in reflective practice? | Medium | Onboarding design | Probably not for V1. The confrontation model assumes the user has language for inner experience. | Test with 5 users who aren't in therapy or structured inner work. If >3 find value, the threshold is lower than assumed. | V2 planning |
| 5 | **Is 30 seconds enough for honest signal?** 4 seconds per factor might be too fast. | Low | V2 | Test 30s vs. 60s vs. 90s. The learning "structured measurement > open-ended chat" supports structured, but doesn't specify speed. | Measure factor-score variance across check durations. Higher variance = more thoughtful = better signal. | V2 planning |
| 6 | **Signal decay.** Does a correction from 8 weeks ago weight equally with one from 8 days ago? Do confrontations based on stale MemCells feel less credible? | Low | Scaling | No time-decay in v1. All MemCells weighted equally by retrieval. Monitor whether users dispute old-evidence claims more than recent-evidence claims. | Post-v1 analysis of correction rate segmented by evidence age. | V2 planning |

---

## 10. What Changes From the Current PRD

| Dimension | Current (v1) | Reconceived (v2) |
|-----------|-------------|-------------------|
| Persona | None | Maya — specific human, specific moment, specific needs |
| JTBD | Implicit: "track my inner arc" | Explicit: "argue with a system that holds the record of who I've been" |
| Core mechanism | Passive reflection (perception cards) | Active confrontation (claim → response → correction) |
| Memory thesis | Memory enables perception | Memory enables standing |
| Primary interaction | Read a text card about your arc | Agree, disagree, or correct a claim about your arc |
| Value generation | Insight (the system shows you something) | Self-knowledge (earned through argument) |
| Toggle | Memory on/off demo gimmick | No toggle — memory is what makes the system an interlocutor vs. a dashboard |
| Metrics | Perception engagement rate (soft) | Correction rate + return-after-correction + claim specificity |
| Tone | Informational | Three registers: direct, reframing, pointed |
| Council | Archetypes with memory context | Archetypes with memory, standing, and distinct confrontation styles |
| Arc | Narrative to read | Disputable account to mark up |
| Imprints | Decorative | Visual evidence of state change |

---

## 11. Hackathon Demo Implications

**The demo is 5 minutes. Here's what it shows.**

| Minute | What | Flow | The moment | Proves (JTBD) |
|--------|------|------|------------|---------------|
| 0:00-0:30 | Open on the Imprint paintings. Don't speak yet. | — | Art lands first. | The product gives *form* to inner life — visual, not textual. |
| 0:30-1:30 | "Day 1: Recorded. Nothing." Then: "Day 90: The system has something to say." Show claim → user responds "No" → correction. | Flow 1 + 2 | The system earned standing. The argument IS the product. | "I want something that holds a claim so I can argue with it." |
| 1:30-2:30 | "The archetypes remember." Warrior's callback to January. Memory annotations. "This isn't wisdom. It's a relationship." | Flow 3 | Archetypes with standing, not fortune cookies. | Memory creates relationship — the system *knows* you, not just your data. |
| 2:30-3:30 | "The system's account of 3 months." Disputable arc. "She marked this wrong. That correction made the next confrontation better." | Flow 4 | The flywheel: argue → correct → improve → argue. | "...and in doing so, discover what I actually believe about who I'm becoming." |
| 3:30-4:15 | Architecture: 3 channels, 16th handler, fire-and-forget. "Memory doesn't make the system smarter. It makes it harder to dismiss." | — | Technical credibility. | Why EverMemOS is essential (not decorative). |
| 4:15-4:50 | "The correction loop IS the product. Memory for who you're becoming." | — | Close clean. | — |

**POC changes needed:**

| Scene | Current | Changed to |
|-------|---------|-----------|
| Scene 1 | Memory toggle: off = score, on = perception card | Day 1 vs Day 90: empty → claim → user responds → correction |
| Scene 2 | Council with memory context appearing | Council with archetypes that have standing — Warrior's callback, Sage's question, memory annotations with distinct voice |
| Scene 3 | Arc narrative to read passively | Disputable account with section markup (Accurate / Wrong / Missing) + Imprints as visual evidence |

---

## 12. Existing Code Mapping

**What stays unchanged:**

| Component | File(s) | Why |
|-----------|---------|-----|
| EverMemOS client | `src/lib/evermemos/client.ts` | Store + search API unchanged |
| Channel adapters | `src/lib/evermemos/channels.ts` | 3 channels, same MemCell format |
| EverMemOS handler | `src/services/events/handlers/EverMemOSHandler.ts` | 16th handler, fire-and-forget |
| EventBus | `src/services/events/EventBus.ts` | No changes |
| Types | `src/lib/evermemos/types.ts` | MemCell schema unchanged |
| Archetype voices | `src/lib/archetypes/voices.ts` | Base personalities unchanged |
| ImprintRenderer | POC SVG generation | Paintings stay, role changes (decorative → evidence) |

**What changes:**

| Component | Current | Changed to |
|-----------|---------|-----------|
| `narrative.ts` | Generates transformation narrative | Generates confrontation claims + disputable account sections |
| `archetype-memory.ts` | Memory context injected as context | Memory injected as *relationship history* with per-archetype confrontation style |
| Correction MemCells | Don't exist | New MemCell type: user free-text tagged `self-narrative:correction` |
| POC HTML | 3 scenes (toggle, council, arc narrative) | 3 scenes (Day 1 vs Day 90, council with standing, disputable account) |
| PRD | Perception-based, no persona | Confrontation-based, persona-driven, JTBD-structured |

---

*Memory for who you're becoming. Built with EverMemOS.*
