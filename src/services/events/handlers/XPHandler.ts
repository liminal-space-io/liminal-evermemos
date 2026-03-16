/** Stub XPHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class XPHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
