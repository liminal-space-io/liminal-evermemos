/** Stub IdentitySignalHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class IdentitySignalHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
