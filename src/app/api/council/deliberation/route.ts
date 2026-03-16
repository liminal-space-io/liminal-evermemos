import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'
import { generateCouncilDeliberation } from '@/lib/agent/council-deliberation'
import { saveDeliberationMemory } from '@/lib/council/memory-store'
import { detectUserPatterns, createPatternContext } from '@/lib/council/pattern-detection'
import { logger } from '@/lib/logger'
import type { CoherenceDimension } from '@/lib/agent/types'
import { withErrorHandling, ValidationError, AppError, ERROR_CODES } from '@/lib/api/route-helpers'
import { emitIdentitySignal, getUserIdentityState } from '@/lib/identity'

/**
 * POST /api/council/deliberation
 *
 * Generate a council deliberation for a user's question.
 *
 * Flow:
 * 1. Check auth (allow anonymous with simulated fallback)
 * 2. If authenticated: check feature_usage rate limits
 * 3. If at limit (free tier): return 402 Payment Required
 * 4. Generate deliberation via council-deliberation.ts
 * 5. Increment usage count
 * 6. Return deliberation + usage metadata
 *
 * Anonymous users:
 * - Should not reach this endpoint (frontend shows simulated examples only)
 * - If they do, return 401 Unauthorized
 *
 * Rate limits (from feature_usage table):
 * - Free tier: 3 questions/month
 * - Premium: unlimited (no check needed)
 */

interface RequestBody {
  question: string
  context?: string
  affectedDimensions?: CoherenceDimension[]
}

