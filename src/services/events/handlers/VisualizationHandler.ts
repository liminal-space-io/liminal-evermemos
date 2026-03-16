/** Stub VisualizationHandler */
import type { IEventHandler, CheckCompletedEvent } from '../IEventBus'

export class VisualizationHandler implements IEventHandler<CheckCompletedEvent> {
  constructor(_logger?: any) {}
  async handle(_event: CheckCompletedEvent): Promise<void> {}
}
