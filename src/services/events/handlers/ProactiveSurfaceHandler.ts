/** Stub ProactiveSurfaceHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class ProactiveSurfaceHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
