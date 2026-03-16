/** Stub PhaseUpdateHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class PhaseUpdateHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
