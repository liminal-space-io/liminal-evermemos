/**
 * Semiotic Intelligence Types
 *
 * This module defines the type system for user-calibrated symbolic languages.
 * Core concept: semantic parameters (phase, coherence, etc.) map to visual
 * primitives (color, shape, motion) in ways that are learned per user.
 */

// ============================================================================
// Core Semantic Parameters
// ============================================================================

export type Phase =
  | "initiation"
  | "dissolution"
  | "liminal"
  | "integration"
  | "emergence";

/**
 * Explicit alias for the Track B semiotic phase vocabulary.
 * Use this type in any code that could receive either Track A (TransitionPhase enum)
 * or Track B phase data — the distinct name makes the namespace collision visible at compile time.
 * Track A: ending | liminal | emerging | momentum | integration (TransitionPhase enum in @/types)
 * Track B: initiation | dissolution | liminal | integration | emergence (this type)
 * Collision values: 'liminal' and 'integration' exist in both with different semantic meaning.
 */
export type SemioticPhase = Phase;

export type EventType =
  | "threshold"
  | "integration"
  | "shadow_contact"
  | "paradox_moment"
  | "dissolution"
  | "emergence";

export type CaptureMedium = "voice" | "text" | "ritual_output";

export type ArtifactType = "imprint" | "sigil" | "three_frame_reel";
/** @deprecated use 'imprint' — kept for backward compat with old DB rows */
export type LegacyArtifactType = "cosmogram" | ArtifactType;

/**
 * RenderStyle — visual format for an Imprint artifact.
 *
 * Same ImprintData in, different visual encoding out.
 * Think of it like a font: same content, different visual language.
 *
 *   field        — impressionist vector field with polarity fault line (default/existing)
 *   typographic  — SVG text layout; polarity words as the image
 *   botanical    — recursive organic form growing from the data
 *   generated    — LLM-generated SVG illustration (GPT-4o); highest fidelity, async
 */
export type RenderStyle = "field" | "typographic" | "botanical" | "generated";

// Semantic parameters that drive visual generation
export interface SemanticParameters {
  // Primary
  phase: Phase;
  coherence: number; // 0-1 (average of 7 factors)
  coherenceSnapshot?: Record<string, number>; // Per-factor 0-1 values

  // Secondary
  shadow_contact: "avoided" | "contacted" | "integrated";
  arousal: "shutdown" | "calm" | "activated"; // Maps to 1-10 scale
  agency: "low" | "medium" | "high"; // Maps to 1-10 scale
  polarity: "stuck" | "flexible"; // Derived from polarity balance

  // Extracted from content
  motifs: string[]; // e.g., ['death_rebirth', 'shadow_integration']
  polarities: Polarity[];
}

export interface Polarity {
  pole_a: string; // e.g., "control"
  pole_b: string; // e.g., "surrender"
  tension: number; // 0-1, how stuck vs integrated
}

// ============================================================================
// Visual Primitives
// ============================================================================

export type PrimitiveType = "color" | "shape" | "motion" | "texture";

export interface ColorPrimitive {
  type: "color";
  hue: number; // 0-360
  saturation: number; // 0-1
  lightness: number; // 0-1
  harmony?: boolean; // Whether colors harmonize
  contrast?: number; // 0-1
}

export interface ShapePrimitive {
  type: "shape";
  form: "circle" | "line" | "spiral" | "grid" | "void";
  directionality: "diffuse" | "centered" | "rising";
  symmetry: "asymmetric" | "mirrored";
  vector: boolean; // Has directional flow
  interpenetrating?: boolean; // For polarity integration
  split?: boolean; // For polarity stuck
}

export interface MotionPrimitive {
  type: "motion";
  tempo: "slow" | "breathing" | "pulse";
  amplitude: number; // 0-1
  jitter?: number; // Noise/instability
  synchronized?: boolean; // For coherence
}

export interface TexturePrimitive {
  type: "texture";
  effect: "noise" | "blur" | "grain" | "sharp";
  intensity: number; // 0-1
}

