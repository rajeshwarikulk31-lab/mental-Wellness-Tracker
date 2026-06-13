/**
 * @fileoverview Journal API route — POST to save + analyze, GET for paginated retrieval.
 * Implements: input sanitisation, crisis detection, rate limiting,
 * encrypted storage, and AI analysis via Gemini.
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitiseInput, validateJournalLength, validateMoodValue, validateMoodScore } from "@/utils/sanitise";
import { detectCrisis, formatCrisisResponse, createCrisisAlert } from "@/utils/crisis-detection";
import { checkRateLimit, recordRequest, getRateLimitHeaders } from "@/utils/rate-limiter";
import { logInfo, logError, logCrisisEvent } from "@/utils/logger";
import { saveJournalEntry, getJournalEntries, saveCrisisEvent } from "@/services/database";
import { analyzeJournalEntry } from "@/services/ai-service";
import { SUPPORTED_EXAMS } from "@/constants/constants";
import type { Emotion, SupportedExam } from "@/constants/constants";

/**
 * Extracts or generates a session ID from request headers.
 */
function getSessionId(request: NextRequest): string {
  return request.headers.get("x-session-id") || "anonymous";
}

/**
 * POST /api/journal — Save a journal entry with AI analysis.
 * Flow: validate → sanitise → crisis check → AI analyze → encrypt → store
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionId = getSessionId(request);

  try {
    // Rate limiting
    const rateLimitState = checkRateLimit(sessionId);
    if (rateLimitState.isLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: getRateLimitHeaders(rateLimitState) }
      );
    }
    recordRequest(sessionId);

    const body = await request.json();
    const { content, mood, emotion, exam } = body;
    const userId = sessionId;

    if (!content || mood === undefined || !emotion || !exam) {
      return NextResponse.json({ error: "Missing required fields: content, mood, emotion, exam" }, { status: 400 });
    }

    // Sanitise and validate
    const sanitisedContent = sanitiseInput(content);
    validateJournalLength(sanitisedContent);
    validateMoodScore(mood);
    validateMoodValue(emotion);
    if (!SUPPORTED_EXAMS.includes(exam)) {
      return NextResponse.json({ error: `Invalid exam: ${exam}` }, { status: 400 });
    }

    // Crisis detection on user input
    const isCrisisDetected = detectCrisis(sanitisedContent);
    if (isCrisisDetected) {
      const crisisAlert = createCrisisAlert(userId, sanitisedContent, "user_input");
      await saveCrisisEvent(crisisAlert);
      logCrisisEvent(userId, "user_input");
      const crisisResponse = formatCrisisResponse();

      // Still save the entry but flag it
      await saveJournalEntry({
        content: sanitisedContent, mood, emotion: emotion as Emotion,
        exam: exam as SupportedExam, userId, aiAnalysis: crisisResponse.message,
        isCrisisDetected: true,
      });

      return NextResponse.json({
        isCrisisDetected: true,
        crisis: crisisResponse,
        message: "Your entry has been saved. Please reach out for support.",
      });
    }

    // AI analysis
    let aiAnalysis = null;
    try {
      const analysisResult = await analyzeJournalEntry(
        sanitisedContent, mood, emotion as Emotion, exam as SupportedExam
      );
      aiAnalysis = analysisResult.content;

      // Check AI response for crisis content
      if (analysisResult.isCrisisDetected) {
        const crisisAlert = createCrisisAlert(userId, "AI response flagged", "ai_response");
        await saveCrisisEvent(crisisAlert);
        logCrisisEvent(userId, "ai_response");
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), { context: "journal_ai" });
      aiAnalysis = "I wasn't able to provide analysis right now. Your entry has been saved safely.";
    }

    // Save encrypted journal entry
    const entry = await saveJournalEntry({
      content: sanitisedContent, mood, emotion: emotion as Emotion,
      exam: exam as SupportedExam, userId, aiAnalysis, isCrisisDetected: false,
    });

    logInfo("Journal entry saved", { userId, hasAnalysis: !!aiAnalysis });
    return NextResponse.json({ entry: { ...entry, content: sanitisedContent }, analysis: aiAnalysis, isCrisisDetected: false });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "journal_post" });
    const message = error instanceof Error && error.name === "ValidationError"
      ? error.message : "Something went wrong saving your journal. Please try again.";
    const status = error instanceof Error && error.name === "ValidationError" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * GET /api/journal — Retrieve paginated journal entries.
 * Query params: userId, page (default 1), pageSize (default 30)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get("x-session-id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const entries = await getJournalEntries(userId, page, pageSize);
    return NextResponse.json(entries);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "journal_get" });
    return NextResponse.json({ error: "Failed to retrieve journal entries" }, { status: 500 });
  }
}
