import 'server-only'

/**
 * Pattern Detection Service
 *
 * Per DOCTRINE (lines 306-328):
 * "Alice returns to Oracle when clarity drops. Three days ago, she was
 * exploring career confusion—it's a recurring pattern."
 *
 * This service analyzes archetype interaction history to detect:
 * - Archetype preferences (which archetypes user gravitates toward)
 * - Temporal patterns (when user seeks guidance)
 * - Recurring topics (themes that appear repeatedly)
 * - Coherence correlations (which archetypes help vs hurt coherence)
 */

import { getServiceSupabase } from '@/lib/supabase/server'
import { createModuleLogger } from '@/lib/logger'
import { ArchetypeType } from '@/types'

const log = createModuleLogger('pattern-detection')

// ============================================================================
// Types
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
  coherenceDelta?: number // Change in coherence after interaction
  topics?: string[]
}

// ============================================================================
// Pattern Detection Functions
// ============================================================================

/**
 * Analyze user's archetype interaction patterns
 * Returns patterns that can be injected into prompts for personalized guidance
 */
export async function detectUserPatterns(userId: string): Promise<UserPatterns> {
  const supabase = getServiceSupabase()

  // Fetch archetype memories
  const { data: memories, error: memError } = await (supabase as any)
    .from('archetype_memory')
    .select('archetype, interaction_count, last_interaction_at, first_interaction_at, resonance_score, conversation_depth_avg')
    .eq('user_id', userId)
    .order('interaction_count', { ascending: false })

  if (memError) {
    log.error({ error: memError, userId }, 'Failed to fetch archetype memories for pattern detection')
    return getDefaultPatterns()
  }

  if (!memories || memories.length === 0) {
    return getDefaultPatterns()
  }

  // Calculate total interactions for frequency calculation
  const totalInteractions = memories.reduce((sum: any, m: any) => sum + (m.interaction_count || 0), 0)

  // Identify primary and secondary archetypes
  const sortedByCount = [...memories].sort((a, b) => (b.interaction_count || 0) - (a.interaction_count || 0))
  const primaryArchetype = sortedByCount[0]?.archetype as ArchetypeType || null
  const secondaryArchetype = sortedByCount[1]?.archetype as ArchetypeType || null

  // Build archetype patterns
  const archetypePatterns: ArchetypePattern[] = await Promise.all(
    memories
      .filter((m: any) => (m.interaction_count || 0) > 0)
      .map(async (m: any) => {
        const interactionCount = m.interaction_count || 0
        const returnFrequency = totalInteractions > 0 ? interactionCount / totalInteractions : 0

        // Calculate average interval
        let averageIntervalDays = 0
        if (m.first_interaction_at && m.last_interaction_at && interactionCount > 1) {
          const firstDate = new Date(m.first_interaction_at)
          const lastDate = new Date(m.last_interaction_at)
          const totalDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
          averageIntervalDays = totalDays / (interactionCount - 1)
        }

        return {
          archetype: m.archetype as ArchetypeType,
          returnFrequency,
          averageIntervalDays,
          coherenceCorrelation: await getCoherenceCorrelation(userId, m.archetype as string),
          recurringTopics: await getRecurringTopics(userId, m.archetype as string),
          temporalTendency: 'varied' as const, // Would need timestamp data
        }
      })
  )

  // Calculate engagement trend
  const engagementTrend = calculateEngagementTrend(memories)

  // Generate insights
  const insights = generatePatternInsights(primaryArchetype, secondaryArchetype, archetypePatterns, engagementTrend)

  return {
    primaryArchetype,
    secondaryArchetype,
    engagementTrend,
    archetypePatterns,
    insights,
  }
}

/**
 * Calculate whether user engagement is increasing, stable, or decreasing
 */
