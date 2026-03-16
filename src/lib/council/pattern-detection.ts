import 'server-only'

/**
 * Pattern Detection Service (EverMemOS-powered)
 *
 * Analyzes archetype interaction history to detect:
 * - Archetype preferences (which archetypes user gravitates toward)
 * - Temporal patterns (when user seeks guidance)
 * - Recurring topics (themes that appear repeatedly)
 * - Coherence correlations (which archetypes help vs hurt coherence)
 *
 * This implementation uses EverMemOS semantic memory search to derive
 * patterns from stored episodic traces (coherence checks, council
 * deliberations, threshold moments) rather than direct DB queries.
 *
 * The proprietary production version additionally queries archetype_memory
 * for precise return-frequency and interval calculations.
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
// Topic Keywords — 8 life domains for keyword-based topic detection
// ============================================================================

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  career: ['job', 'work', 'career', 'boss', 'promotion', 'salary', 'interview', 'quit', 'resign'],
  relationships: ['partner', 'spouse', 'boyfriend', 'girlfriend', 'friend', 'family', 'dating', 'breakup', 'marriage'],
  identity: ['who am i', 'purpose', 'meaning', 'identity', 'authentic', 'true self', 'lost', 'confused'],
  anxiety: ['anxious', 'worried', 'stress', 'overwhelmed', 'panic', 'fear', 'scared', 'nervous'],
  grief: ['loss', 'grief', 'death', 'died', 'mourning', 'goodbye', 'miss', 'gone'],
  creativity: ['create', 'creative', 'art', 'write', 'music', 'blocked', 'inspired', 'expression'],
  health: ['health', 'sick', 'tired', 'energy', 'body', 'sleep', 'exercise', 'wellness'],
  spirituality: ['spirit', 'soul', 'meditation', 'practice', 'growth', 'awakening', 'consciousness'],
}

// ============================================================================
// EverMemOS-Powered Pattern Detection
// ============================================================================

/**
 * Analyze user's archetype interaction patterns via EverMemOS memory search.
 *
 * Queries stored episodic traces (council deliberations, coherence checks)
 * to reconstruct which archetypes the user gravitates toward, recurring
 * topics, and engagement trends — all from memory rather than raw DB rows.
 */
export async function detectUserPatterns(userId: string): Promise<UserPatterns> {
  const { withEverMemOSFallback, searchMemories } = await import('@/lib/evermemos')

  // Query 1: Retrieve council session memories to identify archetype preferences
  const councilMemories = await withEverMemOSFallback(
    () => searchMemories(
      `What archetypes has this user interacted with in council sessions? Which ones appear most often?`,
      userId,
      'agentic',
      10,
      'council'
    ),
    [],
    'pattern-detect-archetypes'
  )

  if (councilMemories.length === 0) {
    log.debug({ userId }, 'No council memories found — returning default patterns')
    return getDefaultPatterns()
  }

  // Extract archetype mentions from memory content
  const archetypeCounts = extractArchetypeCounts(councilMemories.map(m => m.content))
  const sortedArchetypes = [...archetypeCounts.entries()].sort(([, a], [, b]) => b - a)
  const totalMentions = sortedArchetypes.reduce((sum, [, count]) => sum + count, 0)

  const primaryArchetype = (sortedArchetypes[0]?.[0] as ArchetypeType) ?? null
  const secondaryArchetype = (sortedArchetypes[1]?.[0] as ArchetypeType) ?? null

  // Build archetype patterns from memory-derived data
  const archetypePatterns: ArchetypePattern[] = await Promise.all(
    sortedArchetypes
      .filter(([, count]) => count > 0)
      .map(async ([archetype, count]) => {
        const returnFrequency = totalMentions > 0 ? count / totalMentions : 0
        return {
          archetype: archetype as ArchetypeType,
          returnFrequency,
          averageIntervalDays: 0, // Would require timestamp parsing from memories
          coherenceCorrelation: await getCoherenceCorrelation(userId, archetype),
          recurringTopics: await getRecurringTopics(userId, archetype),
          temporalTendency: 'varied' as const,
        }
      })
  )

  // Query 2: Determine engagement trend from memory recency
  const engagementTrend = await detectEngagementTrend(userId)

  // Generate prompt-injectable insights
  const insights = generatePatternInsights(
    primaryArchetype,
    secondaryArchetype,
    archetypePatterns,
    engagementTrend
  )

  log.debug(
    { userId, primaryArchetype, secondaryArchetype, patternCount: archetypePatterns.length },
    'EverMemOS: pattern detection complete'
  )

  return {
    primaryArchetype,
    secondaryArchetype,
    engagementTrend,
    archetypePatterns,
    insights,
  }
}

/**
 * Create prompt-ready context from user patterns.
 * This is injected into archetype prompts to personalize responses.
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
 * Detect coherence correlations per archetype via EverMemOS.
 */
export async function detectCoherenceCorrelations(
  userId: string
): Promise<Map<ArchetypeType, number>> {
  const { withEverMemOSFallback, searchMemories } = await import('@/lib/evermemos')

  return withEverMemOSFallback(
    async () => {
      const results = await searchMemories(
        `Which archetypes correlate with coherence improvements or declines for this user?`,
        userId,
        'agentic',
        10
      )
      if (results.length === 0) return new Map()

      // Parse archetype mentions and their sentiment from coherence context
      const text = results.map(r => r.content).join(' ')
      const correlations = new Map<ArchetypeType, number>()
      const archetypes = extractArchetypeCounts(results.map(r => r.content))

      for (const [archetype] of archetypes) {
        correlations.set(
          archetype as ArchetypeType,
          estimateSentiment(text, archetype)
        )
      }

      return correlations
    },
    new Map(),
    'coherence-correlations'
  )
}

