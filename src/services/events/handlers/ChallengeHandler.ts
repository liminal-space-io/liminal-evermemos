/** Stub ChallengeHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class ChallengeHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
