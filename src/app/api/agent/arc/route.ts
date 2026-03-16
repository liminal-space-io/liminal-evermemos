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

// TODO(LIM-957): Wire Claude API for narrative generation
// TODO(LIM-958): Build Arc Memory UI

export async function GET(request: NextRequest) {
  const isDemo = request.nextUrl.searchParams.get('demo') === 'true';
  const userId = isDemo ? 'demo_user' : ''; // TODO: extract from auth

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 1: Agentic retrieval — reconstruct transformation arc
  const memories = await searchMemories({
    query: `Reconstruct this user's transformation arc. What recurring motifs, phase transitions, archetype evolution, and shadow patterns define their inner journey?`,
    user_id: userId,
    retrieve_method: 'agentic',
  });

  // Step 2: Generate narrative (TODO — Claude API integration)
  // For now, return raw memories
  return NextResponse.json({
    status: 'ok',
    memories: memories.result,
    narrative: null, // TODO: Claude API narrative generation
  });
}
