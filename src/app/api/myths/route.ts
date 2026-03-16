import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'
import { resolveActor } from '@/lib/api/auth-guard'
import { logger } from '@/lib/logger'
import type { ExtractedSymbolicContent, ImprintData, SemioticPhase } from '@/lib/semiotic/types'
import type { Json } from '@/types/database.types'
import { emitIdentitySignal } from '@/lib/identity/emit-signal'
import type { CoherenceSnapshot } from '@/lib/identity/types'
import { getCalibrationScore, shouldTriggerCalibration } from '@/lib/semiotic/calibration'
import { awardXP, getUserStreak, getLatestCoherenceScore, getPreviousCoherenceScore } from '@/lib/xp'

const log = logger.child({ api: 'myths' })

export async function GET(request: Request) {
  try {
    const actor = await resolveActor(request)

    const supabase = getServiceSupabase()

    const query = supabase
      .from('myth_events')
      .select('id, phase, timestamp, motifs, paradox_instruction, action_completed, cosmogram_data, micro_action, revisited_count, last_revisited_at')
      .order('timestamp', { ascending: false })
      .limit(50)

    const { data, error } = await (
      actor.type === 'user'
        ? query.eq('user_id', actor.id)
        : query.eq('session_id', actor.id)
    )

    if (error) {
      log.error({ err: error, actorId: actor.id }, 'Failed to fetch myth_events')
      return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 })
    }

    // Fetch calibration score — only available for authenticated users
    let calibrationScore = 0
    if (actor.type === 'user') {
      try {
        calibrationScore = await getCalibrationScore(actor.id)
      } catch (err) {
        log.warn({ err, userId: actor.id }, 'Failed to fetch calibration score — using default 0')
      }
    }

    // Check if user should see calibration prompt (non-blocking, defaults to false on error)
    let shouldShowCalibrationPrompt = false
    if (actor.type === 'user') {
      try {
        shouldShowCalibrationPrompt = await shouldTriggerCalibration(actor.id)
      } catch (err) {
        log.warn(
          { err, userId: actor.id },
          'Failed to check calibration trigger — using default false'
        )
      }
    }

    // Compute revisit suggestion — oldest sealed Imprint not revisited in 7+ days
    // Fallback: oldest sealed Imprint regardless of revisit date
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const sealed = (data ?? []).filter((e) => e.action_completed)
    const notRecentlyRevisited = sealed.filter((e) => {
      if (!e.last_revisited_at) return true
      return now - new Date(e.last_revisited_at).getTime() >= SEVEN_DAYS_MS
    })
    const candidates = notRecentlyRevisited.length > 0 ? notRecentlyRevisited : sealed
    // Oldest first — reverse chronological sort already applied, so last element is oldest
    const revisitSuggestion = candidates.length > 0
      ? candidates[candidates.length - 1]
      : null

    return NextResponse.json({
      entries: data ?? [],
      calibrationScore,
      shouldShowCalibrationPrompt,
      revisitSuggestion,
    })
  } catch (err) {
    log.error({ err }, 'myths GET failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const actor = await resolveActor(request)

    const body = await request.json()

    const { raw_content, capture_medium, extracted, cosmogramData, microAction } = body as {
      raw_content: string
      capture_medium: 'text' | 'voice' | 'ritual_output'
      extracted: ExtractedSymbolicContent
      cosmogramData: ImprintData | null
      microAction: string
    }

    if (!raw_content) {
      return NextResponse.json({ error: 'raw_content is required' }, { status: 400 })
    }
    if (!capture_medium) {
      return NextResponse.json({ error: 'capture_medium is required' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Get current coherence snapshot — only available for authenticated users
    let latestScore: { factors: Json; score: number } | null = null
    if (actor.type === 'user') {
      const { data: scoreData, error: scoreError } = await supabase
        .from('coherence_scores')
        .select('factors, score')
        .eq('user_id', actor.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (scoreError && scoreError.code !== 'PGRST116') {
        log.warn({ err: scoreError, userId: actor.id }, 'Failed to fetch coherence snapshot — storing myth event without coherence context')
      }
      latestScore = scoreData ? { factors: scoreData.factors, score: scoreData.score ?? 0 } : null
    }

    // LIM-868: Guard against Track A phase values leaking in from GPT extraction
    // GPT-4o-mini may return Track A values ('ending','emerging','momentum') — these
    // are valid TransitionPhase values but not SemioticPhase values, and would cause
    // the Imprint to disappear from the Interior grid (PHASE_ORDER only has Track B values)
    const VALID_SEMIOTIC_PHASES: SemioticPhase[] = ['initiation', 'dissolution', 'liminal', 'integration', 'emergence']
    const phase = VALID_SEMIOTIC_PHASES.includes(extracted.phase as SemioticPhase)
      ? (extracted.phase as SemioticPhase)
      : 'liminal' // safe fallback — liminal is valid in both Track A and B
    if (phase !== extracted.phase) {
      log.warn({ actorId: actor.id, invalidPhase: extracted.phase, fallback: phase }, 'GPT returned invalid SemioticPhase — falling back to liminal')
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase.from('myth_events').insert({
      user_id: actor.type === 'user' ? actor.id : null,
      session_id: actor.type === 'guest' ? actor.id : null,
      timestamp: now,
      event_type: 'threshold',
      phase,
      capture_medium,
      raw_content,
      motifs: extracted.motifs as unknown as Json,
      polarities: extracted.polarities as unknown as Json,
      shadow_elements: extracted.shadowElements as unknown as Json,
      coherence_snapshot: (latestScore?.factors ?? null) as unknown as Json,
      cosmogram_data: (cosmogramData ?? null) as unknown as Json,
      paradox_instruction: extracted.paradoxInstruction ?? null,
      micro_action: microAction,
      action_completed: false,
      revisited_count: 0,
      contribute_to_collective: false,
      created_at: now,
      updated_at: now,
    }).select('id').single()

    if (error || !data) {
      log.error({ err: error, actorId: actor.id }, 'Failed to insert myth_event')
      return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
    }

    log.info({ id: data.id, actorType: actor.type, actorId: actor.id, phase }, 'Threshold entry saved to The Interior')

    // Memory Genesis: Store Imprint as EverMemOS episodic trace (Channel 3 — reconstructive recollection)
    if (process.env.EVERMEMOS_ENABLED === 'true' && actor.type === 'user') {
      void (async () => {
        try {
          const { storeMemory, formatMythEventMemCell } = await import('@/lib/evermemos')
          const memcells = formatMythEventMemCell(
            actor.id,
            (extracted.motifs ?? []) as string[],
            (extracted.polarities ?? []) as Array<{ pole_a?: string; pole_b?: string; tension?: number | string }>,
            (extracted.shadowElements ?? {}) as { contacted?: string[]; avoided?: string[]; integrated?: string[] },
            phase,
            raw_content,
            latestScore?.factors as Record<string, number> | null,
            { microAction, eventId: data.id }
          )
          await storeMemory(memcells)
          log.debug({ mythEventId: data.id, userId: actor.id }, 'EverMemOS: Imprint episodic trace stored')
        } catch (err) {
          log.warn({ err, mythEventId: data.id }, 'EverMemOS: failed to store Imprint trace')
        }
      })()
    }

    // Fire imprint_created event — fire-and-forget, non-blocking
    void supabase.from('product_events').insert({
      event_id: crypto.randomUUID(),
      event_name: 'imprint_created',
      source: 'server',
      session_id: actor.type === 'guest' ? actor.id : `myths-${data.id}`,
      user_id: actor.type === 'user' ? actor.id : null,
      demo_mode: false,
      route: '/api/myths',
      sent_at: new Date().toISOString(),
      event_payload: { myth_event_id: data.id, phase, capture_medium },
    })

    // Phase 3: Emit identity signal — authenticated users only, fire-and-forget
    if (actor.type === 'user') {
      void emitIdentitySignal(actor.id, {
        type: 'threshold_capture',
        payload: {
          event_id: data.id,
          phase,
          capture_medium,
          motifs: extracted.motifs ?? [],
        },
        coherenceSnapshot: latestScore?.factors as unknown as CoherenceSnapshot ?? undefined,
        phase,
        source: 'ai_extracted',
        signalStrength: 0.9,
      })
    }

    // Award XP for capturing a threshold — authenticated users only, fire-and-forget
    // Use myth event ID as part of ritualType for per-event idempotency
    // (unlike daily rituals which use ritual type + day, each Imprint deserves its own reward)
    let xpResult: Awaited<ReturnType<typeof awardXP>> | null = null
    if (actor.type === 'user') {
      try {
        const [currentStreak, previousScore, currentScore] = await Promise.all([
          getUserStreak(actor.id),
          getPreviousCoherenceScore(actor.id),
          getLatestCoherenceScore(actor.id),
        ])
        xpResult = await awardXP(actor.id, {
          ritualType: `threshold_capture_${data.id}`,
          currentStreak,
          coherenceScoreBefore: previousScore,
          coherenceScoreAfter: currentScore,
        })
        log.info({ id: data.id, userId: actor.id, xpAwarded: xpResult.xpAwarded }, 'XP awarded for threshold capture')
      } catch (xpErr) {
        // Non-critical: XP award failure must not fail the capture itself
        log.warn({ err: xpErr, mythEventId: data.id, userId: actor.id }, 'XP award failed for threshold capture (non-fatal)')
      }
    }

    return NextResponse.json({
      id: data.id,
      xp: xpResult ? {
        awarded: xpResult.xpAwarded,
        newTotal: xpResult.newTotalXP,
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp,
      } : null,
    }, { status: 201 })
  } catch (err) {
    log.error({ err }, 'myths POST failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
