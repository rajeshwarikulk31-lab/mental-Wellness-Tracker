/**
 * @fileoverview Google Gemini AI service for MindEase.
 * Server-side only. Proxies all AI calls through backend API routes.
 * Features: response caching (5-min TTL), crisis detection on responses,
 * retry with exponential backoff, and SSE streaming support.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_MAX_RESPONSE_TOKENS, CACHE_TTL_MS } from "@/constants/constants";
import type { Emotion, SupportedExam } from "@/constants/constants";
import type { AIResponse, CompanionMessage, MindfulnessExercise } from "@/types";
import { AIApiError } from "@/types";
import { detectCrisis } from "@/utils/crisis-detection";
import { withRetry } from "@/utils/retry";
import { logError, logInfo } from "@/utils/logger";
import {
  buildJournalAnalysisPrompt,
  buildCompanionPrompt,
  buildMindfulnessPrompt,
  getSystemPrompt,
} from "./ai-prompt-builder";
import { v4 as uuidv4 } from "uuid";

/** In-memory response cache: hash → { response, timestamp } */
const responseCache = new Map<string, { response: string; timestamp: number }>();

/**
 * Creates a simple hash for cache key lookup.
 * Uses DJB2 algorithm for fast string hashing.
 */
function hashPrompt(prompt: string): string {
  let hash = 5381;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) + hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  return `cache_${Math.abs(hash).toString(36)}`;
}

/**
 * Retrieves a cached response if still within TTL.
 * @param promptHash - Hash of the prompt
 * @returns Cached response string or null if expired/missing
 */
function getCachedResponse(promptHash: string): string | null {
  const cached = responseCache.get(promptHash);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    responseCache.delete(promptHash);
    return null;
  }
  return cached.response;
}

/**
 * Stores a response in the cache with current timestamp.
 */
function cacheResponse(promptHash: string, response: string): void {
  responseCache.set(promptHash, { response, timestamp: Date.now() });
}

/** Singleton Gemini client */
let geminiClient: GoogleGenerativeAI | null = null;

/**
 * Returns the singleton Gemini API client.
 * @throws AIApiError if GEMINI_API_KEY is not configured
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIApiError(
      "GEMINI_API_KEY environment variable is not configured",
      "gemini",
      false
    );
  }
  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
}

/**
 * Calls Gemini API with the given prompt and system instruction.
 * Wrapped in retry logic for resilience.
 * @param prompt - User prompt to send
 * @returns Generated text response
 */
async function callGemini(prompt: string): Promise<string> {
  try {
    return await withRetry(async () => {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: getSystemPrompt(),
        generationConfig: { maxOutputTokens: AI_MAX_RESPONSE_TOKENS },
      });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      if (!response) {
        throw new AIApiError("Empty response from Gemini", "gemini", true);
      }
      return response;
    });
  } catch (error) {
    if (error instanceof AIApiError) throw error;
    const message = error instanceof Error ? error.message : "Unknown AI error";
    logError(error instanceof Error ? error : new Error(message), { context: "gemini_call" });
    throw new AIApiError(message, "gemini", true);
  }
}

/**
 * Analyzes a journal entry using GenAI. Detects hidden stress patterns
 * and provides personalised coping strategies.
 * Checks cache first, then calls Gemini API.
 * @param journalText - Sanitised journal text
 * @param mood - Mood score (1–10)
 * @param emotion - Current emotion
 * @param exam - Target exam
 * @returns AIResponse with analysis and crisis detection
 */
export async function analyzeJournalEntry(
  journalText: string,
  mood: number,
  emotion: Emotion,
  exam: SupportedExam
): Promise<AIResponse> {
  try {
    const prompt = buildJournalAnalysisPrompt(journalText, mood, emotion, exam);
    const promptHash = hashPrompt(prompt);

    const cached = getCachedResponse(promptHash);
    if (cached) {
      logInfo("Cache hit for journal analysis");
      return buildAIResponse(cached);
    }

    const response = await callGemini(prompt);
    cacheResponse(promptHash, response);
    return buildAIResponse(response);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "analyze_journal" });
    throw error;
  }
}

/**
 * Generates a companion chat response with conversation context.
 * @param messages - Conversation history
 * @param mood - Optional current mood
 * @param emotion - Optional current emotion
 */
export async function generateCompanionResponse(
  messages: CompanionMessage[],
  mood?: number,
  emotion?: Emotion
): Promise<AIResponse> {
  try {
    const prompt = buildCompanionPrompt(messages, mood, emotion);
    const response = await callGemini(prompt);
    return buildAIResponse(response);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "companion_response" });
    throw error;
  }
}

/**
 * Generates a guided mindfulness exercise based on current emotion.
 * @param emotion - Current emotion to address
 * @param durationSeconds - Exercise duration in seconds
 */
export async function generateMindfulnessExercise(
  emotion: Emotion,
  durationSeconds: number
): Promise<MindfulnessExercise> {
  try {
    const prompt = buildMindfulnessPrompt(emotion, durationSeconds);
    const response = await callGemini(prompt);
    return parseMindfulnessResponse(response, emotion, durationSeconds);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "mindfulness_gen" });
    throw error;
  }
}

/**
 * Async generator for streaming AI companion responses via SSE.
 * Yields text chunks as they become available.
 */
export async function* streamCompanionResponse(
  messages: CompanionMessage[],
  mood?: number,
  emotion?: Emotion
): AsyncGenerator<string, void, unknown> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: getSystemPrompt(),
      generationConfig: { maxOutputTokens: AI_MAX_RESPONSE_TOKENS },
    });

    const prompt = buildCompanionPrompt(messages, mood, emotion);
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "stream_companion" });
    throw new AIApiError("Streaming failed", "gemini", true);
  }
}

/** Wraps raw AI text into a structured AIResponse with crisis check */
function buildAIResponse(content: string): AIResponse {
  const isCrisisDetected = detectCrisis(content);
  return {
    content,
    isCrisisDetected,
    suggestedAction: extractAction(content),
    timestamp: new Date().toISOString(),
  };
}

/** Extracts the actionable suggestion (last sentence/paragraph) */
function extractAction(text: string): string | null {
  const sentences = text.split(/[.!?]\s+/).filter(Boolean);
  return sentences.length > 0 ? sentences[sentences.length - 1].trim() : null;
}

/** Parses a mindfulness exercise from AI JSON response */
function parseMindfulnessResponse(
  response: string,
  emotion: Emotion,
  duration: number
): MindfulnessExercise {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: uuidv4(),
        title: parsed.title || "Mindfulness Exercise",
        description: parsed.description || "A calming exercise for you.",
        duration,
        steps: Array.isArray(parsed.steps) ? parsed.steps : [response],
        targetEmotion: emotion,
      };
    }
  } catch {
    // Fallback: use the raw response as a single step
  }
  return {
    id: uuidv4(),
    title: "Guided Breathing Exercise",
    description: `A ${Math.round(duration / 60)}-minute exercise to help with feeling ${emotion}.`,
    duration,
    steps: [response],
    targetEmotion: emotion,
  };
}
