/**
 * EverMemOSHandler — Stores coherence checks as episodic traces in EverMemOS.
 *
 * Memory Genesis 2026 — Channel 1: Coherence → EverMemOS.
 * Follows ProactiveSurfaceHandler pattern: fire-and-forget, never throws.
 */

import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'
import { storeMemory } from '@/lib/evermemos/client'
import { formatCoherenceMemCell } from '@/lib/evermemos/formatters'

export class EverMemOSHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(private readonly logger: any) {}

  async handle(event: CheckCompletedEvent): Promise<void> {
    try {
      const factors: Record<string, number> = {}
      if (event.factors && typeof event.factors === 'object') {
        for (const [key, value] of Object.entries(event.factors)) {
          if (typeof value === 'number') {
            factors[key] = value
          }
        }
      }

      const memcells = formatCoherenceMemCell(
        event.userId,
        event.score,
        factors,
        event.phase,
        event.context ?? '',
        { mode: event.mode, checkId: event.checkId }
      )

      await storeMemory(memcells)

      this.logger.debug(
        { userId: event.userId, score: event.score },
        'EverMemOS: coherence episodic trace stored'
      )
    } catch (err) {
      this.logger.warn({ err, userId: event.userId }, 'EverMemOS: failed to store coherence trace')
    }
  }
}