async function handlePost(request: NextRequest) {
  const log = logger.child({ route: '/api/council/deliberation' })

  // Parse request body
  const body: RequestBody = await request.json()
  const { question, context: _context, affectedDimensions } = body

  if (!question || question.trim().length === 0) {
    throw new ValidationError('Question is required')
  }

  // Demo bypass — investor sandbox uses userId: 'demo-user', skip auth + rate limits
  const body2 = body as RequestBody & { userId?: string }
  if (body2.userId === 'demo-user') {
    const demoFactors = { alignment: 0.72, stability: 0.68, clarity: 0.74, integration: 0.70 }
    const deliberation = await generateCouncilDeliberation({
      userId: 'demo-user',
      topic: question,
      factors: demoFactors,
      affectedDimensions: affectedDimensions || ['wholeness', 'clarity', 'connection'],
    })
    return NextResponse.json({
      deliberation,
      usageRemaining: 3,
      newArchetypes: [],
    })
  }

  // Get authenticated user
  const supabase = getServiceSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    log.warn({ error: authError }, 'Unauthorized council deliberation request')
    throw new AppError(ERROR_CODES.AUTH_REQUIRED, 'Authentication required')
  }

    const userId = user.id

    // Check user tier from canonical subscriptions table (not user_profiles which may be stale)
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single()

    const activeStatuses = ['active', 'trialing']
    const tier = (subscription && activeStatuses.includes(subscription.status))
      ? subscription.tier || 'free'
      : 'free'
    const isPremium = tier !== 'free'

    // Rate limit check (free tier only)
    if (!isPremium) {
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1) // First day of month
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of month

      // Get or create feature usage record
      const { data: usage, error: usageError } = await (supabase as any)
        .from('feature_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_type', 'council_questions')
        .eq('period_start', periodStart.toISOString())
        .single()

      if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows
        log.error({ error: usageError, userId }, 'Failed to fetch feature usage')
        return NextResponse.json(
          { error: 'Failed to check rate limits' },
          { status: 500 }
        )
      }

      const currentUsage = usage?.usage_count || 0
      const limit = 3 // Free tier: 3 questions/month

      // Check if at limit
      if (currentUsage >= limit) {
        log.info({ userId, currentUsage, limit }, 'User hit council question rate limit')

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            limit,
            resetAt: periodEnd.toISOString(),
            upgradeUrl: '/pricing',
            message: 'You have used all 3 free council questions this month. Upgrade to Premium for unlimited questions.',
          },
          { status: 402 } // Payment Required
        )
      }
    }

    // Read identity state for richer council context (non-fatal)
    const identityState = await getUserIdentityState(userId).catch((err) => {
      log.warn({ err, userId }, 'Identity state read failed — using neutral baseline')
      return null
    })

    // Query latest coherence_scores for per-factor data.
    // The council uses a 4-factor model (alignment, stability, clarity, integration).
    // Map 7-factor → 4-factor:
    //   stability → stability (direct)
    //   clarity → clarity (direct)
    //   agency → alignment (agency is executive capacity / alignment with purpose)
    //   wholeness → integration (wholeness is integrated state)
    //
    // Always attempt the DB query — don't gate on identityState availability.
    // The query itself handles "no scores" gracefully (PGRST116 / null factors).
    let coherenceFactors = {
      alignment: 0.7,   // neutral baseline — overwritten below if real scores exist
      stability: 0.7,
      clarity: 0.7,
      integration: 0.7, // neutral baseline — overwritten below if real scores exist
    }

    try {
      const { data: coherenceScore, error: scoreError } = await (supabase as any)
        .from('coherence_scores')
        .select('factors')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (!scoreError && coherenceScore?.factors) {
        const f = coherenceScore.factors as Record<string, number>
        coherenceFactors = {
          alignment: f.agency ?? 0.7,      // agency → alignment
          stability: f.stability ?? 0.7,
          clarity: f.clarity ?? 0.7,
          integration: f.wholeness ?? 0.7, // wholeness → integration
        }
        log.debug(
          { userId, factors: coherenceFactors },
          'Loaded per-factor coherence scores from coherence_scores table'
        )
      } else if (scoreError && scoreError.code !== 'PGRST116') {
        // PGRST116 = no rows found — expected for new users. Log other errors.
        log.warn({ err: scoreError, userId }, 'Unexpected error fetching coherence scores')
      }
    } catch (factorError) {
      log.warn({ err: factorError, userId }, 'Failed to fetch per-factor coherence scores — using baseline')
      // Continue with baseline values above
    }

    const factors = coherenceFactors

    // Use weak factors from identity state as affected dimensions (more targeted)
    const resolvedDimensions = affectedDimensions
      || (identityState?.weakFactors?.length
        ? identityState.weakFactors as CoherenceDimension[]
        : ['wholeness', 'clarity', 'connection'])

    // Memory Genesis: Inject EverMemOS context into council deliberation
    let memoryEnrichedTopic = question
    if (process.env.EVERMEMOS_ENABLED === 'true') {
      try {
        const { withEverMemOSFallback, searchMemories } = await import('@/lib/evermemos')
        const memoryContext = await withEverMemOSFallback(
          () => searchMemories(
            `What has this user discussed in past Council sessions? What patterns emerge?`,
            userId,
            'agentic',
            5
          ),
          [],
          'council-memory-context'
        )
        if (memoryContext.length > 0) {
          const pastContext = memoryContext.map((r) => r.content).join(' ').slice(0, 500)
          memoryEnrichedTopic = `${question}\n\n[What I Remember From Past Sessions: ${pastContext}]`
          log.debug({ userId, memoryResultCount: memoryContext.length }, 'EverMemOS: council memory context injected')
        }
      } catch (err) {
        log.warn({ err, userId }, 'EverMemOS: council memory context retrieval failed')
      }
    }

    // LIM-950: Memory-aware Council — detect user patterns from EverMemOS
    // Pattern detection enriches the topic with archetype preferences, recurring themes,
    // and engagement trends so the council can personalize its deliberation.
    let patternContext = ''
    try {
      const userPatterns = await detectUserPatterns(userId)
      patternContext = createPatternContext(userPatterns)
      if (patternContext) {
        memoryEnrichedTopic = memoryEnrichedTopic + patternContext
        log.debug(
          { userId, primaryArchetype: userPatterns.primaryArchetype, insightCount: userPatterns.insights.length },
          'EverMemOS: user pattern context injected into council topic'
        )
      }
    } catch (patternErr) {
      log.warn({ err: patternErr, userId }, 'Pattern detection failed — continuing without pattern context')
    }

    // Generate council deliberation
    log.info({ userId, question, tier, hasIdentityState: !!identityState, hasPatterns: !!patternContext }, 'Generating council deliberation')

    const deliberation = await generateCouncilDeliberation({
      userId,
      topic: memoryEnrichedTopic,
      factors,
      affectedDimensions: resolvedDimensions,
      phase: identityState?.dominantPhase as 'ending' | 'liminal' | 'emerging' | 'integration' | 'momentum' | undefined,
    })

    // Increment usage count (free tier only)
    if (!isPremium) {
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Re-read usage count to compute next value (the rate-limit check above is in a separate block)
      const { data: usageForIncrement } = await (supabase as any)
        .from('feature_usage')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('feature_type', 'council_questions')
        .eq('period_start', periodStart.toISOString())
        .single()
      const nextCount = (usageForIncrement?.usage_count || 0) + 1
      const { error: incrementError } = await (supabase as any)
        .from('feature_usage')
        .upsert({
          user_id: userId,
          feature_type: 'council_questions',
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          usage_count: nextCount,
          limit_count: 3,
          metadata: { tier },
        })

      if (incrementError) {
        log.error({ error: incrementError, userId }, 'Failed to increment usage count')
        // Don't fail the request - deliberation was generated successfully
      }
    }

    // Calculate remaining usage (free tier only)
    let usageRemaining: number | undefined
    if (!isPremium) {
      const { data: updatedUsage } = await (supabase as any)
        .from('feature_usage')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('feature_type', 'council_questions')
        .single()

      const used = updatedUsage?.usage_count || 0
      usageRemaining = Math.max(0, 3 - used)
    }

    log.info({ userId, deliberationId: deliberation.id, usageRemaining }, 'Council deliberation generated successfully')

    // === XP Integration (DOCTRINE alignment) ===
    // Award XP for council conversation completion
    let xpResult: { xpAwarded: number; leveledUp: boolean; newLevel: number } | null = null
    try {
      const { awardXP, getUserStreak } = await import('@/lib/xp/xp-service')

      const currentStreak = await getUserStreak(userId)

      const xpAward = await awardXP(userId, {
        ritualType: 'council',
        currentStreak,
        coherenceScoreBefore: null, // No coherence comparison for council
        coherenceScoreAfter: null,
      })

      xpResult = {
        xpAwarded: xpAward.xpAwarded,
        leveledUp: xpAward.leveledUp,
        newLevel: xpAward.newLevel,
      }

      log.info(
        { userId, xpAwarded: xpAward.xpAwarded, leveledUp: xpAward.leveledUp },
        'XP awarded for council deliberation'
      )
    } catch (xpError) {
      log.warn({ err: xpError, userId }, 'XP award failed for council')
    }

    // === Archetype Memory Update (DOCTRINE alignment) ===
    // Update memory for the synthesis archetype, then check for first-encounter archetypes
    // among all participants while we have server context (avoids client race condition).
    let newArchetypes: string[] = []
    try {
      const { updateAfterConversation } = await import('@/lib/council/archetype-memory')
      const synthesisArchetype = deliberation.attribution

      // Synthesis archetype: full weight (turnCount + depth)
      // Perspective archetypes: lighter weight (turnCount=1, conversationDepth=1)
      // All updates run in parallel — individual failures are non-fatal (LIM-805)
      const perspectiveArchetypes = deliberation.participants.filter(
        (p: string) => p.toLowerCase() !== synthesisArchetype.toLowerCase()
      )

      const memoryUpdates = [
        updateAfterConversation({
          userId,
          archetype: synthesisArchetype,
          turnCount: deliberation.perspectives.length + deliberation.debate.length + 1,
          conversationDepth: deliberation.perspectives.length,
        }),
        ...perspectiveArchetypes.map((archetype: string) =>
          updateAfterConversation({ userId, archetype, turnCount: 1, conversationDepth: 1 })
        ),
      ]

      const results = await Promise.allSettled(memoryUpdates)
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          const archetype = i === 0 ? synthesisArchetype : perspectiveArchetypes[i - 1]
          log.error({ err: result.reason, userId, archetype }, 'Archetype memory update failed')
        }
      })

      log.info(
        { userId, synthesisArchetype, perspectiveCount: perspectiveArchetypes.length },
        'Archetype memory updated for all participants'
      )

      // After the write, find participant archetypes this user has encountered exactly once
      // (interaction_count_at_event === 1 means this deliberation was their first).
      // Querying server-side eliminates the client read/write race.
      const { data: firstEncounters } = await (supabase as any)
        .from('archetype_relationship_events')
        .select('ontology_primitives!archetype_id(canonical_name), interaction_count_at_event')
        .eq('user_id', userId)
        .eq('interaction_count_at_event', 1)

      const participantSet = new Set(
        deliberation.participants.map((p: string) => p.toLowerCase())
      )
      newArchetypes = (firstEncounters || [])
        .map((row: { ontology_primitives?: { canonical_name: string } }) =>
          row.ontology_primitives?.canonical_name ?? ''
        )
        .filter((name: string) => name && participantSet.has(name.toLowerCase()))
    } catch (memoryError) {
      log.warn({ err: memoryError, userId }, 'Archetype memory update failed')
    }

    // === Memory Store (LIM-352) ===
    // Persist deliberation for future context retrieval
    // Returns conversationId for LIM-358 feedback survey
    let conversationId: string | null = null
    try {
      conversationId = await saveDeliberationMemory(userId, {
        topic: question,
        archetypes: deliberation.participants.map(String),
        synthesis: deliberation.synthesis,
      })
    } catch (saveError) {
      log.warn({ err: saveError, userId }, 'Failed to save deliberation memory')
      // Non-fatal — deliberation still returned successfully
    }

    // Memory Genesis: Store council deliberation as EverMemOS episodic trace
    if (process.env.EVERMEMOS_ENABLED === 'true') {
      void (async () => {
        try {
          const { storeMemory, formatCouncilMemCell } = await import('@/lib/evermemos')
          const memcells = formatCouncilMemCell(
            userId,
            question,
            deliberation.participants.map(String),
            deliberation.synthesis,
            null,
            { convergenceSignal: deliberation.convergenceSignal, conversationId }
          )
          await storeMemory(memcells)
          log.debug({ userId, deliberationId: deliberation.id }, 'EverMemOS: council episodic trace stored')
        } catch (err) {
          log.warn({ err, userId }, 'EverMemOS: failed to store council trace')
        }
      })()
    }

    // === Identity Telemetry: Emit council_deliberation signal (fire-and-forget) ===
    void emitIdentitySignal(userId, {
      type: 'council_deliberation',
      payload: {
        deliberationId: deliberation.id,
        topic: question,
        participants: deliberation.participants,
        synthesisArchetype: deliberation.attribution,
      },
      dominantArchetype: deliberation.attribution,
      signalStrength: 0.8,
      source: 'system',
    }).catch((err) => {
      log.warn({ err, userId }, 'Identity signal emission failed (non-critical)')
    })

    // Return deliberation + usage metadata + conversationId for feedback survey
  return NextResponse.json({
    deliberation,
    usageRemaining,
    xp: xpResult,
    conversationId,       // LIM-358: needed by GuidanceQualitySurvey to submit feedback
    newArchetypes,        // First-encounter archetypes — computed server-side after memory write
    upgradePrompt: !isPremium && usageRemaining !== undefined && usageRemaining <= 1
      ? "You're almost out of free council questions. Upgrade to Premium for unlimited access to all 12 archetypes."
      : undefined,
  })
}

export const POST = withErrorHandling(handlePost, 'council-deliberation')
