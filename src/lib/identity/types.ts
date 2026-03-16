/** Stub identity types */
export type CoherenceSnapshot = Record<string, number>

export interface UserIdentityState {
  coherenceTrajectory: 'ascending' | 'stable' | 'descending' | 'volatile' | null
  trajectorySlope: number | null
  activeArchetypes: string[]
  archetypeEvolution?: Record<string, 'rising' | 'falling' | 'stable'>
  shadowPattern: 'avoiding' | 'contacting' | 'integrating' | null
  semioticCalibration: number | null
  engagementTier: 'new' | 'activating' | 'practicing' | 'integrated'
  strongFactors: string[]
  weakFactors: string[]
  dominantPhase?: string
  imprintCount: number
}
