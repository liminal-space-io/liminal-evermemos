/**
 * Semiotic Compiler
 *
 * Compiles lived experience (myth events) into symbolic artifacts (Imprints).
 * This is the core "experience → sign → meaning → action" transformation.
 *
 * EverMemOS integration (LIM-961): When EVERMEMOS_ENABLED=true, the compiler
 * queries past motif recurrence via Evermind search and threads that context
 * through artifact compilation — motif continuity influences micro-action
 * generation, enriches artifact metadata, and ensures Imprints reference
 * the user's evolving symbolic vocabulary rather than treating each
 * threshold moment in isolation.
 */

import type {
  MythEvent,
  GeneratedArtifact,
  ImprintData,
  NarrativeScene,
  SemanticParameters,
  SemioticMapping,
  ColorPrimitive,
} from './types';
import type { UserIdentityState } from '@/lib/identity/types';
import {
  buildSemanticParameters,
  mapPhaseToColor,
  mapCoherenceToColor,
  mapArousalToMotion,
} from './mapping-rules';
import { MOTIF_GLYPHS } from './glyphs';
import { logger } from '@/lib/logger';

// Chakra-aligned factor hues — same color language as ImprintRenderer and AuraOrb.
// Each factor maps to its chakra color so ring colors are semantically consistent.
const FACTOR_HUES: Record<string, number> = {
  stability:  348, // Root — red
  vitality:    39, // Sacral — orange
  agency:      54, // Solar Plexus — yellow
  connection:  95, // Heart — green
  expression: 187, // Throat — teal
  clarity:    256, // Third Eye — violet
  wholeness:  300, // Crown — magenta
};

const log = logger.child({ module: 'semiotic-compiler' });

// ============================================================================
// Main Compiler
// ============================================================================

/**
 * Compiles a myth event into a generated artifact.
 * When identityState is provided, the Imprint is enriched with self-model
 * context (trajectory, archetypes, shadow, calibration) for narrative rendering.
 *
 * EverMemOS integration: queries past motif recurrence to inform micro-action
 * generation and stores recurrence context in artifact metadata for downstream
 * continuity (e.g. the renderer can show "recurring motif" indicators).
 */
export async function compileExperienceToArtifact(
  mythEvent: MythEvent,
  userMappings: SemioticMapping[],
  identityState?: UserIdentityState | null
): Promise<GeneratedArtifact> {
  try {
    // Build semantic parameters
    const params = buildSemanticParameters({
      phase: mythEvent.phase,
      coherenceSnapshot: mythEvent.coherenceSnapshot,
      arousalLevel: mythEvent.arousalLevel,
      agencySense: mythEvent.agencySense,
      motifs: mythEvent.motifs,
      polarities: mythEvent.polarities,
      shadowElements: mythEvent.shadowElements,
    });

    // -----------------------------------------------------------------------
    // EverMemOS: Query motif recurrence (reconstructive recollection)
    //
    // This is the core LIM-961 integration point. Past motif patterns from
    // EverMemOS episodic memory inform the current Imprint compilation:
    //   1. motifRecurrenceContext → threaded into micro-action prompt
    //   2. recurringMotifs → extracted from search results for visual tagging
    //   3. metadata.motifRecurrenceContext → persisted on artifact for downstream use
    // -----------------------------------------------------------------------
    let motifRecurrenceContext: string | null = null;
    let recurringMotifs: string[] = [];
    if (process.env.EVERMEMOS_ENABLED === 'true' && mythEvent.userId) {
      try {
        const { withEverMemOSFallback, searchMemories } = await import('@/lib/evermemos');
        const pastMotifs = await withEverMemOSFallback(
          () => searchMemories(
            `What motifs have appeared in this user's previous Imprints? Trace motif evolution and recurrence.`,
            mythEvent.userId,
            'agentic',
            5,
            'myth-event'
          ),
          [],
          'imprint-motif-recurrence'
        );
        if (pastMotifs.length > 0) {
          motifRecurrenceContext = pastMotifs.map((r) => r.content).join(' ').slice(0, 500);

          // Cross-reference current motifs against EverMemOS results to identify recurrences
          const pastText = motifRecurrenceContext.toLowerCase();
          recurringMotifs = mythEvent.motifs.filter(
            (motif) => pastText.includes(motif.toLowerCase().replace(/_/g, ' ')) ||
                        pastText.includes(motif.toLowerCase())
          );

          log.debug(
            { mythEventId: mythEvent.id, resultCount: pastMotifs.length, recurringMotifs },
            'EverMemOS: motif recurrence context retrieved'
          );
        }
      } catch (err) {
        log.warn({ err, mythEventId: mythEvent.id }, 'EverMemOS: motif recurrence query failed');
      }
    }

    // Choose artifact type (default to imprint)
    const artifactType = mythEvent.artifactType || 'imprint';

    let artifactData;
    switch (artifactType) {
      case 'imprint':
        artifactData = generateImprint(params, userMappings);
        break;
      case 'sigil':
        log.warn({ mythEventId: mythEvent.id }, 'sigil not implemented, falling back to imprint');
        artifactData = generateImprint(params, userMappings);
        break;
      case 'three_frame_reel':
        log.warn({ mythEventId: mythEvent.id }, 'three_frame_reel not implemented, falling back to imprint');
        artifactData = generateImprint(params, userMappings);
        break;
      default:
        artifactData = generateImprint(params, userMappings);
    }

    // Enrich Imprint with self-model narrative context when available
    const enrichedData = artifactType === 'imprint' && identityState
      ? enrichImprintWithIdentity(artifactData as ImprintData, identityState, {
          imprintCount: identityState.imprintCount,
          actionCompleted: mythEvent.actionCompleted,
          revisitedCount: mythEvent.revisitedCount,
        }, userMappings)
      : artifactData;

    const artifact: GeneratedArtifact = {
      mythEventId: mythEvent.id,
      type: artifactType,
      data: enrichedData,
      microAction: mythEvent.microAction || generateMicroAction(params, motifRecurrenceContext, recurringMotifs),
      paradoxInstruction: mythEvent.paradoxInstruction,
      createdAt: new Date(),
      // Persist EverMemOS enrichment in metadata so downstream consumers
      // (renderer, revisit flow, narrative engine) can access motif continuity
      ...(motifRecurrenceContext || recurringMotifs.length > 0
        ? {
            metadata: {
              ...(motifRecurrenceContext ? { motifRecurrenceContext } : {}),
              ...(recurringMotifs.length > 0 ? { recurringMotifs } : {}),
              evermemosEnriched: true,
            },
          }
        : {}),
    };

    log.info(
      { mythEventId: mythEvent.id, artifactType, hasMotifRecurrence: !!motifRecurrenceContext, recurringMotifCount: recurringMotifs.length },
      'Compiled experience to artifact'
    );

    return artifact;
  } catch (error) {
    log.error(
      { err: error, mythEventId: mythEvent.id },
      'Failed to compile artifact'
    );
    throw error;
  }
}

