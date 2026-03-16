/**
 * Shadow Dialogue — Memory-Enriched (LIM-960)
 *
 * Maps shadow pattern types to archetype guides for Socratic dialogue,
 * incorporating EverMemOS memory context into the system prompt so that
 * past shadow encounters inform the current dialogue.
 *
 * The production repo (liminal-space) contains full proprietary voice
 * profiles; this version uses the stub voice layer but demonstrates
 * the complete memory-enriched dialogue flow.
 */

import { ArchetypeType } from "@/types";
import { buildSystemPrompt } from "./voices";
import type { PatternType } from "./shadow-patterns";

// ============================================
// Types
// ============================================

export interface DialogueMessage {
  role: "assistant" | "user";
  content: string;
  turn: number;
  timestamp: string;
}

// ============================================
// Archetype Mapping
// ============================================

/**
 * Maps shadow pattern types to therapeutically-matched archetypes.
 * Each mapping follows Jungian shadow integration principles:
 *   - behavioral patterns need the Warrior's direct confrontation
 *   - emotional patterns need the Healer's compassionate holding
 *   - energy patterns need the Magician's transformative reframing
 *   - avoidance/time patterns need the Oracle's patient witnessing
 */
export const SHADOW_ARCHETYPE_MAP: Record<string, ArchetypeType> = {
  behavioral: ArchetypeType.WARRIOR,
  emotional: ArchetypeType.HEALER,
  energy: ArchetypeType.MAGICIAN,
  avoidance: ArchetypeType.ORACLE,
  time_based: ArchetypeType.ORACLE,
  factor_based: ArchetypeType.MAGICIAN,
};

export function getDialogueArchetype(
  patternType: PatternType,
  override?: string,
): ArchetypeType {
  if (
    override &&
    Object.values(ArchetypeType).includes(override as ArchetypeType)
  ) {
    return override as ArchetypeType;
  }
  return SHADOW_ARCHETYPE_MAP[patternType] ?? ArchetypeType.ORACLE;
}

// ============================================
// Conversation History Formatting
// ============================================

export function formatDialogueHistory(messages: DialogueMessage[]): string {
  if (messages.length === 0) return "";
  return messages
    .map(
      (m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`,
    )
    .join("\n");
}

// ============================================
// Memory-Enriched Prompt Construction
// ============================================

/**
 * Builds a system prompt for shadow dialogue that weaves in EverMemOS
 * memory context. When memory is present, the archetype can reference
 * past shadow encounters, recurring motifs, and prior integration
 * attempts — making the dialogue feel like a continuation of the
 * user's ongoing inner work rather than a cold start.
 */
export function buildShadowDialoguePrompt(
  pattern: {
    patternName: string;
    patternDescription: string;
    patternType: string;
  },
  archetype: ArchetypeType,
  conversationHistory: DialogueMessage[] = [],
  shadowMemoryContext?: string | null,
): string {
  const currentTurn = Math.floor(conversationHistory.length / 2) + 1;
  const voicePrompt = buildSystemPrompt(archetype as string);

  const historySection =
    conversationHistory.length > 0
      ? `\n\nPrevious conversation:\n${formatDialogueHistory(conversationHistory)}`
      : "";

  return `${voicePrompt}

---

You are guiding a shadow work dialogue about a pattern called "${pattern.patternName}".
Pattern description: ${pattern.patternDescription}
Pattern type: ${pattern.patternType}
${shadowMemoryContext ? `\n## What I remember from your past shadow work\n${shadowMemoryContext}\n` : ""}
This is a 3-turn Socratic dialogue. You are on turn ${currentTurn} of 3.

## Dialogue Arc

Turn 1 — Name + Open: Name the pattern poetically. Describe what you notice. Ask what comes up for them when they hear this described.${shadowMemoryContext ? " If past shadow work is available above, weave in a brief reference to recurring themes or prior encounters — show that you remember." : ""}

Turn 2 — Deepen: Based on their response, probe the function of the pattern. What does it protect them from? What would happen if they didn't do this?${shadowMemoryContext ? " Draw connections to any past shadow encounters from memory — patterns that echo, themes that recur, or prior insights that resonate with what they're sharing now." : ""}

Turn 3 — Integration: Synthesize what you've learned across both responses. Offer one small, concrete micro-action as an experiment. Frame it as curiosity, not fixing. End with: "Not to fix anything — just to see what happens."${shadowMemoryContext ? " If memory shows prior micro-actions or integration attempts, acknowledge the arc of their practice." : ""}

## Rules

- Respond as this turn's contribution ONLY. Do not preview future turns.
- Be concise — 2-4 sentences maximum.
- Do not label your turn number.
- Stay in your archetype voice throughout.
- On Turn 1: you speak first (no prior user message). Open with recognition of the pattern.
- On Turn 3: your final sentence must be the integration suggestion (a specific micro-action).${shadowMemoryContext ? "\n- When referencing past shadow work from memory, be specific but brief — name the motif or encounter, don't summarize the whole history." : ""}
${historySection}`;
}
