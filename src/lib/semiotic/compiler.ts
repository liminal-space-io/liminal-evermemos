/**
 * Semiotic Compiler
 *
 * Compiles lived experience (myth events) into symbolic artifacts.
 * This is the core "experience → sign → meaning → action" transformation.
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
import { chatComplete, CHAT_MODEL_FAST } from '@/lib/anthropic/client';

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

    // Memory Genesis: Query EverMemOS for motif recurrence (reconstructive recollection)
    let motifRecurrenceContext: string | null = null;
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
          log.debug(
            { mythEventId: mythEvent.id, resultCount: pastMotifs.length },
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
        // INTENTIONAL FALLBACK — sigil generation is Phase 2 (deferred, not broken).
        // Tracked in LIM-824. All sigil requests produce an imprint until Phase 2 ships.
        // Do not remove this case — it must remain distinct from 'default' so the warning fires.
        log.warn({ mythEventId: mythEvent.id }, 'sigil not implemented, falling back to imprint');
        artifactData = generateImprint(params, userMappings);
        break;
      case 'three_frame_reel':
        // INTENTIONAL FALLBACK — three_frame_reel is Phase 2 (deferred, not broken).
        // Tracked in LIM-824. All reel requests produce an imprint until Phase 2 ships.
        // Do not remove this case — it must remain distinct from 'default' so the warning fires.
        log.warn({ mythEventId: mythEvent.id }, 'three_frame_reel not implemented, falling back to imprint');
        artifactData = generateImprint(params, userMappings);
        break;
      default:
        artifactData = generateImprint(params, userMappings);
    }

    // Enrich Imprint with self-model narrative context when available
    // Pass event context so enrichImprintWithIdentity can compute narrativeArc
    // Pass userMappings so figureHue can be resolved from calibrated expression preference
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
      microAction: mythEvent.microAction || await generateMicroAction(params, motifRecurrenceContext),
      paradoxInstruction: mythEvent.paradoxInstruction,
      createdAt: new Date(),
      ...(motifRecurrenceContext ? { metadata: { motifRecurrenceContext } } : {}),
    };

    log.info(
      { mythEventId: mythEvent.id, artifactType },
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
 * Formerly "cosmogram" — renamed to match product vocabulary.
 */
function generateImprint(
  params: SemanticParameters,
  userMappings: SemioticMapping[]
): ImprintData {
  // Center: Phase color
  const centerColor = mapPhaseToColor(params.phase, userMappings);

  // Rings: 7-factor coherence
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
    // Wire polarity tensions so the renderer can trigger the compositional split
    // (maxTension > 0.6 → left/right hue split in renderFigure).
    // Without this, the split only appears in the sandbox via tension slider.
    polarities: params.polarities,
  };
}

/**
 * Generates coherence rings for the Imprint
 */
function generateCoherenceRings(
  params: SemanticParameters,
  userMappings: SemioticMapping[]
): ImprintData['rings'] {
  // 7 factors (from coherence system)
  const factors = [
    'stability',
    'vitality',
    'agency',
    'connection',
    'expression',
    'clarity',
    'wholeness',
  ];

  // Get coherence modifiers
  const coherenceModifiers = mapCoherenceToColor(
    params.coherence,
    userMappings
  );

  // Base color from phase
  const baseColor = mapPhaseToColor(params.phase, userMappings);

  return factors.map((factor) => {
    // Use per-factor coherence from snapshot if available, else average
    const value = params.coherenceSnapshot?.[factor] ?? params.coherence;

    // Use chakra-aligned hue per factor so ring colors match the semantic color language.
    // Falls back to phase base hue if factor is unknown.
    const factorHue = FACTOR_HUES[factor] ?? baseColor.hue;
    const color: ColorPrimitive = {
      type: 'color',
      hue: factorHue,
      saturation:
        coherenceModifiers.saturation ||
        baseColor.saturation ||
        0.6,
      lightness: baseColor.lightness || 0.5,
    };

    // Thickness based on value
    const thickness = 4 + value * 8; // 4-12px range

    return {
      factor,
      value,
      color,
      thickness,
    };
  });
}

/**
 * Generates motif symbols for the Imprint
 */
function generateMotifSymbols(
  motifs: string[],
  baseColor: ColorPrimitive
): ImprintData['motifSymbols'] {
  // Take top 3 motifs
  const topMotifs = motifs.slice(0, 3);

  return topMotifs.map((motif, index) => {
    // Position: evenly distributed around circle
    const angle = (index * 360) / topMotifs.length;
    const radius = 0.7; // 70% from center

    // Color: variation of base
    const color: ColorPrimitive = {
      type: 'color',
      hue: (baseColor.hue + index * 30) % 360,
      saturation: baseColor.saturation || 0.6,
      lightness: baseColor.lightness || 0.5,
    };

    // Glyph: Unicode or SVG (simplified for now)
    const glyph = motifToGlyph(motif);

    return {
      motif,
      position: { angle, radius },
      glyph,
      color,
    };
  });
}

/**
 * Maps motif name to visual glyph
 */
function motifToGlyph(motif: string): string {
  return MOTIF_GLYPHS[motif] || '◆'; // Default diamond
}

/**
 * Generates color palette from semantic parameters
 */
function generatePalette(
  params: SemanticParameters,
  userMappings: SemioticMapping[]
): ColorPrimitive[] {
  const baseColor = mapPhaseToColor(params.phase, userMappings);
  const coherenceModifiers = mapCoherenceToColor(
    params.coherence,
    userMappings
  );

  // Generate complementary and analogous colors
  const palette: ColorPrimitive[] = [
    baseColor,
    {
      ...baseColor,
      hue: (baseColor.hue + 180) % 360, // Complementary
      saturation: coherenceModifiers.saturation || baseColor.saturation || 0.6,
    },
    {
      ...baseColor,
      hue: (baseColor.hue + 30) % 360, // Analogous +30
    },
    {
      ...baseColor,
      hue: (baseColor.hue - 30 + 360) % 360, // Analogous -30
    },
  ];

  return palette;
}

