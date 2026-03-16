/** Stub ArchetypeRoutingHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class ArchetypeRoutingHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
