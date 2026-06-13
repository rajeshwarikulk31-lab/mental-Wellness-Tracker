/**
 * @fileoverview Mindfulness exercise API — generates adaptive exercises.
 * Validates emotion against EMOTIONS whitelist and duration against
 * MINDFULNESS_DURATION_SECONDS values.
 */

import { NextRequest, NextResponse } from "next/server";
import { EMOTIONS, MINDFULNESS_DURATION_SECONDS } from "@/constants/constants";
import type { Emotion } from "@/constants/constants";
import { generateMindfulnessExercise } from "@/services/ai-service";
import { checkRateLimit, recordRequest, getRateLimitHeaders } from "@/utils/rate-limiter";
import { logError } from "@/utils/logger";

const VALID_DURATIONS = Object.values(MINDFULNESS_DURATION_SECONDS);

/**
 * GET /api/mindfulness — Generate a guided mindfulness exercise.
 * Query params: emotion, duration (in seconds)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionId = request.headers.get("x-session-id") || "anonymous";

  try {
    const rateLimitState = checkRateLimit(sessionId);
    if (rateLimitState.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: getRateLimitHeaders(rateLimitState) }
      );
    }
    recordRequest(sessionId);

    const { searchParams } = new URL(request.url);
    const emotion = searchParams.get("emotion");
    const durationStr = searchParams.get("duration");

    if (!emotion) {
      return NextResponse.json({ error: "emotion is required" }, { status: 400 });
    }
    if (!(EMOTIONS as readonly string[]).includes(emotion)) {
      return NextResponse.json(
        { error: `Invalid emotion. Must be one of: ${EMOTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const duration = durationStr ? parseInt(durationStr, 10) : MINDFULNESS_DURATION_SECONDS.SHORT;
    if (!(VALID_DURATIONS as readonly number[]).includes(duration)) {
      return NextResponse.json(
        { error: `Invalid duration. Must be one of: ${VALID_DURATIONS.join(", ")} seconds` },
        { status: 400 }
      );
    }

    const exercise = await generateMindfulnessExercise(emotion as Emotion, duration);
    return NextResponse.json(exercise);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "mindfulness_get" });
    return NextResponse.json(
      { error: "Could not generate exercise right now. Try again soon." },
      { status: 500 }
    );
  }
}
