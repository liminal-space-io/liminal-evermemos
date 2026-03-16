/** Stub council deliberation */
export async function generateCouncilDeliberation(opts: {
  userId: string
  topic: string
  factors: Record<string, number>
  affectedDimensions: string[]
  phase?: string
}) {
  return {
    id: 'stub-deliberation',
    participants: ['oracle', 'healer', 'warrior'],
    perspectives: [{ archetype: 'oracle', content: 'Stub perspective' }],
    debate: [],
    synthesis: 'Stub synthesis for: ' + opts.topic,
    attribution: 'oracle',
    convergenceSignal: 'aligned',
  }
}
