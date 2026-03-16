/**
 * Shadow Dialogue (Stub)
 *
 * Maps shadow pattern types to archetype guides for Socratic dialogue.
 * The production implementation includes the full shadow-archetype routing
 * table and dialogue turn management.
 *
 * This file is stubbed in the public repo to protect proprietary IP.
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
// Stub Archetype Mapping
// ============================================

/**
 * Returns the archetype guide for a given shadow pattern type.
 * Production implementation maps each pattern type to a specific archetype
 * based on Jungian shadow integration principles.
 */
export function getDialogueArchetype(
  _patternType: PatternType,
  override?: string,
): ArchetypeType {
  if (
    override &&
    Object.values(ArchetypeType).includes(override as ArchetypeType)
  ) {
    return override as ArchetypeType;
  }
  return ArchetypeType.ORACLE;
}

/**
 * Builds a system prompt for shadow dialogue.
 * Production implementation constructs archetype-specific Socratic prompts
 * informed by pattern context, conversation history, and EverMemOS shadow memory.
 */
export function buildShadowDialoguePrompt(
  _patternInfo: { patternName: string; patternDescription: string; patternType: string },
  archetype: ArchetypeType,
  _messages?: DialogueMessage[],
  _shadowMemoryContext?: string | null,
): string {
  return buildSystemPrompt(archetype as string);
}