function calculateEngagementTrend(
  memories: Array<{ last_interaction_at: string | null; interaction_count: number | null }>
): 'increasing' | 'stable' | 'decreasing' {
  const now = new Date()

  // Get most recent interaction across all archetypes
  const recentInteractions = memories
    .filter(m => m.last_interaction_at)
    .map(m => new Date(m.last_interaction_at!))
    .sort((a, b) => b.getTime() - a.getTime())

  if (recentInteractions.length === 0) return 'stable'

  const mostRecent = recentInteractions[0]
  const daysSinceLastInteraction = (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)

  // Total interactions as a rough engagement metric
  const totalInteractions = memories.reduce((sum, m) => sum + (m.interaction_count || 0), 0)

  // If no recent activity but had interactions before, trending down
  if (daysSinceLastInteraction > 14 && totalInteractions > 3) {
    return 'decreasing'
  }

  // If recent activity and growing interaction count, trending up
  if (daysSinceLastInteraction < 7 && totalInteractions > 5) {
    return 'increasing'
  }

  return 'stable'
}

/**
 * Generate human-readable insights from patterns
 * These are injected into prompts to inform archetype behavior
 */
function generatePatternInsights(
  primaryArchetype: ArchetypeType | null,
  secondaryArchetype: ArchetypeType | null,
  patterns: ArchetypePattern[],
  engagementTrend: 'increasing' | 'stable' | 'decreasing'
): string[] {
  const insights: string[] = []

  // Primary archetype insight
  if (primaryArchetype) {
    const primaryPattern = patterns.find(p => p.archetype === primaryArchetype)
    if (primaryPattern && primaryPattern.returnFrequency > 0.4) {
      insights.push(`User has a strong affinity for ${primaryArchetype} (${Math.round(primaryPattern.returnFrequency * 100)}% of interactions)`)
    }
  }

  // Archetype pair insight
  if (primaryArchetype && secondaryArchetype) {
    insights.push(`Primary guidance from ${primaryArchetype}, with ${secondaryArchetype} as secondary voice`)
  }

  // Engagement trend insight
  if (engagementTrend === 'increasing') {
    insights.push('User engagement is increasing—they are deepening their practice')
  } else if (engagementTrend === 'decreasing') {
    insights.push('User has been less active recently—gentle re-engagement may help')
  }

  // Frequent return pattern
  const frequentReturner = patterns.find(p => p.averageIntervalDays > 0 && p.averageIntervalDays < 3)
  if (frequentReturner) {
    insights.push(`Returns to ${frequentReturner.archetype} frequently (every ${frequentReturner.averageIntervalDays.toFixed(1)} days on average)`)
  }

  return insights
}

/**
 * Create prompt-ready context from user patterns
 * This is injected into archetype prompts to personalize responses
 */
export function createPatternContext(patterns: UserPatterns): string {
  if (patterns.insights.length === 0) {
    return ''
  }

  let context = '\n\nUSER PATTERNS (for personalization):\n'

  for (const insight of patterns.insights) {
    context += `- ${insight}\n`
  }

  // Add specific archetype relationship info if available
  if (patterns.primaryArchetype) {
    context += `\nPrimary archetype relationship: ${patterns.primaryArchetype}`
    if (patterns.secondaryArchetype) {
      context += `, Secondary: ${patterns.secondaryArchetype}`
    }
    context += '\n'
  }

  return context
}

/**
 * Detect if user typically returns to a specific archetype after coherence drops
 * Per DOCTRINE: "Alice returns to Oracle when clarity drops"
 */
export async function detectCoherenceCorrelations(
  userId: string
): Promise<Map<ArchetypeType, number>> {
  const supabase = getServiceSupabase()

  // This would require coherence history correlation
  // For MVP, return empty map (feature to be enhanced with coherence tracking)
  const correlations = new Map<ArchetypeType, number>()

  // Coherence correlation requires joining coherence_scores with archetype_memories.
  // Until coherence_scores has a stable user-facing ID column to join on,
  // we return an empty map. The function signature is preserved for future wiring.

  log.debug({ userId }, 'Coherence correlation detection (placeholder)')

  return correlations
}

/**
 * Get default patterns for users with no history
 */
