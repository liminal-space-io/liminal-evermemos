/**
 * Shadow Dialogue API (LIM-493)
 *
 * POST /api/archetypes/shadow-patterns/[id]/dialogue
 *
 * Streams a 3-turn Socratic dialogue between the user and a
 * therapeutically-matched archetype about their shadow pattern.
 *
 * SSE format: data: {type: 'start'|'content'|'done'|'error', ...}
 *
 * Also handles completion (action: 'complete') for journal/rating + myth_events.
 */

import { NextRequest, NextResponse } from "next/server";
import { chatStream, CHAT_MODEL_FAST } from "@/lib/anthropic/client";
import { requireAuth } from "@/lib/api/auth-guard";
import { createErrorResponse, ERROR_CODES } from "@/lib/api/route-helpers";
import { getUntypedServiceSupabase } from "@/lib/supabase/untyped";
import { logger } from "@/lib/logger";
import {
  buildShadowDialoguePrompt,
  getDialogueArchetype,
  type DialogueMessage,
} from "@/lib/archetypes/shadow-dialogue";

const log = logger.child({ module: "api/shadow-dialogue" });

interface DialogueRequestBody {
  userId: string;
  message?: string;
  sessionId?: string;
  selectedArchetype?: string;
  action?: string;
  journalNote?: string;
  userRating?: string;
}

// ============================================
// Completion handler (journal + rating + myth_events)
// ============================================

