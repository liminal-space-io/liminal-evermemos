/** Stub AnalyticsHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class AnalyticsHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any, _resolveEntrypoint?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