// ============================================================================
// Imprint Generation
// ============================================================================

/**
 * Generates an Imprint artifact — the visual record a threshold leaves behind.
 */
function generateImprint(
  params: SemanticParameters,
  userMappings: SemioticMapping[]
): ImprintData {
  // Center: Phase color
  const centerColor = mapPhaseToColor(params.phase, userMappings);

  // Rings: 7-factor coherence with chakra-aligned hues
  const rings = generateCoherenceRings(params, userMappings);

  // Motifs: Top 3 archetypal symbols
  const motifSymbols = generateMotifSymbols(params.motifs, centerColor);

  // Breathing animation
  const breathingAnimation = mapArousalToMotion(params.arousal, userMappings);

  // Palette (derived from phase + coherence)
  const palette = generatePalette(params, userMappings);

  return {
    centerPhase: params.phase,
    centerColor,
    rings,
    motifSymbols,
    breathingAnimation,
    palette,
    polarities: params.polarities,
  };
}

/**
 * Generates coherence rings for the Imprint using chakra-aligned factor hues.
 */
function generateCoherenceRings(
  params: SemanticParameters,
  userMappings: SemioticMapping[]
): ImprintData['rings'] {
  const factors = [
    'stability',
    'vitality',
    'agency',
    'connection',
    'expression',
    'clarity',
    'wholeness',
  ];

  const coherenceModifiers = mapCoherenceToColor(params.coherence, userMappings);
  const baseColor = mapPhaseToColor(params.phase, userMappings);

  return factors.map((factor) => {
    const value = params.coherenceSnapshot?.[factor] ?? params.coherence;

    // Use chakra-aligned hue per factor so ring colors match the semantic color language.
    const factorHue = FACTOR_HUES[factor] ?? baseColor.hue;
    const color: ColorPrimitive = {
      type: 'color',
      hue: factorHue,
      saturation: coherenceModifiers.saturation || baseColor.saturation || 0.6,
      lightness: baseColor.lightness || 0.5,
    };

    const thickness = 4 + value * 8; // 4-12px range

    return { factor, value, color, thickness };
  });
}

/**
 * Generates motif symbols for the Imprint.
 */
function generateMotifSymbols(
  motifs: string[],
  baseColor: ColorPrimitive
): ImprintData['motifSymbols'] {
  const topMotifs = motifs.slice(0, 3);

  return topMotifs.map((motif, index) => {
    const angle = (index * 360) / topMotifs.length;
    const radius = 0.7;

    const color: ColorPrimitive = {
      type: 'color',
      hue: (baseColor.hue + index * 30) % 360,
      saturation: baseColor.saturation || 0.6,
      lightness: baseColor.lightness || 0.5,
    };

    const glyph = MOTIF_GLYPHS[motif] || '\u25C6'; // Default diamond

    return { motif, position: { angle, radius }, glyph, color };
  });
}

