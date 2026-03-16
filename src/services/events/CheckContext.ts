/** Stub check context */
export interface CheckContext {
  userId: string
  score: number
  factors: Record<string, number>
}

export function createEmptyCheckContext(): CheckContext {
  return { userId: '', score: 0, factors: {} }
}
