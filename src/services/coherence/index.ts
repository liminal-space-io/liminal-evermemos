/** Stub CoherenceService */
export class CoherenceService {
  constructor(_repository: any, _eventBus: any, _logger: any) {}

  async submitCheck(_opts: {
    userId: string
    factors: Record<string, number>
    context: string
    variationType?: string
    isDemoMode: boolean
  }) {
    return { score: 0.7, factors: _opts.factors }
  }

  async getHistory(_userId: string, _opts: { timeWindow: number; startDate?: string; endDate?: string }) {
    return { scores: [] }
  }
}
