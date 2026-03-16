/**
 * POST /api/myths/extract
 *
 * Extracts symbolic content from raw threshold moment captures using Claude Haiku.
 *
 * Flow:
 * 1. Receive raw_content (transcribed voice or text)
 * 2. Send to Claude Haiku with motif extraction prompt
 * 3. Parse archetypal patterns, polarities, shadow elements, phase
 * 4. Return structured ExtractedSymbolicContent
 *
 * This is the intelligence layer that transforms raw experience → symbolic compression.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { chatComplete, CHAT_MODEL_FAST } from "@/lib/anthropic/client";
import { resolveActor } from "@/lib/api/auth-guard";
import {
  getUserSemioticMappings,
  initializeSemioticMappings,
} from "@/lib/semiotic/calibration";
import { compileExperienceToArtifact } from "@/lib/semiotic/compiler";
import type { ExtractedSymbolicContent, MythEvent } from "@/lib/semiotic/types";

const MOTIF_EXTRACTION_PROMPT = `You are analyzing a threshold moment in someone's identity transition.

Your task: Extract archetypal patterns, polarities, shadow elements, and transition phase.

ARCHETYPAL MOTIFS (choose 1-5 most relevant):
- death_rebirth: Ending of old identity, emergence of new
- shadow_integration: Confronting previously avoided aspects
- threshold_crossing: Standing at edge of known/unknown
- body_wisdom: Physical symptoms as messengers
- forced_reckoning: External crisis forcing internal change
- identity_dissolution: Loss of stable self-concept
- creative_breakthrough: Sudden clarity or insight
- loss: Grief, separation, ending
- emergence: New form crystallizing
- both_and: Holding paradox without collapsing
- self_awareness: Seeing patterns for first time
- initiation: Ritual beginning of transformation
- undefined_transition: Unclear what is changing

POLARITIES (both-and tensions):
Identify 1-3 pairs of opposites the person is holding:
- Format: { pole_a: "word", pole_b: "word", tension: 0.0-1.0 }
- tension: 0 = integrated/flowing, 1 = stuck/binary
- Examples: control/surrender, love/loss, mother/individual

SHADOW ELEMENTS:
- contacted: What aspects are they newly aware of/touching?
- avoided: What are they still pushing away or denying?
- integrated: What previously shadow aspects are now owned?

TRANSITION PHASE:
- initiation: Something is beginning, calling them
- dissolution: Old structures breaking down
- liminal: In between, neither old nor new
- integration: Bringing pieces together
- emergence: New form crystallizing, clarity arriving

PARADOX INSTRUCTION:
A single sentence that holds the both-and nature of their moment.
Non-dual, poetic, not advice. Examples:
- "You are both nothing and everything. The title was a container, not the essence."
- "Losing her revealed the part of you that was already lost. The silence is teaching."
- "The body's breakdown is its attempt to break you open. Illness as invitation."

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON
2. Be precise: if content is vague, use fewer motifs
3. Phase must be one of: initiation, dissolution, liminal, integration, emergence
4. If unclear, default to "liminal"
5. Shadow elements can be empty arrays if not present
6. Paradox instruction is optional but preferred

Now analyze this threshold moment:

{raw_content}

Return JSON in this exact structure:
{
  "motifs": ["motif1", "motif2"],
  "polarities": [
    { "pole_a": "word1", "pole_b": "word2", "tension": 0.7 }
  ],
  "shadowElements": {
    "contacted": ["thing1"],
    "avoided": ["thing2"],
    "integrated": []
  },
  "phase": "dissolution",
  "paradox_instruction": "Your sentence here."
}`;

// Motif → dominant coherence factor mapping (for lite extract mode)
const MOTIF_TO_FACTOR: Record<string, string> = {
  death_rebirth: "wholeness",
  shadow_integration: "clarity",
  threshold_crossing: "agency",
  body_wisdom: "vitality",
  forced_reckoning: "stability",
  identity_dissolution: "wholeness",
  creative_breakthrough: "expression",
  loss: "connection",
  both_and: "clarity",
  self_awareness: "clarity",
  initiation: "agency",
  emergence: "vitality",
  dissolution: "stability",
  undefined_transition: "wholeness",
};

export async function POST(request: Request) {
  const log = logger.child({ api: "myths/extract" });
  const url = new URL(request.url);
  const isLite = url.searchParams.get("lite") === "true";

  try {
    // 1. Resolve actor — guests use default mappings, users get personalized mappings
    const actor = await resolveActor(request);
    const userId = actor.type === "user" ? actor.id : null;

    // 2. Parse request — request.json() throws on malformed JSON → 400 not 500
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }
    const { raw_content } = body;

    // 3. Validate
    if (
      !raw_content ||
      typeof raw_content !== "string" ||
      raw_content.trim().length === 0
    ) {
      log.warn({ hasContent: !!raw_content }, "Invalid raw_content");
      return NextResponse.json(
        { error: "raw_content is required and must be non-empty" },
        { status: 400 },
      );
    }

    log.info(
      { contentLength: raw_content.length, anonymous: !userId },
      "Extracting motifs from threshold capture",
    );

    // 4a. Memory Genesis: Query EverMemOS for past motif context
    let pastMotifContext = '';
    if (process.env.EVERMEMOS_ENABLED === 'true' && userId) {
      const { searchMemories, withEverMemOSFallback } = await import('@/lib/evermemos');
      const pastMotifs = await withEverMemOSFallback(
        () => searchMemories(
          'What motifs have appeared in past threshold moments?',
          userId,
          'hybrid',
          5,
          'myth-event'
        ),
        [],
        'extract-motif-history'
      );
      if (pastMotifs.length > 0) {
        pastMotifContext = pastMotifs.map(r => r.content).join(' ').slice(0, 400);
      }
    }

    // 4b. Call Claude with 20s timeout — prevents indefinite hangs on cold starts or rate limits
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const extractionPrompt = pastMotifContext
      ? `${MOTIF_EXTRACTION_PROMPT}\n\nPrevious motifs from this user's journey: ${pastMotifContext}\nNote which motifs are RECURRING from past moments.`
      : MOTIF_EXTRACTION_PROMPT;

    let responseContent: string;
    try {
      responseContent = await chatComplete(
        CHAT_MODEL_FAST,
        [
          {
            role: "system",
            content: extractionPrompt.replace(
              "{raw_content}",
              raw_content,
            ),
          },
        ],
        { temperature: 0.7, max_tokens: 500, signal: controller.signal },
      );
    } catch (err) {
      clearTimeout(timeout);
      if (controller.signal.aborted) {
        log.error({}, "Claude extraction timed out after 20s");
        return NextResponse.json(
          { error: "Extraction timed out — please try again" },
          { status: 504 },
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    // 5. Parse Claude response
    if (!responseContent) {
      log.error({}, "No content in Claude response");
      return NextResponse.json(
        { error: "Claude returned empty response" },
        { status: 500 },
      );
    }

    let extractedContent: ExtractedSymbolicContent;

    try {
      extractedContent = JSON.parse(responseContent);
    } catch (parseError) {
      log.error({ parseError, responseContent }, "Failed to parse Claude JSON");
      return NextResponse.json(
        { error: "Invalid JSON from Claude" },
        { status: 500 },
      );
    }

    // 6. Validate structure
    if (
      !extractedContent.motifs ||
      !Array.isArray(extractedContent.motifs) ||
      !extractedContent.phase ||
      !extractedContent.polarities ||
      !extractedContent.shadowElements
    ) {
      log.error(
        { extractedContent },
        "Claude response missing required fields",
      );
      return NextResponse.json(
        { error: "Claude response missing required fields" },
        { status: 500 },
      );
    }

    // 7. Log extraction quality
    log.info(
      {
        motifCount: extractedContent.motifs.length,
        polarityCount: extractedContent.polarities.length,
        phase: extractedContent.phase,
        hasParadox: !!extractedContent.paradoxInstruction,
      },
      "Motif extraction complete",
    );

    // --- LITE MODE: skip compilation, return minimal response for AuraOrb morning boost ---
    if (isLite) {
      const dominantMotif = extractedContent.motifs[0] ?? "";
      const dominantFactor = MOTIF_TO_FACTOR[dominantMotif] ?? null;
      log.info(
        { dominantMotif, dominantFactor, userId },
        "Lite extract complete",
      );
      return NextResponse.json(
        { phase: extractedContent.phase, dominantFactor },
        { status: 200 },
      );
    }

    // 8. Fetch user semiotic mappings (for calibrated artifact generation)
    // Auto-initialize on first artifact — ensures calibration feedback has a row to accumulate on.
    let userMappings: import("@/lib/semiotic/types").SemioticMapping[] = [];
    if (userId) {
      try {
        await initializeSemioticMappings(userId);
        userMappings = await getUserSemioticMappings(userId);
      } catch (mappingError) {
        log.warn(
          { err: mappingError, userId },
          "Failed to fetch semiotic mappings — using defaults",
        );
      }
    }

    // 9. Compile artifact server-side using user mappings (or defaults if uncalibrated)
    const partialMythEvent: MythEvent = {
      id: "preview",
      userId: userId ?? "anonymous",
      timestamp: new Date(),
      eventType: "threshold",
      phase: extractedContent.phase,
      captureMedium: "text",
      motifs: extractedContent.motifs,
      polarities: extractedContent.polarities,
      shadowElements: extractedContent.shadowElements as Record<
        string,
        unknown
      >,
      paradoxInstruction: extractedContent.paradoxInstruction,
      actionCompleted: false,
      revisitedCount: 0,
      contributeToCollective: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let generatedArtifact: Awaited<ReturnType<typeof compileExperienceToArtifact>> | null = null;
    try {
      generatedArtifact = await compileExperienceToArtifact(
        partialMythEvent,
        userMappings,
      );
    } catch (compileError) {
      log.warn(
        { err: compileError },
        "Artifact compilation failed — returning extraction only",
      );
    }

    log.info(
      { hasArtifact: !!generatedArtifact, userId },
      "Extract + compile complete",
    );

    // 10. Return combined response: extracted content + generated artifact
    // calibrationApplied = user has given at least one piece of feedback (not just initialized defaults)
    const calibrationApplied = userMappings.some((m) => m.calibrationCount > 0);

    return NextResponse.json(
      {
        extractedContent,
        generatedArtifact,
        calibrationApplied,
        artifactGenerated: generatedArtifact !== null,
      },
      { status: 200 },
    );
  } catch (error) {
    const isQuotaError =
      error instanceof Error &&
      (error.message.includes("429") ||
        error.message.includes("quota") ||
        error.message.includes("RateLimitError"));
    if (isQuotaError) {
      log.warn({ err: error }, "Claude API rate limited");
      return NextResponse.json(
        { error: "service_unavailable" },
        { status: 503 },
      );
    }
    log.error({ err: error }, "Motif extraction failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
