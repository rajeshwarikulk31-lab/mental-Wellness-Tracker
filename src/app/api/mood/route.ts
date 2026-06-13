/**
 * @fileoverview Mood logging API — POST to log mood, GET for paginated history.
 * Validates mood score against MOOD_SCALE, emotion against EMOTIONS whitelist.
 * Checks notes for crisis keywords.
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitiseInput, validateMoodValue, validateMoodScore } from "@/utils/sanitise";
import { detectCrisis, formatCrisisResponse, createCrisisAlert } from "@/utils/crisis-detection";
import { checkRateLimit, recordRequest, getRateLimitHeaders } from "@/utils/rate-limiter";
import { logError, logInfo, logCrisisEvent } from "@/utils/logger";
import { saveMoodLog, getMoodHistory, saveCrisisEvent } from "@/services/database";
import type { Emotion } from "@/constants/constants";

/**
 * POST /api/mood — Log a mood entry.
 * Body: { userId, moodScore, emotion, note? }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionId = request.headers.get("x-session-id") || "anonymous";

  try {
    const rateLimitState = checkRateLimit(sessionId);
    if (rateLimitState.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: getRateLimitHeaders(rateLimitState) }
      );
    }
    recordRequest(sessionId);

    const body = await request.json();
    const { moodScore, emotion, note = "" } = body;
    const userId = sessionId;

    if (moodScore === undefined || !emotion) {
      return NextResponse.json({ error: "Missing required fields: moodScore, emotion" }, { status: 400 });
    }

    validateMoodScore(moodScore);
    validateMoodValue(emotion);
    const sanitisedNote = note ? sanitiseInput(note) : "";

    // Check note for crisis keywords
    if (sanitisedNote && detectCrisis(sanitisedNote)) {
      const crisisAlert = createCrisisAlert(userId, sanitisedNote, "user_input");
      await saveCrisisEvent(crisisAlert);
      logCrisisEvent(userId, "user_input");
      const crisisResponse = formatCrisisResponse();

      await saveMoodLog({ userId, moodScore, emotion: emotion as Emotion, note: sanitisedNote });

      return NextResponse.json({
        isCrisisDetected: true,
        crisis: crisisResponse,
        message: "Your mood has been logged. Please reach out for support.",
      });
    }

    const moodLog = await saveMoodLog({
      userId, moodScore, emotion: emotion as Emotion, note: sanitisedNote,
    });

    logInfo("Mood logged", { userId });
    return NextResponse.json({ moodLog, isCrisisDetected: false });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "mood_post" });
    const message = error instanceof Error && error.name === "ValidationError"
      ? error.message : "Something went wrong logging your mood.";
    const status = error instanceof Error && error.name === "ValidationError" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * GET /api/mood — Retrieve paginated mood history.
 * Query params: userId, page, pageSize
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get("x-session-id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "30", 10);

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const history = await getMoodHistory(userId, page, pageSize);
    return NextResponse.json(history);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "mood_get" });
    return NextResponse.json({ error: "Failed to retrieve mood history" }, { status: 500 });
  }
}
