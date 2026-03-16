/**
 * GET /api/agent/arc
 *
 * Arc Memory — reconstructs a user's transformation arc from EverMemOS memories.
 * Headline demo feature for Memory Genesis hackathon.
 *
 * ?demo=true → skip auth, return hardcoded demo data (zero external dependencies)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthentication } from '@/lib/api/auth-guard'
import { withErrorHandling } from '@/lib/api/route-helpers'
import { chatComplete, CHAT_MODEL_FAST } from '@/lib/anthropic/client'
import { searchMemories, withEverMemOSFallback } from '@/lib/evermemos'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('api/agent/arc')

// ============================================
// Demo Data
// ============================================

const DEMO_ARC_RESPONSE = {
  arc: {
    narrative:
      'You entered January carrying the weight of an identity that no longer fit — a Warrior dismissing vulnerability as weakness. ' +
      'By February, the structure cracked open: coherence dropped, old certainties dissolved, and the liminal space began. ' +
      'Now in March, something new is crystallizing. The Warrior hasn\'t vanished — it\'s been consulted, not commanded. ' +
      'Your sealed Vow to "sit with discomfort before acting" marks the turn from reactive strength to embodied presence.',
    phases: [
      {
        name: 'ENDING',
        month: 'January',
        coherence: 45,
        description: 'Old identity structures dissolving. High agency masking low connection.',
      },
      {
        name: 'LIMINAL',
        month: 'February',
        coherence: 62,
        description: 'In-between space. Shadow work opened. Warrior archetype questioned.',
      },
      {
        name: 'EMERGING',
        month: 'March',
        coherence: 78,
        description: 'New integration forming. Vow sealed. Motifs stabilizing.',
      },
    ],
    motifs: [
      {
        name: 'threshold_crossing',
        evolution: 'Appeared in January as fear, returned in March as invitation.',
      },
      {
        name: 'shadow_integration',
        evolution: 'First contacted in February shadow dialogue, now a recurring presence.',
      },
      {
        name: 'body_wisdom',
        evolution: 'Emerged mid-February. Somatic awareness replacing cognitive override.',
      },
    ],
    timeline: [
      { date: '2026-01-12', event: 'First threshold capture — "everything is falling apart"' },
      { date: '2026-01-28', event: 'Warrior archetype dismissed vulnerability feedback' },
      { date: '2026-02-09', event: 'Shadow dialogue: confronted avoidance pattern' },
      { date: '2026-02-22', event: 'Coherence dip to 48 — dissolution phase entered' },
      { date: '2026-03-03', event: 'Sealed Vow: "sit with discomfort before acting"' },
      { date: '2026-03-10', event: 'Coherence rising — Warrior consulted, not commanded' },
    ],
  },
}

// ============================================
// Arc Reconstruction Prompt
// ============================================

const ARC_RECONSTRUCTION_PROMPT = `You are reconstructing a user's transformation arc from their episodic memories.

Analyze the memories below and produce a JSON object with this exact structure:
{
  "narrative": "A 2-4 sentence poetic narrative of their transformation arc",
  "phases": [
    { "name": "PHASE_NAME", "month": "Month", "coherence": 0-100, "description": "1 sentence" }
  ],
  "motifs": [
    { "name": "motif_name", "evolution": "How this motif changed across the arc" }
  ],
  "timeline": [
    { "date": "YYYY-MM-DD", "event": "Brief description" }
  ]
}

Rules:
- Phases should be 2-4 entries showing the transformation trajectory
- Motifs should highlight recurring symbolic patterns and how they evolved
- Timeline should include 4-8 key moments
- Narrative should be poetic but grounded in the actual data
- Return ONLY valid JSON, no markdown`

// ============================================
// GET Handler
// ============================================

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url)
  const isDemo = url.searchParams.get('demo') === 'true'

  // Demo mode — zero external dependencies
  if (isDemo) {
    log.info({}, 'Arc Memory: serving demo response')
    return NextResponse.json(DEMO_ARC_RESPONSE)
  }

  // Normal mode — require auth
  const authResult = await requireAuthentication()
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const userId = authResult.id

  // Query EverMemOS for transformation arc memories
  const memories = await withEverMemOSFallback(
    () => searchMemories(
      'Reconstruct this user\'s transformation arc: key threshold moments, phase transitions, motif evolution, archetype shifts, sealed Vows, and coherence trajectory over time.',
      userId,
      'agentic',
      15
    ),
    [],
    'arc-memory-reconstruction'
  )

  if (memories.length === 0) {
    return NextResponse.json(
      { arc: null, message: 'Not enough memory data yet' },
      { status: 200 }
    )
  }

  log.info(
    { userId, memoryCount: memories.length },
    'Arc Memory: reconstructing from EverMemOS memories'
  )

  // Feed memories into Claude for narrative reconstruction
  const memoryContext = memories.map(r => r.content).join('\n---\n').slice(0, 2000)

  const result = await chatComplete(
    CHAT_MODEL_FAST,
    [
      {
        role: 'system',
        content: ARC_RECONSTRUCTION_PROMPT,
      },
      {
        role: 'user',
        content: `Here are the user's episodic memories:\n\n${memoryContext}`,
      },
    ],
    { temperature: 0.7, max_tokens: 1000 }
  )

  try {
    const arc = JSON.parse(result)
    return NextResponse.json({ arc })
  } catch {
    log.warn({ result }, 'Arc Memory: failed to parse Claude response as JSON')
    return NextResponse.json(
      { arc: null, message: 'Failed to reconstruct arc — try again' },
      { status: 500 }
    )
  }
}, 'agent-arc')
