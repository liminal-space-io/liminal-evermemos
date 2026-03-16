/** Stub EngagementHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class EngagementHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