// ============================================================================
// Identity Enrichment — Wire Self-Model to Imprint
// ============================================================================

/**
 * Optional myth event context for narrative arc computation.
 * Passed from compileExperienceToArtifact when available.
 */
interface MythEventContext {
  imprintCount: number      // from UserIdentityState.imprintCount (0 = this is the very first)
  actionCompleted: boolean  // myth_event.action_completed (Vow completed → sealed)
  revisitedCount: number    // myth_event.revisited_count (> 0 → revisited)
}

/**
 * Enriches an ImprintData with narrative scene context from the user's identity state.
 *
 * This is the bridge between the self-model and the renderer. The narrative scene
 * carries trajectory, archetype presences, shadow engagement, calibration quality,
 * factor profile, and narrative arc state — turning a "mood circle" into a "state portrait."
 *
 * Exported so it can also be called independently (e.g. re-enriching an existing
 * Imprint when identity state updates).
 *
 * @param eventContext - Optional myth event fields for narrative arc computation.
 *   When omitted, narrativeArc defaults to 'open'.
 */
export function enrichImprintWithIdentity(
  imprint: ImprintData,
  identityState: UserIdentityState,
  eventContext?: MythEventContext,
  userMappings?: SemioticMapping[]
): ImprintData {
  // Determine narrative arc state from event context
  let narrativeArc: NarrativeScene['narrativeArc'] = 'open'
  if (eventContext) {
    if (eventContext.imprintCount === 0) {
      narrativeArc = 'first'
    } else if (eventContext.actionCompleted) {
      // sealed takes precedence over revisited — closure state survives revisits
      narrativeArc = 'sealed'
    } else if (eventContext.revisitedCount > 0) {
      narrativeArc = 'revisited'
    }
  }

  // Resolve user-calibrated figureHue from semiotic_mappings.
  // Looks for a 'phase/color' mapping with an 'expression' key (identity-facing factor).
  // Falls back to undefined — renderer uses FACTOR_HUES.expression (187°, teal) by default.
  let figureHue: number | undefined
  if (userMappings) {
    const phaseColorMapping = userMappings.find(
      (m) => m.parameterName === 'phase' && m.primitiveType === 'color'
    )
    if (phaseColorMapping && phaseColorMapping.calibrationCount > 0) {
      const expressionRule = phaseColorMapping.mappingRules['expression'] as Record<string, number> | undefined
      if (expressionRule?.hue !== undefined) {
        figureHue = expressionRule.hue
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

  return {
    ...imprint,
    narrativeScene,
  };
}

// ============================================================================
// Micro-Action Generation
// ============================================================================

/**
 * Rule-based fallback for micro-action generation.
 * Used when the LLM call fails or times out.
 */
function generateMicroActionFallback(params: SemanticParameters): string {
  const { phase, coherence, arousal, agency } = params;

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

/**
 * Generates a micro-action personalized to the user's actual motifs, phase,
 * and shadow elements via Claude Haiku. Falls back silently to rule-based
 * strings on timeout (2s) or error — never throws.
 */
async function generateMicroAction(params: SemanticParameters, motifHistory?: string | null): Promise<string> {
  const motifList = params.motifs.slice(0, 3).join(', ') || 'none';
  const shadowList = params.shadow_contact || 'none';

  const prompt = `You are a somatic guide generating a single micro-action for someone at a life threshold.

Phase: ${params.phase}
Motifs: ${motifList}
Shadow elements: ${shadowList}
Coherence (0-1): ${params.coherence.toFixed(2)}
Arousal state: ${params.arousal}
${motifHistory ? `\nHistorical motif patterns from past Imprints: ${motifHistory.slice(0, 300)}\nReference recurring motifs when crafting the action.` : ''}
Write ONE sentence. Imperative voice. Somatic or reflective action. Reference the motifs specifically.
No wellness clichés (no "embrace", "journey", "healing", "unlock"). Max 120 characters. No quotes.`;

  try {
    const result = await Promise.race([
      chatComplete(
        CHAT_MODEL_FAST,
        [
          { role: 'system', content: 'You are a somatic guide. Respond with exactly one imperative sentence, no quotes, max 120 characters.' },
          { role: 'user', content: prompt },
        ],
        { max_tokens: 60, temperature: 0.8 }
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('micro-action timeout')), 2000)
      ),
    ]);

    const cleaned = result.trim().replace(/^["']|["']$/g, '');
    if (cleaned.length > 0 && cleaned.length <= 150) {
      return cleaned;
    }
    log.warn({ result }, 'micro-action LLM response out of bounds, using fallback');
    return generateMicroActionFallback(params);
  } catch (err) {
    log.warn({ err }, 'micro-action LLM call failed, using rule-based fallback');
    return generateMicroActionFallback(params);
  }
}

// ============================================================================
// Paradox Instruction Generation
// ============================================================================

/**
 * Generates non-dual teaching prompt based on polarities
 */
export function generateParadoxInstruction(
  polarities: SemanticParameters['polarities']
): string | undefined {
  if (polarities.length === 0) return undefined;

  // Take the polarity with highest tension
  const primaryPolarity = polarities.reduce((max, p) =>
    p.tension > max.tension ? p : max
  );

  // Generate paradox instruction
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
