/** Stub idempotency wrapper */
import { NextRequest, NextResponse } from 'next/server'

export function withIdempotency(
  handler: (request: NextRequest) => Promise<NextResponse>,
  _options: { ttlMs: number; keyExtractor: (req: NextRequest) => Promise<string | null> }
) {
  return handler
}
