/** Stub event bus interfaces */

export interface DomainEvent {
  type: string
}

export interface CheckCompletedEvent extends DomainEvent {
  type: 'check_completed'
  userId: string
  score: number
  factors: Record<string, number>
  phase: string
  context?: string
  mode?: string
  checkId?: string
}

export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>
}

export interface IEventBus {
  subscribe<T extends DomainEvent>(eventType: string, handler: IEventHandler<T>): void
  publish(event: DomainEvent): Promise<void>
}
