/** Stub semiotic mapping rules */
import type { SemanticParameters, ColorPrimitive, MotionPrimitive, SemioticMapping, Phase } from './types'

export function buildSemanticParameters(opts: {
  phase: Phase
  coherenceSnapshot?: Record<string, number>
  arousalLevel?: number
  agencySense?: number
  motifs: string[]
  polarities: any[]
  shadowElements: Record<string, unknown>
}): SemanticParameters {
  const coherence = opts.coherenceSnapshot
    ? Object.values(opts.coherenceSnapshot).reduce((a, b) => a + b, 0) / Object.values(opts.coherenceSnapshot).length
    : 0.5
  return {
    phase: opts.phase,
    coherence,
    coherenceSnapshot: opts.coherenceSnapshot,
    shadow_contact: 'contacted',
    arousal: 'calm',
    agency: 'medium',
    polarity: 'flexible',
    motifs: opts.motifs,
    polarities: opts.polarities ?? [],
  }
}

export function mapPhaseToColor(_phase: Phase, _userMappings: SemioticMapping[]): ColorPrimitive {
  return { type: 'color', hue: 256, saturation: 0.6, lightness: 0.5 }
}

export function mapCoherenceToColor(_coherence: number, _userMappings: SemioticMapping[]): ColorPrimitive {
  return { type: 'color', hue: 200, saturation: 0.5, lightness: 0.5 }
}

export function mapArousalToMotion(_arousal: string, _userMappings: SemioticMapping[]): MotionPrimitive {
  return { type: 'motion', tempo: 'breathing', amplitude: 0.5 }
}
