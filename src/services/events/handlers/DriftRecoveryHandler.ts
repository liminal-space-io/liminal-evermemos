/** Stub DriftRecoveryHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class DriftRecoveryHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