async function handleCompletion(body: DialogueRequestBody, userId: string) {
  const supabase = getUntypedServiceSupabase();

  const updateData: Record<string, unknown> = {};
  if (body.journalNote) updateData.journal_note = body.journalNote;
  if (body.userRating) updateData.user_rating = body.userRating;

  if (Object.keys(updateData).length > 0) {
    await supabase
      .from("shadow_dialogue_sessions")
      .update(updateData)
      .eq("id", body.sessionId)
      .eq("user_id", userId);
  }

  // Fetch the completed session for myth_events
  const { data: session } = await supabase
    .from("shadow_dialogue_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (session?.completed_at) {
    // Create myth_event for Interior integration
    const dialogueMessages = (session.messages as DialogueMessage[]) || [];
    const summary = dialogueMessages
      .filter((m: DialogueMessage) => m.role === "assistant")
      .map((m: DialogueMessage) => m.content)
      .join(" ")
      .slice(0, 500);

    const { error: mythError } = await supabase.from("myth_events").insert({
      user_id: userId,
      event_type: "shadow_dialogue",
      phase: "integration",
      capture_medium: "ritual_output",
      raw_content: summary,
      motifs: [],
      polarities: [],
      shadow_elements: {
        pattern_type: session.pattern_type,
        dialogue_archetype: session.dialogue_archetype,
        user_rating: body.userRating,
      },
      micro_action: session.integration_suggestion,
    });

    if (mythError) {
      log.error(
        { err: mythError },
        "Failed to create myth_event for shadow dialogue",
      );
    } else {
      log.info(
        { sessionId: body.sessionId, userId },
        "Shadow dialogue myth_event created",
      );
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================
// Main POST handler
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: patternId } = await params;
  let body: DialogueRequestBody;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse({
      message: "Invalid JSON body",
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  }

  const { userId, message, sessionId, selectedArchetype } = body;

  if (!userId) {
    return createErrorResponse({
      message: "userId is required",
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  }

  // Auth
  const authResult = await requireAuth(userId);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Handle completion action
  if (body.action === "complete" && body.sessionId) {
    return handleCompletion(body, userId);
  }

  const supabase = getUntypedServiceSupabase();

  // Fetch the shadow pattern
  const { data: pattern, error: patternError } = await supabase
    .from("shadow_patterns")
    .select(
      "id, user_id, pattern_name, pattern_description, pattern_type, shadow_archetype, strength",
    )
    .eq("id", patternId)
    .eq("user_id", userId)
    .single();

  if (patternError || !pattern) {
    return createErrorResponse({
      message: "Shadow pattern not found",
      code: ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  }

  // Determine archetype
  const archetype = getDialogueArchetype(
    pattern.pattern_type,
    selectedArchetype,
  );

  // Load or create session
  let currentSession: {
    id: string;
    messages: DialogueMessage[];
    turn_number: number;
  };

  if (sessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("shadow_dialogue_sessions")
      .select("id, messages, turn_number, completed_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      return createErrorResponse({
        message: "Dialogue session not found",
        code: ERROR_CODES.NOT_FOUND,
        status: 404,
      });
    }

    if (session.completed_at) {
      return createErrorResponse({
        message: "Dialogue already completed",
        code: ERROR_CODES.VALIDATION_ERROR,
        status: 400,
      });
    }

    currentSession = {
      id: session.id,
      messages: session.messages as DialogueMessage[],
      turn_number: session.turn_number,
    };
  } else {
    const { data: newSession, error: createError } = await supabase
      .from("shadow_dialogue_sessions")
      .insert({
        user_id: userId,
        pattern_id: patternId,
        pattern_type: pattern.pattern_type,
        dialogue_archetype: archetype,
        messages: [],
        turn_number: 0,
      })
      .select("id, messages, turn_number")
      .single();

    if (createError || !newSession) {
      log.error({ err: createError }, "Failed to create dialogue session");
      return createErrorResponse({
        message: "Failed to create dialogue session",
        code: ERROR_CODES.INTERNAL_ERROR,
        status: 500,
      });
    }

    currentSession = {
      id: newSession.id,
      messages: [],
      turn_number: 0,
    };
  }

  // Add user message to history if provided (turns 2 and 3)
  const messages = [...currentSession.messages];
  if (message) {
    messages.push({
      role: "user",
      content: message,
      turn: currentSession.turn_number,
      timestamp: new Date().toISOString(),
    });
  }

  const nextTurn = Math.floor(messages.length / 2) + 1;
  const isComplete = nextTurn > 3;

  if (isComplete) {
    return createErrorResponse({
      message: "Dialogue already has 3 turns",
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  }

  // Memory Genesis: Pre-query EverMemOS for past shadow work context (turn 1 only — context doesn't change mid-session)
  let shadowMemoryContext: string | undefined;
  if (process.env.EVERMEMOS_ENABLED === 'true' && messages.length === 0) {
    const { searchMemories, withEverMemOSFallback } = await import(
      '@/lib/evermemos'
    );
    const pastShadow = await withEverMemOSFallback(
      () =>
        searchMemories(
          'past shadow encounters and shadow work themes',
          userId,
          'hybrid',
          5,
        ),
      [],
      'shadow-dialogue-memory',
    );
    if (pastShadow.length > 0) {
      shadowMemoryContext = pastShadow
        .map((r) => r.content)
        .join('\n')
        .slice(0, 500);
    }
  }

  // Build system prompt
  const systemPrompt = buildShadowDialoguePrompt(
    {
      patternName: pattern.pattern_name,
      patternDescription: pattern.pattern_description,
      patternType: pattern.pattern_type,
    },
    archetype,
    messages,
    shadowMemoryContext,
  );

  // Build messages array for Claude
  const claudeMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  if (messages.length === 0) {
    // Turn 1: AI speaks first. Send a minimal user message to trigger response.
    claudeMessages.push({
      role: "user",
      content: "Begin the shadow dialogue.",
    });
  } else {
    for (const m of messages) {
      claudeMessages.push({ role: m.role, content: m.content });
    }
  }

  // Stream the response
  let fullResponse = "";

  try {
    const stream = await chatStream(CHAT_MODEL_FAST, claudeMessages, {
      max_tokens: 300,
      temperature: 0.8,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "start",
              archetype,
              sessionId: currentSession.id,
              turn: nextTurn,
            })}\n\n`,
          ),
        );

        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const content = event.delta.text;
              if (content) {
                fullResponse += content;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "content", content })}\n\n`,
                  ),
                );
              }
            }
          }

          // Persist the assistant turn
          const updatedMessages: DialogueMessage[] = [
            ...messages,
            {
              role: "assistant",
              content: fullResponse,
              turn: nextTurn,
              timestamp: new Date().toISOString(),
            },
          ];

          const turnComplete = nextTurn === 3;
          const updateData: Record<string, unknown> = {
            messages: updatedMessages,
            turn_number: nextTurn,
          };

          if (turnComplete) {
            updateData.completed_at = new Date().toISOString();
            updateData.integration_suggestion = fullResponse;
          }

          await supabase
            .from("shadow_dialogue_sessions")
            .update(updateData)
            .eq("id", currentSession.id);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                turn: nextTurn,
                complete: turnComplete,
              })}\n\n`,
            ),
          );
        } catch (streamError) {
          log.error({ err: streamError }, "Shadow dialogue stream error");
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Stream interrupted",
              })}\n\n`,
            ),
          );
        }

        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (aiError) {
    log.error({ err: aiError }, "Failed to start shadow dialogue stream");
    return createErrorResponse({
      message: "AI service unavailable",
      code: ERROR_CODES.INTERNAL_ERROR,
      status: 500,
    });
  }
}