/**
 * Generates color palette from semantic parameters.
 */
function generatePalette(
  params: SemanticParameters,
  userMappings: SemioticMapping[]
): ColorPrimitive[] {
  const baseColor = mapPhaseToColor(params.phase, userMappings);
  const coherenceModifiers = mapCoherenceToColor(params.coherence, userMappings);

  return [
    baseColor,
    {
      ...baseColor,
      hue: (baseColor.hue + 180) % 360,
      saturation: coherenceModifiers.saturation || baseColor.saturation || 0.6,
    },
    {
      ...baseColor,
      hue: (baseColor.hue + 30) % 360,
    },
    {
      ...baseColor,
      hue: (baseColor.hue - 30 + 360) % 360,
    },
  ];
}

// ============================================================================
// Identity Enrichment — Wire Self-Model to Imprint
// ============================================================================

/**
 * Optional myth event context for narrative arc computation.
 */
interface MythEventContext {
  imprintCount: number;
  actionCompleted: boolean;
  revisitedCount: number;
}

/**
 * Enriches an ImprintData with narrative scene context from the user's identity state.
 *
 * This is the bridge between the self-model and the renderer. The narrative scene
 * carries trajectory, archetype presences, shadow engagement, calibration quality,
 * factor profile, and narrative arc state — turning a "mood circle" into a "state portrait."
 */
export function enrichImprintWithIdentity(
  imprint: ImprintData,
  identityState: UserIdentityState,
  eventContext?: MythEventContext,
  userMappings?: SemioticMapping[]
): ImprintData {
  // Determine narrative arc state from event context
  let narrativeArc: NarrativeScene['narrativeArc'] = 'open';
  if (eventContext) {
    if (eventContext.imprintCount === 0) {
      narrativeArc = 'first';
    } else if (eventContext.actionCompleted) {
      narrativeArc = 'sealed';
    } else if (eventContext.revisitedCount > 0) {
      narrativeArc = 'revisited';
    }
  }

  // Resolve user-calibrated figureHue from semiotic_mappings.
  let figureHue: number | undefined;
  if (userMappings) {
    const phaseColorMapping = userMappings.find(
      (m) => m.parameterName === 'phase' && m.primitiveType === 'color'
    );
    if (phaseColorMapping && phaseColorMapping.calibrationCount > 0) {
      const expressionRule = phaseColorMapping.mappingRules['expression'] as Record<string, number> | undefined;
      if (expressionRule?.hue !== undefined) {
        figureHue = expressionRule.hue;
      }
    }
  }

  const narrativeScene: NarrativeScene = {
    trajectory: identityState.coherenceTrajectory,
    trajectorySlope: identityState.trajectorySlope,
    archetypePresences: identityState.activeArchetypes.map((archetype) => ({
      archetype,
      evolution: identityState.archetypeEvolution?.[archetype] ?? 'stable',
    })),
    shadowPattern: identityState.shadowPattern,
    calibrationClarity: identityState.semioticCalibration,
    engagementTier: identityState.engagementTier,
    strongFactors: identityState.strongFactors,
    weakFactors: identityState.weakFactors,
    narrativeArc,
    figureHue,
  };

  return { ...imprint, narrativeScene };
}

// ============================================================================
// Micro-Action Generation (Rule-Based + EverMemOS Motif Continuity)
// ============================================================================

/**
 * Generates a micro-action personalized to the user's phase, motifs, and
 * shadow elements. When EverMemOS motif recurrence data is available,
 * the action references recurring motifs to reinforce continuity across
 * threshold moments — this is the "Imprint memory" that LIM-961 enables.
 *
 * Uses rule-based generation (no LLM call) with motif-aware templates
 * that adapt when recurring motifs are detected from EverMemOS.
 */
function generateMicroAction(
  params: SemanticParameters,
  motifRecurrenceContext: string | null,
  recurringMotifs: string[]
): string {
  const { phase, coherence, arousal, agency } = params;

  // When EverMemOS reveals recurring motifs, generate continuity-aware actions
  // that reference the user's evolving symbolic vocabulary
  if (recurringMotifs.length > 0) {
    const motifLabel = recurringMotifs[0].replace(/_/g, ' ');
    return generateRecurrenceAwareAction(motifLabel, phase, coherence);
  }

  // When we have motif recurrence context but no exact match on current motifs,
  // still acknowledge the user's past symbolic landscape
  if (motifRecurrenceContext) {
    return generateContextAwareAction(phase, coherence, arousal);
  }

  // Base rule-based fallback (no EverMemOS data available)
  return generateBaseAction(phase, coherence, arousal, agency);
}

