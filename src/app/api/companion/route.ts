/**
 * @fileoverview AI Companion chat API with SSE streaming.
 * Streams AI responses using Server-Sent Events for responsive UI.
 * Checks both user input and AI responses for crisis keywords.
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitiseInput } from "@/utils/sanitise";
import { detectCrisis, formatCrisisResponse, createCrisisAlert } from "@/utils/crisis-detection";
import { checkRateLimit, recordRequest, getRateLimitHeaders } from "@/utils/rate-limiter";
import { logError, logInfo, logCrisisEvent } from "@/utils/logger";
import { saveCrisisEvent } from "@/services/database";
import { streamCompanionResponse } from "@/services/ai-service";
import type { CompanionMessage } from "@/types";

/**
 * POST /api/companion — AI companion chat with SSE streaming.
 * Body: { userId, message, conversationHistory, mood?, emotion? }
 *
 * If crisis detected in user message → immediate JSON response (not streamed).
 * Otherwise → SSE stream of AI response chunks.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const sessionId = request.headers.get("x-session-id") || "anonymous";

  try {
    // Rate limiting
    const rateLimitState = checkRateLimit(sessionId);
    if (rateLimitState.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: getRateLimitHeaders(rateLimitState) }
      );
    }
    recordRequest(sessionId);

    const body = await request.json();
    const { userId, message, conversationHistory = [], mood, emotion } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: "userId and message are required" }, { status: 400 });
    }

    const sanitisedMessage = sanitiseInput(message);

    // Crisis detection on user input — return immediately, don't stream
    if (detectCrisis(sanitisedMessage)) {
      const crisisAlert = createCrisisAlert(userId, sanitisedMessage, "user_input");
      await saveCrisisEvent(crisisAlert);
      logCrisisEvent(userId, "user_input");
      const crisisResponse = formatCrisisResponse();

      return NextResponse.json({
        isCrisisDetected: true,
        crisis: crisisResponse,
      });
    }

    // Build conversation with sanitised new message
    const messages: CompanionMessage[] = [
      ...conversationHistory,
      {
        id: Date.now().toString(),
        role: "user" as const,
        content: sanitisedMessage,
        timestamp: new Date().toISOString(),
        isCrisisDetected: false,
      },
    ];

    // Stream response via SSE
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamCompanionResponse(messages, mood, emotion);

          for await (const chunk of generator) {
            fullResponse += chunk;
            const sseData = JSON.stringify({ content: chunk, done: false });
            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          }

          // Check completed response for crisis keywords
          const isCrisisInResponse = detectCrisis(fullResponse);
          if (isCrisisInResponse) {
            const crisisAlert = createCrisisAlert(userId, "AI response flagged", "ai_response");
            await saveCrisisEvent(crisisAlert);
            logCrisisEvent(userId, "ai_response");
          }

          const finalData = JSON.stringify({
            content: "",
            done: true,
            isCrisisDetected: isCrisisInResponse,
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          controller.close();
        } catch (error) {
          logError(error instanceof Error ? error : new Error(String(error)), { context: "companion_stream" });
          const errorData = JSON.stringify({
            content: "I'm having trouble connecting right now. Please try again in a moment. 💛",
            done: true,
            error: true,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    logInfo("Companion stream started", { userId });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "companion_post" });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
