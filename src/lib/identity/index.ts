/** Stub identity barrel */
export { emitIdentitySignal } from './emit-signal'
export type { UserIdentityState, CoherenceSnapshot } from './types'
import type { UserIdentityState } from './types'

export async function getUserIdentityState(_userId: string): Promise<UserIdentityState | null> {
  return null
}
