/** Stub factor bridge */
export function bridgeToSevenFactors(fourFactors: Record<string, number>): Record<string, number> {
  return {
    stability: fourFactors.stability ?? 0.5,
    vitality: fourFactors.vitality ?? 0.5,
    agency: fourFactors.alignment ?? 0.5,
    connection: fourFactors.connection ?? 0.5,
    expression: fourFactors.expression ?? 0.5,
    clarity: fourFactors.clarity ?? 0.5,
    wholeness: fourFactors.integration ?? 0.5,
  }
}
