/** Stub ValidationTrackingHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class ValidationTrackingHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