/**
 * Generates a micro-action that explicitly references a recurring motif,
 * creating narrative continuity across Imprints via EverMemOS memory.
 */
function generateRecurrenceAwareAction(
  motifLabel: string,
  phase: SemanticParameters['phase'],
  coherence: number
): string {
  // Motif-specific continuity templates per phase
  const templates: Record<string, string[]> = {
    dissolution: [
      `Notice how ${motifLabel} appears again. What is it dissolving this time?`,
      `${motifLabel} has returned. Name what it asks you to release.`,
    ],
    liminal: [
      `${motifLabel} is a recurring visitor. Sit with it without naming what comes next.`,
      `You have met ${motifLabel} before. Let that familiarity steady you in the unknown.`,
    ],
    integration: [
      `${motifLabel} keeps surfacing. Write one sentence about what it teaches you each time.`,
      `Trace ${motifLabel} across your thresholds. What thread connects them?`,
    ],
    emergence: [
      `${motifLabel} has accompanied your journey. Take one step that honors its persistence.`,
      `The recurrence of ${motifLabel} is itself the message. Name the new form it takes.`,
    ],
    initiation: [
      `${motifLabel} appears at this beginning too. State what you carry forward from past encounters.`,
      `You know ${motifLabel}. Begin this threshold with that knowing.`,
    ],
  };

  const phaseTemplates = templates[phase] || templates['liminal'];
  // Select based on coherence — lower coherence gets the gentler template
  const index = coherence < 0.5 ? 0 : 1;
  return phaseTemplates[Math.min(index, phaseTemplates.length - 1)];
}

/**
 * Generates a context-aware action when EverMemOS returned results
 * but no exact recurring motif match was found in the current event.
 */
function generateContextAwareAction(
  phase: SemanticParameters['phase'],
  coherence: number,
  arousal: SemanticParameters['arousal']
): string {
  if (coherence < 0.4 && arousal === 'shutdown') {
    return 'Your body remembers past thresholds. Rest for 10 minutes without your phone.';
  }
  switch (phase) {
    case 'dissolution':  return 'You have crossed thresholds before. Name one thing you are letting go of now.';
    case 'liminal':      return 'Past moments echo here. Sit with the uncertainty — don\'t fix it yet.';
    case 'integration':  return 'Your pattern history is becoming visible. Write one sentence about what connects them.';
    case 'emergence':    return 'Something new is forming from familiar material. Take one small step toward it.';
    case 'initiation':   return 'This beginning carries echoes of past ones. State your intention aloud.';
    default:             return 'Pause and feel the continuity beneath the change. Breathe for three full cycles.';
  }
}

/**
 * Base rule-based micro-action (no EverMemOS context available).
 */
function generateBaseAction(
  phase: SemanticParameters['phase'],
  coherence: number,
  arousal: SemanticParameters['arousal'],
  agency: SemanticParameters['agency']
): string {
  if (coherence < 0.4 && arousal === 'shutdown') {
    return 'Rest for 10 minutes without your phone.';
  }
  if (arousal === 'activated' && agency === 'low') {
    return 'Place both feet on the ground. Feel your weight.';
  }

  switch (phase) {
    case 'dissolution':  return 'Name one thing you\'re letting go of.';
    case 'liminal':      return 'Sit with the uncertainty. Don\'t fix it yet.';
    case 'integration':  return 'Write one sentence about what you learned.';
    case 'emergence':    return 'Take one small step toward the new.';
    case 'initiation':   return 'State your intention aloud.';
    default:             return 'Pause and breathe for three full cycles.';
  }
}

// ============================================================================
// Paradox Instruction Generation
// ============================================================================

/**
 * Generates non-dual teaching prompt based on polarities.
 */
export function generateParadoxInstruction(
  polarities: SemanticParameters['polarities']
): string | undefined {
  if (polarities.length === 0) return undefined;

  // Take the polarity with highest tension
  const primaryPolarity = polarities.reduce((max, p) =>
    p.tension > max.tension ? p : max
  );

  const templates = [
    `Can you hold both ${primaryPolarity.pole_a} and ${primaryPolarity.pole_b} at once?`,
    `${primaryPolarity.pole_a} is ${primaryPolarity.pole_b}. How is this true?`,
    `The tension between ${primaryPolarity.pole_a} and ${primaryPolarity.pole_b} is the path.`,
    `You don't have to choose. Both ${primaryPolarity.pole_a} and ${primaryPolarity.pole_b} are yours.`,
  ];

  // Choose based on tension level
  const index = Math.floor(primaryPolarity.tension * templates.length);
  return templates[Math.min(index, templates.length - 1)];
}
