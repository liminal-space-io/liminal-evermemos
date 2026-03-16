/** Stub EventBus */
import type { DomainEvent, IEventBus, IEventHandler } from './IEventBus'

export class EventBus implements IEventBus {
  private handlers = new Map<string, IEventHandler<any>[]>()

  constructor(_logger?: any) {}

  subscribe<T extends DomainEvent>(eventType: string, handler: IEventHandler<T>): void {
    const existing = this.handlers.get(eventType) || []
    existing.push(handler)
    this.handlers.set(eventType, existing)
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || []
    await Promise.allSettled(handlers.map((h) => h.handle(event)))
  }
}
