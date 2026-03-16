/** Stub ArchetypeResonanceHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class ArchetypeResonanceHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
