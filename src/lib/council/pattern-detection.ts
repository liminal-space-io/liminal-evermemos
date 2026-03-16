import 'server-only'

/**
 * Pattern Detection Service (Stub)
 *
 * Analyzes archetype interaction history to detect:
 * - Archetype preferences (which archetypes user gravitates toward)
 * - Temporal patterns (when user seeks guidance)
 * - Recurring topics (themes that appear repeatedly)
 * - Coherence correlations (which archetypes help vs hurt coherence)
 *
 * The production implementation includes:
 * - Return frequency and interval calculations from archetype_memory table
 * - Engagement trend detection (increasing/stable/decreasing)
 * - Prompt-injectable insight generation for personalized archetype responses
 * - EverMemOS-powered coherence correlation and topic recurrence queries
 * - Keyword-based topic detection across 8 life domains
 *
 * This file is stubbed in the public repo to protect proprietary IP.
 */

import { createModuleLogger } from '@/lib/logger'
import { ArchetypeType } from '@/types'

const log = createModuleLogger('pattern-detection')

// ============================================================================
// Types (preserved — these are API surface, not implementation)
// ============================================================================

export interface ArchetypePattern {
  archetype: ArchetypeType
  /** How often user returns to this archetype (0-1) */
  returnFrequency: number
  /** Average gap in days between visits */
  averageIntervalDays: number
  /** Correlation with coherence changes (-1 to 1) */
  coherenceCorrelation: number
  /** Common topics/themes in conversations */
  recurringTopics: string[]
  /** Interaction times (for temporal patterns) */
  temporalTendency: 'morning' | 'afternoon' | 'evening' | 'night' | 'varied'
}

export interface UserPatterns {
  /** Primary archetype (most frequent) */
  primaryArchetype: ArchetypeType | null
  /** Secondary archetype */
  secondaryArchetype: ArchetypeType | null
  /** Overall engagement trend */
  engagementTrend: 'increasing' | 'stable' | 'decreasing'
  /** Patterns for each archetype interacted with */
  archetypePatterns: ArchetypePattern[]
  /** Key insights for prompt injection */
  insights: string[]
}

export interface InteractionRecord {
  archetype: string
  interactedAt: Date
  turnCount: number
  coherenceDelta?: number
  topics?: string[]
}

// ============================================================================
// Stub Implementations
// ============================================================================

/**
 * Analyze user's archetype interaction patterns.
 * Production version queries archetype_memory table and EverMemOS.
 */
export async function detectUserPatterns(_userId: string): Promise<UserPatterns> {
  log.debug({ userId: _userId }, 'Pattern detection (stub)')
  return {
    primaryArchetype: null,
    secondaryArchetype: null,
    engagementTrend: 'stable',
    archetypePatterns: [],
    insights: [],
  }
}

/**
 * Create prompt-ready context from user patterns.
 */
export function createPatternContext(patterns: UserPatterns): string {
  if (patterns.insights.length === 0) return ''
  return '\n\nUSER PATTERNS (for personalization):\n' +
    patterns.insights.map(i => `- ${i}`).join('\n') + '\n'
}

/**
 * Detect coherence correlations per archetype.
 * Production version joins coherence_scores with archetype_memory.
 */
export async function detectCoherenceCorrelations(
  _userId: string
): Promise<Map<ArchetypeType, number>> {
  return new Map()
}

/**
 * Detect topics in a set of messages.
 * Production version uses keyword matching across 8 life domains.
 */
export function detectTopics(_messages: string[]): string[] {
  return []
}
