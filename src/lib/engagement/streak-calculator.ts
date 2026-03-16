/** Stub streak calculator */
export function getToday(_tzOffset?: number): string {
  return new Date().toISOString().split('T')[0]
}
