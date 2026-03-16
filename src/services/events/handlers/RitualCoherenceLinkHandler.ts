/** Stub RitualCoherenceLinkHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class RitualCoherenceLinkHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
