/**
 * Arc Memory API Route — /api/agent/arc
 *
 * Performs reconstructive recollection via EverMemOS agentic retrieval,
 * then generates a transformation narrative using Claude API.
 *
 * Query params:
 *   ?demo=true — uses pre-seeded data, no auth required
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchMemories } from '@/lib/evermemos/client';
import { generateTransformationNarrative } from '@/lib/evermemos/narrative';

// TODO(LIM-958): Build Arc Memory UI

export async function GET(request: NextRequest) {
  const isDemo = request.nextUrl.searchParams.get('demo') === 'true';
  const userId = isDemo ? 'demo_user' : ''; // TODO: extract from auth

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 1: Agentic retrieval — reconstruct transformation arc from MemCells
  const memories = await searchMemories({
    query: `Reconstruct this user's transformation arc. What recurring motifs, phase transitions, archetype evolution, and shadow patterns define their inner journey?`,
    user_id: userId,
    retrieve_method: 'agentic',
  });

  // Step 2: Generate narrative via Claude API
  let narrative: string | null = null;
  if (memories.status !== 'error' && memories.result) {
    try {
      const memoriesContext = JSON.stringify(memories.result, null, 2);
      narrative = await generateTransformationNarrative(memoriesContext);
    } catch {
      // Graceful degradation — return memories without narrative
    }
  }

  return NextResponse.json({
    status: 'ok',
    memories: memories.result,
    narrative,
  });
}