/**
 * Detect topics in a set of messages using keyword matching across 8 life domains.
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
// EverMemOS-powered Helpers
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

      const text = results.map(r => r.content).join(' ')
      return estimateSentiment(text, archetype)
    },
    0,
    `coherence-correlation-${archetype}`
  )
}

/**
 * Query EverMemOS for recurring topics in a specific archetype's conversations.
 * Falls back to empty array when EverMemOS is off or unreachable.
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
      const texts = results.map(r => r.content)
      return detectTopics(texts)
    },
    [],
    `recurring-topics-${archetype}`
  )
}

/**
 * Detect engagement trend from EverMemOS memory recency.
 * Queries recent memories to determine if user is more/less active over time.
 */
async function detectEngagementTrend(
  userId: string
): Promise<'increasing' | 'stable' | 'decreasing'> {
  const { withEverMemOSFallback, searchMemories } = await import('@/lib/evermemos')

  return withEverMemOSFallback(
    async () => {
      const results = await searchMemories(
        `How active has this user been recently? Are they engaging more or less frequently?`,
        userId,
        'hybrid',
        5
      )
      if (results.length === 0) return 'stable'

      // Use memory count and recency signals as engagement proxy
      const text = results.map(r => r.content).join(' ').toLowerCase()
      const activeSignals = ['recent', 'frequently', 'increasing', 'deepening', 'active', 'daily']
      const inactiveSignals = ['absent', 'decreasing', 'inactive', 'rarely', 'gap', 'dormant']
      const activeCount = activeSignals.filter(s => text.includes(s)).length
      const inactiveCount = inactiveSignals.filter(s => text.includes(s)).length

      if (activeCount > inactiveCount) return 'increasing'
      if (inactiveCount > activeCount) return 'decreasing'
      return 'stable'
    },
    'stable',
    'engagement-trend'
  )
}

// ============================================================================
// Internal Utilities
// ============================================================================

/** Default patterns for users with no history */
function getDefaultPatterns(): UserPatterns {
  return {
    primaryArchetype: null,
    secondaryArchetype: null,
    engagementTrend: 'stable',
    archetypePatterns: [],
    insights: [],
  }
}

/** Extract archetype mention counts from memory content strings */
function extractArchetypeCounts(contents: string[]): Map<string, number> {
  const text = contents.join(' ').toLowerCase()
  const counts = new Map<string, number>()

  // Match against known archetype names from the 12-archetype ontology
  const archetypes = [
    'oracle', 'healer', 'warrior', 'trickster', 'sage', 'lover',
    'explorer', 'creator', 'ruler', 'magician', 'rebel', 'caregiver',
  ]

  for (const archetype of archetypes) {
    const regex = new RegExp(`\\b${archetype}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches && matches.length > 0) {
      counts.set(archetype, matches.length)
    }
  }

  return counts
}

/**
 * Estimate sentiment (positive/negative correlation) for an archetype
 * from memory text content. Returns -1..1 range.
 */
function estimateSentiment(text: string, _archetype: string): number {
  const lower = text.toLowerCase()
  const positiveSignals = ['improved', 'increased', 'better', 'higher', 'growth', 'clarity', 'aligned']
  const negativeSignals = ['declined', 'decreased', 'worse', 'lower', 'drop', 'confusion', 'fragmented']
  const posCount = positiveSignals.filter(s => lower.includes(s)).length
  const negCount = negativeSignals.filter(s => lower.includes(s)).length
  const total = posCount + negCount
  if (total === 0) return 0
  return Math.max(-1, Math.min(1, (posCount - negCount) / total))
}

/**
 * Generate human-readable insights from patterns.
 * These are injected into prompts to inform archetype behavior.
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
      insights.push(
        `User has a strong affinity for ${primaryArchetype} (${Math.round(primaryPattern.returnFrequency * 100)}% of interactions)`
      )
    }
  }

  // Archetype pair insight
  if (primaryArchetype && secondaryArchetype) {
    insights.push(
      `Primary guidance from ${primaryArchetype}, with ${secondaryArchetype} as secondary voice`
    )
  }

  // Engagement trend insight
  if (engagementTrend === 'increasing') {
    insights.push('User engagement is increasing — they are deepening their practice')
  } else if (engagementTrend === 'decreasing') {
    insights.push('User has been less active recently — gentle re-engagement may help')
  }

  // Recurring topic insights from patterns
  const allTopics = new Set<string>()
  for (const pattern of patterns) {
    for (const topic of pattern.recurringTopics) {
      allTopics.add(topic)
    }
  }
  if (allTopics.size > 0) {
    insights.push(`Recurring themes across sessions: ${[...allTopics].join(', ')}`)
  }

  // Frequent return pattern
  const frequentReturner = patterns.find(p => p.averageIntervalDays > 0 && p.averageIntervalDays < 3)
  if (frequentReturner) {
    insights.push(
      `Returns to ${frequentReturner.archetype} frequently (every ${frequentReturner.averageIntervalDays.toFixed(1)} days on average)`
    )
  }

  return insights
}