export type VisualPrimitive =
  | ColorPrimitive
  | ShapePrimitive
  | MotionPrimitive
  | TexturePrimitive;

// ============================================================================
// Semiotic Mappings (User-Calibrated)
// ============================================================================

export interface SemioticMapping {
  id: string;
  userId: string;
  parameterName: string;
  primitiveType: PrimitiveType;
  mappingRules: Record<string, unknown>; // Parameter value → visual output
  calibrationScore: number; // 0-1
  calibrationCount: number;
  calibrationHistory: CalibrationEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CalibrationEntry {
  artifactId: string;
  feltAccurate: boolean;
  interpretation?: string; // "this color felt like safety to me"
  adjustedValue?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// Myth Events (Threshold Moments)
// ============================================================================

export interface MythEvent {
  id: string;
  userId: string;
  timestamp: Date;

  // Classification
  eventType: EventType;
  phase: Phase;

  // Raw capture
  captureMedium: CaptureMedium;
  rawContent?: string;
  audioUrl?: string;
  captureDurationSeconds?: number;

  // Symbolic compression
  motifs: string[];
  polarities: Polarity[];
  shadowElements: Record<string, unknown>;

  // State snapshot
  coherenceSnapshot?: Record<string, number>; // 7 factors
  arousalLevel?: number; // 1-10
  agencySense?: number; // 1-10

  // Generated artifacts
  artifactType?: ArtifactType;
  sigilUrl?: string;
  imprintData?: ImprintData;
  /** @deprecated use imprintData — kept for DB column name compat */
  cosmogramData?: ImprintData;
  threeFrameReelUrl?: string;
  paradoxInstruction?: string;

  // Closure loop
  microAction?: string;
  actionCompleted: boolean;
  actionCompletedAt?: Date;
  sealUrl?: string;

  // Revisit tracking
  revisitedCount: number;
  lastRevisitedAt?: Date;

  // Collective
  contributeToCollective: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Hybrid Renderer — Composition & Motion Types
// ============================================================================

/**
 * MotifComposition — recipe that determines the fundamental visual structure
 * of an Imprint canvas based on the primary motif.
 *
 * Each motif produces a different KIND of image, not just a different color.
 * These recipes are consumed by imprint-physics.ts and translated into
 * impressionist.ts stroke field parameters.
 */
export interface MotifComposition {
  /** Where does visual weight concentrate? Maps to stroke field layout. */
  gravity: "center" | "bottom" | "rising" | "split" | "diffuse";

  /** What kind of shapes dominate? Maps to noise amplitude + stroke regularity. */
  form: "organic" | "angular" | "spiral" | "void" | "radiant";

  /** How does the composition move? Maps to drift direction parameters. */
  motion: "pooling" | "expanding" | "oscillating" | "still" | "erupting";

  /** How much of the canvas is filled? Maps to stroke count multiplier. */
  density: "sparse" | "moderate" | "dense" | "overwhelming";

  /** How much range between lightest and darkest? Maps to light spread. */
  contrast: "low" | "medium" | "high" | "extreme";
}

/**
 * DualMotion — replaces the single breathing animation with two overlaid
 * motion systems: continuous drift (ink in water) + intermittent flicker
 * (film projector).
 *
 * Derived from arousal, shadow contact, phase, and coherence in imprint-physics.ts.
 */
export interface DualMotion {
  /** Continuous slow movement speed (0.02–0.15 Hz). Arousal-driven. */
  driftSpeed: number;
  /** Displacement in px per drift cycle. Shadow-driven: deeper = heavier drift. */
  driftAmplitude: number;
  /** Intermittent frame-skip frequency (0.3–2.0 Hz). Arousal-driven. */
  flickerRate: number;
  /** How much the frame "jumps" per flicker (0–1). Phase-driven. */
  flickerIntensity: number;
  /** Opacity dip per flicker frame (0.85–1.0). Coherence-driven. */
  flickerAlpha: number;
}

/**
 * Resolved numeric parameters for the painting engine.
 * Cross-couples density × contrast × form × gravity × motion.
 */
export interface ResolvedCompositionParams {
  /** Scales the base stroke count (1.0 = ~200 strokes at 200px canvas). */
  strokeCountMultiplier: number;
  /** How much lightest/darkest strokes differ (0–1). Higher = more dramatic. */
  lightSpread: number;
  /** Noise amplitude multiplier. Organic forms get high noise, angular get low. */
  noiseAmplitude: number;
  /** Stroke regularity (0 = chaotic angles, 1 = uniform direction). */
  strokeRegularity: number;
  /** Elongation bias: how stretched each dab is (1 = round, 3 = very elongated). */
  elongationBias: number;
}

/**
 * CoupledWorld — the unified visual state produced by coupling
 * phase × motif × shadow × arousal × coherence together.
 *
 * Instead of independent visual channels, these fields describe
 * a coherent "visual world" that all rendering parameters derive from.
 *
 * Evolution path: the `resolved` field currently uses hand-tuned base values.
 * Phase 2+ will feed per-user calibration data (from semiotic_mappings) into
 * `resolveCompositionParams(composition, calibrationAdjustment)` so Imprints
 * evolve with user feedback — the same motif renders differently for a user
 * who consistently says "too sparse" vs one who says "too busy."
 */
export interface CoupledWorld {
  /** The composition recipe from the primary motif. */
  composition: MotifComposition;
  /** Cross-coupled numeric params ready for the painting engine. */
  resolved: ResolvedCompositionParams;
  /** Dual motion parameters derived from arousal + phase + shadow. */
  dualMotion: DualMotion;
  /** Phase-keyed grain count (200–1400). Higher = more degradation. */
  phaseGrainLevel: number;
  /** Phase-keyed blur radius in px (0–6). */
  phaseBlurLevel: number;
  /** Shadow contact depth (0–1). 0=avoided, 0.5=contacted, 1=integrated. */
  shadowDepth: number;
}

// ============================================================================
// Artifact Data Structures
// ============================================================================

/** ImprintData — the data structure behind every generated Imprint artifact */
export interface ImprintData {
  // Center: Phase symbol
  centerPhase: Phase;
  centerColor: ColorPrimitive;

  // Rings: 7-factor coherence (color-coded by user calibration)
  rings: ImprintRing[];

  // Symbols: Motifs (max 3)
  motifSymbols: MotifSymbol[];

  // Animation: Breathing tied to arousal
  breathingAnimation: MotionPrimitive;

  // Overall palette (derived from user calibration)
  palette: ColorPrimitive[];

  /**
   * Polarity tensions extracted from the threshold moment.
   * Drives compositional split vs unified rendering — higher tension
   * produces two opposing glows pulling against each other.
   *
   * Also the semantic substrate for dyad / relational use cases:
   * two Imprints sharing the same polarity pair but different tension
   * values become visually comparable artifacts.
   *
   * Optional for backward compat with existing DB rows; renderer
   * falls back to breathingAnimation.amplitude when absent.
   */
  polarities?: Polarity[];

  // Narrative scene — enrichment from user identity state (self-model).
  // Optional: null for legacy Imprints or when identity state unavailable.
  narrativeScene?: NarrativeScene;
}

/**
 * NarrativeScene — self-model context that makes Imprints narrative-aware.
 *
 * Computed from UserIdentityState and injected at artifact compile time.
 * The renderer uses these fields to move from "mood circle" to "state portrait":
 *
 *   trajectory     → directional ambient flow (ascending light rises, descending pools)
 *   archetypes     → secondary color signatures / subtle presences in the field
 *   shadowPattern  → depth/contrast override (integrating = softer, avoiding = harsher edge)
 *   calibration    → visual confidence (high = crisp, low = more grain/diffusion)
 *   engagement     → visual complexity gating (new users get simpler renders)
 *   factor profile → emphasis (strong factors glow brighter, weak factors show grain)
 */
export interface NarrativeScene {
  // Trajectory: directional flow of the canvas
  trajectory: "ascending" | "stable" | "descending" | "volatile" | null;
  trajectorySlope: number | null;

  // Archetype presences: top 3 archetypes with evolution direction
  archetypePresences: ArchetypePresence[];

  // Shadow engagement pattern from self-model
  shadowPattern: "avoiding" | "contacting" | "integrating" | null;

  // Calibration quality — affects visual confidence/sharpness
  calibrationClarity: number | null; // 0-1, null = uncalibrated

  // Engagement depth — gates how much visual layering to apply
  engagementTier: "new" | "activating" | "practicing" | "integrated";

  // Factor strengths/weaknesses for visual emphasis
  strongFactors: string[];
  weakFactors: string[];

  // Narrative arc state — determines Stage 3 visual overlays
  // 'first' = void emergence pulse (brand new, first imprint ever)
  // 'open'  = no special overlay (active/in-progress)
  // 'sealed' = rotating golden dashed ring (Vow completed)
  // 'revisited' = warm amber memory tint
  narrativeArc?: "first" | "open" | "sealed" | "revisited";

  // User-calibrated figure hue from semiotic_mappings (0-360)
  // When set, overrides FACTOR_HUES.expression for the Path2D figure stroke
  figureHue?: number;
}

export interface ArchetypePresence {
  archetype: string;
  evolution: "rising" | "falling" | "stable";
}

/** @deprecated use ImprintData */
export type CosmogramData = ImprintData;

export interface ImprintRing {
  factor: string; // e.g., "stability", "vitality"
  value: number; // 0-1 coherence score
  color: ColorPrimitive; // User-calibrated
  thickness: number; // Visual weight
}

/** @deprecated use ImprintRing */
export type CosmogramRing = ImprintRing;

export interface MotifSymbol {
  motif: string; // e.g., "death_rebirth"
  position: { angle: number; radius: number }; // Polar coords
  glyph: string; // SVG path or unicode symbol
  color: ColorPrimitive;
}

export interface SigilData {
  geometry: string; // SVG path data
  color: ColorPrimitive;
  timestamp: Date;
  phase: Phase;
}

export interface ThreeFrameReelData {
  frame1Url: string; // "Before" state
  frame2Url: string; // "Threshold" moment
  frame3Url: string; // "Integration" direction
  blurLevel: number; // 2-6px (dreamlike quality)
}

// ============================================================================
// Generated Artifacts (Full Output)
// ============================================================================

export interface GeneratedArtifact {
  mythEventId: string;
  type: ArtifactType;
  data: ImprintData | SigilData | ThreeFrameReelData;
  microAction: string;
  paradoxInstruction?: string;
  imageUrl?: string; // Rendered artifact
  createdAt: Date;
  metadata?: Record<string, unknown>; // EverMemOS enrichment (motif recurrence, etc.)
}

// ============================================================================
// Calibration API
// ============================================================================

export interface CalibrationFeedback {
  mythEventId: string;
  parameterName: string;
  primitiveType: PrimitiveType;
  feltAccurate: boolean;
  interpretation?: string;
  adjustedValue?: Record<string, unknown>;
}

// ============================================================================
// Motif Extraction (GPT-4o-mini Output)
// ============================================================================

export interface ExtractedSymbolicContent {
  motifs: string[];
  polarities: Polarity[];
  shadowElements: {
    contacted: string[];
    avoided: string[];
    integrated: string[];
  };
  phase: Phase;
  paradoxInstruction?: string; // Non-dual teaching prompt
}

// ============================================================================
// Cabinet Organization
// ============================================================================

export interface CabinetGroup {
  phase: Phase;
  eventTypes: {
    type: EventType;
    events: MythEvent[];
  }[];
}

export interface CabinetFilter {
  phases?: Phase[];
  eventTypes?: EventType[];
  unsealed?: boolean; // Show only unsealed (action not completed)
  dateRange?: { start: Date; end: Date };
}

// ============================================================================
// Ritual Mode Context
// ============================================================================

export interface RitualModeConfig {
  accentColor: ColorPrimitive;
  breathingAnimation: MotionPrimitive;
  holdDuration: number; // ms for hold-to-begin
  maxCaptureDuration: number; // seconds (30-60)
  voiceFirst: boolean;
}

// ============================================================================
// Hybrid Renderer — Composition & Motion Types
// ============================================================================

/**
 * MotifComposition — recipe that determines the fundamental visual structure
 * of an Imprint canvas based on the primary motif.
 *
 * Each motif produces a different KIND of image, not just a different color.
 * These recipes are consumed by imprint-physics.ts and translated into
 * impressionist.ts stroke field parameters.
 */
export interface MotifComposition {
  /** Where does visual weight concentrate? Maps to stroke field layout. */
  gravity: "center" | "bottom" | "rising" | "split" | "diffuse";

  /** What kind of shapes dominate? Maps to noise amplitude + stroke regularity. */
  form: "organic" | "angular" | "spiral" | "void" | "radiant";

  /** How does the composition move? Maps to drift direction parameters. */
  motion: "pooling" | "expanding" | "oscillating" | "still" | "erupting";

  /** How much of the canvas is filled? Maps to stroke count multiplier. */
  density: "sparse" | "moderate" | "dense" | "overwhelming";

  /** How much range between lightest and darkest? Maps to light spread. */
  contrast: "low" | "medium" | "high" | "extreme";
}

/**
 * DualMotion — replaces the single breathing animation with two overlaid
 * motion systems: continuous drift (ink in water) + intermittent flicker
 * (film projector).
 *
 * Derived from arousal, shadow contact, phase, and coherence in imprint-physics.ts.
 */
export interface DualMotion {
  /** Continuous slow movement speed (0.02–0.15 Hz). Arousal-driven. */
  driftSpeed: number;
  /** Displacement in px per drift cycle. Shadow-driven: deeper = heavier drift. */
  driftAmplitude: number;
  /** Intermittent frame-skip frequency (0.3–2.0 Hz). Arousal-driven. */
  flickerRate: number;
  /** How much the frame "jumps" per flicker (0–1). Phase-driven. */
  flickerIntensity: number;
  /** Opacity dip per flicker frame (0.85–1.0). Coherence-driven. */
  flickerAlpha: number;
}

/**
 * Resolved numeric parameters for the painting engine.
 * Cross-couples density × contrast × form × gravity × motion.
 */
export interface ResolvedCompositionParams {
  /** Scales the base stroke count (1.0 = ~200 strokes at 200px canvas). */
  strokeCountMultiplier: number;
  /** How much lightest/darkest strokes differ (0–1). Higher = more dramatic. */
  lightSpread: number;
  /** Noise amplitude multiplier. Organic forms get high noise, angular get low. */
  noiseAmplitude: number;
  /** Stroke regularity (0 = chaotic angles, 1 = uniform direction). */
  strokeRegularity: number;
  /** Elongation bias: how stretched each dab is (1 = round, 3 = very elongated). */
  elongationBias: number;
}

/**
 * CoupledWorld — the unified visual state produced by coupling
 * phase × motif × shadow × arousal × coherence together.
 *
 * Instead of independent visual channels, these fields describe
 * a coherent "visual world" that all rendering parameters derive from.
 *
 * Evolution path: the `resolved` field currently uses hand-tuned base values.
 * Phase 2+ will feed per-user calibration data (from semiotic_mappings) into
 * `resolveCompositionParams(composition, calibrationAdjustment)` so Imprints
 * evolve with user feedback — the same motif renders differently for a user
 * who consistently says "too sparse" vs one who says "too busy."
 */
export interface CoupledWorld {
  /** The composition recipe from the primary motif. */
  composition: MotifComposition;
  /** Cross-coupled numeric params ready for the painting engine. */
  resolved: ResolvedCompositionParams;
  /** Dual motion parameters derived from arousal + phase + shadow. */
  dualMotion: DualMotion;
  /** Phase-keyed grain count (200–1400). Higher = more degradation. */
  phaseGrainLevel: number;
  /** Phase-keyed blur radius in px (0–6). */
  phaseBlurLevel: number;
  /** Shadow contact depth (0–1). 0=avoided, 0.5=contacted, 1=integrated. */
  shadowDepth: number;
}
