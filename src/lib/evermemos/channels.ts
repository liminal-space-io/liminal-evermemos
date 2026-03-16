/**
 * Channel adapters — transform Liminal events into EverMemOS MemCells.
 *
 * Three channels:
 *   1. Coherence checks → MemCell (daily practice data)
 *   2. Council deliberations → MemCell (archetype dialogue)
 *   3. Threshold moments → MemCell (myth events / Imprint capture)
 */

import { storeMemory } from './client';

/** Channel 1: Coherence check → EverMemOS */
export async function storeCoherenceCheck(params: {
  checkId: string;
  userId: string;
  timestamp: string;
  score: number;
  factors: Record<string, number>;
  dominant: string;
  weakest: string;
  mode: string;
  currentPhase: string;
  coherenceTier: string;
}) {
  const { checkId, userId, timestamp, score, factors, dominant, weakest, mode, currentPhase, coherenceTier } = params;

  return storeMemory({
    message_id: `coherence-${checkId}`,
    create_time: timestamp,
    sender: userId,
    content: `Coherence check: overall ${score}. Factors: stability=${factors.stability}, vitality=${factors.vitality}, agency=${factors.agency}, connection=${factors.connection}, expression=${factors.expression}, clarity=${factors.clarity}, wholeness=${factors.wholeness}. Dominant: ${dominant}. Weakest: ${weakest}. Mode: ${mode}.`,
    metadata: {
      group_id: `user-${userId}`,
      tags: ['coherence-check', `phase:${currentPhase}`, `tier:${coherenceTier}`],
      scene: 'daily-practice',
    },
  });
}

/** Channel 2: Council deliberation → EverMemOS */
export async function storeCouncilDeliberation(params: {
  conversationId: string;
  userId: string;
  timestamp: string;
  topic: string;
  archetypes: string[];
  synthesisSnippet: string;
  convergenceSignal: string;
  reaction: string;
}) {
  const { conversationId, userId, timestamp, topic, archetypes, synthesisSnippet, convergenceSignal, reaction } = params;

  return storeMemory({
    message_id: `council-${conversationId}`,
    create_time: timestamp,
    sender: userId,
    content: `Council deliberation on "${topic}". Archetypes present: ${archetypes.join(', ')}. Synthesis: ${synthesisSnippet}. Convergence signal: ${convergenceSignal}. User reaction: ${reaction}.`,
    metadata: {
      group_id: `user-${userId}`,
      tags: ['council', ...archetypes.map(a => `archetype:${a}`)],
      scene: 'council-session',
    },
  });
}

/** Channel 3: Threshold moment (myth event) → EverMemOS */
export async function storeThresholdMoment(params: {
  eventId: string;
  userId: string;
  timestamp: string;
  eventType: string;
  rawContent: string;
  motifs: string[];
  polarities: Array<{ pole_a: string; pole_b: string }>;
  shadowContacted: string;
  coherenceSnapshot: number;
  phase: string;
}) {
  const { eventId, userId, timestamp, eventType, rawContent, motifs, polarities, shadowContacted, coherenceSnapshot, phase } = params;

  return storeMemory({
    message_id: `myth-${eventId}`,
    create_time: timestamp,
    sender: userId,
    content: `Threshold moment (${eventType}): ${rawContent}. Motifs: ${motifs.join(', ')}. Polarities: ${polarities.map(p => `${p.pole_a}↔${p.pole_b}`).join(', ')}. Shadow contacted: ${shadowContacted}. Coherence at moment: ${coherenceSnapshot}.`,
    metadata: {
      group_id: `user-${userId}`,
      tags: ['myth-event', `type:${eventType}`, `phase:${phase}`, ...motifs],
      scene: 'interior-threshold',
    },
  });
}
