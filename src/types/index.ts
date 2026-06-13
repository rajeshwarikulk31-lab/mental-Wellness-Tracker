/**
 * @fileoverview TypeScript interfaces for the MindEase application.
 * Covers: JournalEntry, MoodLog, UserProfile, AIResponse, CrisisAlert,
 * and custom error types for network, validation, and AI API errors.
 */

import type { Emotion, SupportedExam } from "@/constants/constants";

/** A single journal entry with encrypted content and AI analysis */
export interface JournalEntry {
  id: string;
  userId: string;
  /** AES-256-GCM encrypted journal text */
  encryptedContent: string;
  /** Decrypted content — only populated client-side after decryption */
  content?: string;
  /** Mood score from MOOD_SCALE.MIN to MOOD_SCALE.MAX */
  mood: number;
  emotion: Emotion;
  exam: SupportedExam;
  /** AI-generated analysis of the journal entry */
  aiAnalysis: string | null;
  /** Whether crisis keywords were detected in this entry */
  isCrisisDetected: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A mood log entry for tracking emotional patterns over time */
export interface MoodLog {
  id: string;
  userId: string;
  moodScore: number;
  emotion: Emotion;
  note: string;
  createdAt: string;
}

/** User profile with exam preference */
export interface UserProfile {
  id: string;
  exam: SupportedExam;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
}

/** Structured response from the AI companion */
export interface AIResponse {
  content: string;
  isCrisisDetected: boolean;
  suggestedAction: string | null;
  timestamp: string;
}

/** Anonymised crisis event for audit logging */
export interface CrisisAlert {
  id: string;
  userId: string;
  /** Redacted trigger text — no raw PII stored */
  triggerText: string;
  source: "user_input" | "ai_response";
  helplineShown: boolean;
  createdAt: string;
}

/** Pre-aggregated daily statistics to avoid recomputation */
export interface DailyAggregate {
  userId: string;
  date: string;
  avgMood: number;
  dominantEmotion: Emotion;
  entryCount: number;
  emotionDistribution: Record<string, number>;
}

/** 7-day insight summary for the analytics dashboard */
export interface InsightsData {
  dailyAggregates: DailyAggregate[];
  overallTrend: "improving" | "stable" | "declining";
  topStressors: string[];
  moodAverage: number;
  dominantEmotion: Emotion;
}

/** Guided mindfulness exercise with timed steps */
export interface MindfulnessExercise {
  id: string;
  title: string;
  description: string;
  /** Duration in seconds */
  duration: number;
  steps: string[];
  targetEmotion: Emotion;
}

/** A single message in the AI companion conversation */
export interface CompanionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isCrisisDetected: boolean;
}

/** Generic paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/** Rate limit tracking state per session */
export interface RateLimitState {
  requests: number[];
  isLimited: boolean;
  retryAfterMs: number;
}

// ─── Custom Error Types ─────────────────────────────────────────

/** Thrown when user input fails validation */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Thrown on network/HTTP failures */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

/** Thrown when the AI provider API fails */
export class AIApiError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly isRetryable: boolean
  ) {
    super(message);
    this.name = "AIApiError";
  }
}