function getDefaultPatterns(): UserPatterns {
  return {
    primaryArchetype: null,
    secondaryArchetype: null,
    engagementTrend: 'stable',
    archetypePatterns: [],
    insights: [],
  }
}

// ============================================================================
// Topic Analysis (Future Enhancement)
// ============================================================================

/**
 * Common topics/themes that appear in conversations
 * This would be enhanced with NLP/embeddings for semantic analysis
 */
export const TOPIC_KEYWORDS = {
  career: ['job', 'work', 'career', 'boss', 'promotion', 'salary', 'interview', 'quit', 'resign'],
  relationships: ['partner', 'spouse', 'boyfriend', 'girlfriend', 'friend', 'family', 'dating', 'breakup', 'marriage'],
  identity: ['who am i', 'purpose', 'meaning', 'identity', 'authentic', 'true self', 'lost', 'confused'],
  anxiety: ['anxious', 'worried', 'stress', 'overwhelmed', 'panic', 'fear', 'scared', 'nervous'],
  grief: ['loss', 'grief', 'death', 'died', 'mourning', 'goodbye', 'miss', 'gone'],
  creativity: ['create', 'creative', 'art', 'write', 'music', 'blocked', 'inspired', 'expression'],
  health: ['health', 'sick', 'tired', 'energy', 'body', 'sleep', 'exercise', 'wellness'],
  spirituality: ['spirit', 'soul', 'meditation', 'practice', 'growth', 'awakening', 'consciousness'],
}

/**
 * Detect topics in a set of messages
 * Simple keyword matching for MVP
 */
export function detectTopics(messages: string[]): string[] {
  const combinedText = messages.join(' ').toLowerCase()
  const detectedTopics: string[] = []

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const hasKeyword = keywords.some(kw => combinedText.includes(kw))
    if (hasKeyword) {
      detectedTopics.push(topic)
    }
  }

  return detectedTopics
}

// ============================================================================
// EverMemOS-powered Pattern Helpers (Memory Genesis 2026)
// ============================================================================

/**
 * Query EverMemOS for coherence correlation with a specific archetype.
 * Returns -1..1 score. Falls back to 0 when EverMemOS is off or unreachable.
 */
async function getCoherenceCorrelation(userId: string, archetype: string): Promise<number> {
  const { withEverMemOSFallback, searchMemories } = await import('@/lib/evermemos')

  return withEverMemOSFallback(
    async () => {
      const results = await searchMemories(
        `How did ${archetype} sessions correlate with coherence changes for this user? Did coherence improve or decline after ${archetype} conversations?`,
        userId,
        'hybrid',
        5
      )
      if (results.length === 0) return 0

      // Parse sentiment from memory content — positive words suggest positive correlation
      const text = results.map((r) => r.content).join(' ').toLowerCase()
      const positiveSignals = ['improved', 'increased', 'better', 'higher', 'growth', 'clarity']
      const negativeSignals = ['declined', 'decreased', 'worse', 'lower', 'drop', 'confusion']
      const posCount = positiveSignals.filter((s) => text.includes(s)).length
      const negCount = negativeSignals.filter((s) => text.includes(s)).length
      const total = posCount + negCount
      if (total === 0) return 0
      return Math.max(-1, Math.min(1, (posCount - negCount) / total))
    },
    0,
    `coherence-correlation-${archetype}`
  )
}

/**
 * Query Evermind for recurring topics in a specific archetype's conversations.
 * Falls back to empty array when Evermind is off or unreachable.
 */
async function getRecurringTopics(userId: string, archetype: string): Promise<string[]> {
  const { withEverMemOSFallback, searchMemories } = await import('@/lib/evermemos')

  return withEverMemOSFallback(
    async () => {
      const results = await searchMemories(
        `What recurring themes and topics appear in ${archetype} conversations with this user?`,
        userId,
        'hybrid',
        10
      )
      if (results.length === 0) return []

      // Extract topic keywords from results using existing topic detection
      const texts = results.map((r) => r.content)
      return detectTopics(texts)
    },
    [],
    `recurring-topics-${archetype}`
  )
}
