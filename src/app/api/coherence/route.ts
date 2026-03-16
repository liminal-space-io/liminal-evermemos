/**
 * POST /api/coherence - REFACTORED VERSION
 *
 * Thin orchestrator that delegates to CoherenceService.
 * Reduced from 1,119 lines to ~150 lines.
 *
 * To enable: Rename this file to route.ts after testing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { withIdempotency } from "@/lib/api/idempotency";
import { withErrorHandling, ValidationError } from "@/lib/api/route-helpers";
import { getCoherenceHistoryDays } from "@/lib/subscription/access";
import type { SubscriptionTier } from "@/lib/stripe";
import { requireAuth } from "@/lib/api/auth-guard";
import { getToday } from "@/lib/engagement/streak-calculator";
import { bridgeToSevenFactors } from "@/styles/design-system/v3/factor-bridge";
import {
  createCoherenceSchema,
  getCoherenceSchema,
  validateRequest,
  validateSearchParams,
} from "@/lib/api/validation";
import { getCacheHeaders, CACHE_PRESETS } from "@/lib/api/route-helpers";

// NEW: Import refactored architecture
import { CoherenceService } from "@/services/coherence";
import { CoherenceRepository } from "@/repositories/CoherenceRepository";
import {
  EventBus,
  AnalyticsHandler,
  EngagementHandler,
  XPHandler,
  DriftRecoveryHandler,
  PhaseUpdateHandler,
  ArchetypeResonanceHandler,
  ProactiveSurfaceHandler,
  ChallengeHandler,
  JourneyEvalHandler,
  VisualizationHandler,
  ValidationTrackingHandler,
  LoopTrackingHandler,
  ArchetypeRoutingHandler,
  RitualCoherenceLinkHandler,
  IdentitySignalHandler,
  EverMemOSHandler,
} from "@/services/events";

// Ensure fresh data on every request
export const dynamic = "force-dynamic";

/**
 * Initialize service layer (singleton pattern)
 */
let coherenceService: CoherenceService | null = null;

function getCoherenceService(): CoherenceService {
  if (!coherenceService) {
    const supabase = getServiceSupabase();
    const repository = new CoherenceRepository(supabase);
    const eventBus = new EventBus(logger);

    // Register ALL handlers (matches production route's 12 parallel operations)
    const resolveEntrypoint = () => "direct";
    eventBus.subscribe(
      "check_completed",
      new AnalyticsHandler(logger, resolveEntrypoint),
    );
    eventBus.subscribe("check_completed", new DriftRecoveryHandler(logger));
    eventBus.subscribe("check_completed", new PhaseUpdateHandler(logger));
    eventBus.subscribe(
      "check_completed",
      new ArchetypeResonanceHandler(logger),
    );
    eventBus.subscribe("check_completed", new ProactiveSurfaceHandler(logger));
    eventBus.subscribe("check_completed", new ChallengeHandler(logger));
    eventBus.subscribe("check_completed", new JourneyEvalHandler(logger));
    eventBus.subscribe("check_completed", new VisualizationHandler(logger));
    eventBus.subscribe(
      "check_completed",
      new ValidationTrackingHandler(logger),
    );
    eventBus.subscribe("check_completed", new XPHandler(logger));
    eventBus.subscribe("check_completed", new LoopTrackingHandler(logger));
    eventBus.subscribe(
      "check_completed",
      new RitualCoherenceLinkHandler(logger),
    );
    eventBus.subscribe("check_completed", new ArchetypeRoutingHandler(logger));
    eventBus.subscribe("check_completed", new EngagementHandler(logger));
    eventBus.subscribe("check_completed", new IdentitySignalHandler(logger));

    // Memory Genesis: EverMemOS episodic trace (Channel 1 — coherence → memory)
    if (process.env.EVERMEMOS_ENABLED === 'true') {
      eventBus.subscribe("check_completed", new EverMemOSHandler(logger));
    }

    coherenceService = new CoherenceService(repository, eventBus, logger);
  }

  return coherenceService;
}

/**
 * POST /api/coherence
 * Submit a coherence check
 */
const coherenceHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateRequest(createCoherenceSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { userId, factors, context, variationType } = validation.data;

    // Detect demo mode
    const isDemoMode = userId.startsWith("demo-");

    // Auth check (skip for demo users)
    if (!isDemoMode) {
      const authResult = await requireAuth(userId);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    }

    // Bridge 4-factor to 7-factor if needed
    const sevenFactors =
      "vitality" in factors ? factors : bridgeToSevenFactors(factors);

    // Delegate to service layer
    const service = getCoherenceService();
    const result = await service.submitCheck({
      userId,
      factors: sevenFactors,
      context: context || "",
      variationType,
      isDemoMode,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error(
      { err: error, module: "coherence" },
      "Error calculating coherence",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const POST = withIdempotency(coherenceHandler, {
  ttlMs: 60000,
  keyExtractor: async (req) => {
    try {
      const body = await req.clone().json();
      const userId = body.userId;
      if (!userId) return null;

      const tzOffset =
        typeof body.tzOffset === "number" ? body.tzOffset : undefined;
      const date = getToday(tzOffset);
      return `${userId}:coherence:${date}`;
    } catch {
      return null;
    }
  },
});

/**
 * GET /api/coherence
 * Retrieve coherence history
 */
async function handleGet(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Validate query params
  const validation = validateSearchParams(getCoherenceSchema, searchParams);
  if (!validation.success) {
    throw new ValidationError(validation.error);
  }

  const { userId, timeWindow, startDate, endDate } = validation.data;

  // Auth check
  const authResult = await requireAuth(userId);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check subscription tier for history access
  const supabase = getServiceSupabase();
  const { data: subscription } = await (supabase as any)
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .single();

  const tier = (subscription?.tier || "free") as SubscriptionTier;
  const isActiveSubscription = ["active", "trialing"].includes(
    subscription?.status || "",
  );
  const effectiveTier = isActiveSubscription ? tier : "free";
  const allowedDays = getCoherenceHistoryDays(effectiveTier);

  // Clamp timeWindow to allowed days
  const effectiveTimeWindow = Math.min(timeWindow || 30, allowedDays);

  // Log if requested more than allowed
  if (timeWindow && timeWindow > allowedDays) {
    logger.info(
      { userId, tier: effectiveTier, requestedDays: timeWindow, allowedDays },
      "User requested more history than tier allows",
    );
  }

  // Delegate to service layer
  const service = getCoherenceService();
  const history = await service.getHistory(userId, {
    timeWindow: effectiveTimeWindow,
    startDate,
    endDate,
  });

  return NextResponse.json(history, {
    headers: getCacheHeaders(CACHE_PRESETS.short),
  });
}

export const GET = withErrorHandling(handleGet, "coherence");
