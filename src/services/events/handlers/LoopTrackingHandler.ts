/** Stub LoopTrackingHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class LoopTrackingHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
