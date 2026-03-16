import 'server-only'

/**
 * Evermind Content Formatters
 *
 * Produce natural-language MemCell content from Liminal domain events.
 * Uses Evermind metadata: group_id, tags, scene for semantic grouping.
 */

import type { EverMemOSMessage } from './types'

function makeMessageId(prefix: string, userId: string, domainId?: string | null): string {
  if (domainId) return `${prefix}-${domainId}`
  return `${prefix}-${userId}-${crypto.randomUUID().slice(0, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

/**
 * Format a coherence check as an episodic trace MemCell.
 */
export function formatCoherenceMemCell(
  userId: string,
  score: number,
  factors: Record<string, number>,
  phase: string,
  context: string,
  options?: { mode?: string; checkId?: string | null }
): EverMemOSMessage[] {
  // Identify dominant and weakest factors
  const entries = Object.entries(factors).filter(([, v]) => typeof v === 'number')
  const sorted = [...entries].sort(([, a], [, b]) => b - a)
  const dominant = sorted[0]?.[0] ?? 'unknown'
  const weakest = sorted[sorted.length - 1]?.[0] ?? 'unknown'

  const factorDetail = entries
    .map(([k, v]) => `${k}=${Math.round(v * 100)}`)
    .join(', ')

  const overallPercent = Math.round(score * 100)

  // Tier classification for tagging
  const tier = overallPercent >= 75 ? 'high' : overallPercent >= 50 ? 'mid' : 'low'

  const content = [
    `Coherence check: overall ${overallPercent}/100.`,
    options?.mode ? `Mode: ${options.mode}.` : null,
    `Factors: ${factorDetail}.`,
    `Dominant: ${dominant}. Weakest: ${weakest}.`,
    `Phase: ${phase.toUpperCase()}.`,
    context ? context : null,
  ]
    .filter(Boolean)
    .join(' ')

  return [
    {
      message_id: makeMessageId('coherence', userId, options?.checkId),
      create_time: now(),
      sender: 'user',
      content,
      metadata: {
        group_id: `user-${userId}`,
        tags: ['coherence-check', `phase:${phase}`, `tier:${tier}`, `dominant:${dominant}`],
        scene: 'daily-practice',
      },
    },
  ]
}

/**
 * Format an Imprint/myth event as an episodic trace MemCell.
 * This is the reconstructive recollection demo — motifs accumulate
 * and Evermind reconstructs meaning from the pattern.
 */
export function formatMythEventMemCell(
  userId: string,
  motifs: string[],
  polarities: Array<{ pole_a?: string; pole_b?: string; tension?: number | string }>,
  shadowElements: { contacted?: string[]; avoided?: string[]; integrated?: string[] },
  phase: string,
  rawContent?: string,
  coherenceSnapshot?: Record<string, number> | null,
  options?: { microAction?: string; eventId?: string | null }
): EverMemOSMessage[] {
  const motifList = motifs.length > 0 ? motifs.join(', ') : 'none identified'

  const polaritySummary = polarities
    .map((p) => `${p.pole_a ?? '?'}↔${p.pole_b ?? '?'}${p.tension != null ? ` (tension: ${typeof p.tension === 'number' ? p.tension.toFixed(2) : p.tension})` : ''}`)
    .join(', ')

  const shadowParts = [
    shadowElements.contacted?.length ? `Shadow contacted: ${shadowElements.contacted.join(', ')}` : null,
    shadowElements.avoided?.length ? `Shadow avoided: ${shadowElements.avoided.join(', ')}` : null,
    shadowElements.integrated?.length ? `Shadow integrated: ${shadowElements.integrated.join(', ')}` : null,
  ].filter(Boolean)

  const overallCoherence = coherenceSnapshot
    ? Math.round(Object.values(coherenceSnapshot).reduce((a, b) => a + b, 0) / Object.values(coherenceSnapshot).length * 100)
    : null

  const content = [
    `Threshold moment (${phase}):`,
    rawContent ? `'${rawContent.slice(0, 200)}'` : null,
    `Motifs: ${motifList}.`,
    polaritySummary ? `Polarities: ${polaritySummary}.` : null,
    ...shadowParts.map((s) => `${s}.`),
    overallCoherence != null ? `Coherence at moment: ${overallCoherence}/100.` : null,
    options?.microAction ? `Micro-action: '${options.microAction}'` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const motifTags = motifs.map((m) => `motif:${m.toLowerCase().replace(/\s+/g, '_')}`)

  return [
    {
      message_id: makeMessageId('myth', userId, options?.eventId),
      create_time: now(),
      sender: 'user',
      content,
      metadata: {
        group_id: `user-${userId}`,
        tags: ['myth-event', `type:threshold`, `phase:${phase}`, ...motifTags],
        scene: 'interior-threshold',
      },
    },
  ]
}

/**
 * Format a Council deliberation as an episodic trace MemCell.
 */
export function formatCouncilMemCell(
  userId: string,
  question: string,
  archetypes: string[],
  synthesis: string,
  reaction?: string | null,
  options?: { convergenceSignal?: string; conversationId?: string | null }
): EverMemOSMessage[] {
  const archetypeTags = archetypes.map((a) => `archetype:${a.toLowerCase()}`)

  const content = [
    `Council deliberation on "${question}".`,
    `Archetypes present: ${archetypes.join(', ')}.`,
    `Synthesis: ${synthesis}`,
    options?.convergenceSignal ? `Convergence signal: ${options.convergenceSignal}.` : null,
    reaction ? `User reaction: ${reaction}.` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return [
    {
      message_id: makeMessageId('council', userId, options?.conversationId),
      create_time: now(),
      sender: 'assistant',
      content,
      metadata: {
        group_id: `user-${userId}`,
        tags: ['council', ...archetypeTags],
        scene: 'council-session',
      },
    },
  ]
}
