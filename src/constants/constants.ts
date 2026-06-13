/**
 * @fileoverview MindEase application constants.
 * All magic values are defined here — no hardcoded strings anywhere else.
 * Supports: journaling, mood logs, stress triggers, emotional patterns,
 * coping strategies, mindfulness, and empathetic companion features.
 */

/** Application display name */
export const APP_NAME = "MindEase";

/** Competitive exams supported by the tracker */
export const SUPPORTED_EXAMS = ["NEET", "JEE", "CUET", "CAT", "GATE", "UPSC"] as const;

/** Derived type for supported exams */
export type SupportedExam = (typeof SUPPORTED_EXAMS)[number];

/** Mood score boundaries (1 = worst, 10 = best) */
export const MOOD_SCALE = { MIN: 1, MAX: 10 } as const;

/** Maximum character count for a single journal entry */
export const JOURNAL_MAX_CHARS = 2000;

/** Session timeout in milliseconds (30 minutes) */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** Maximum retry attempts for failed API calls */
export const MAX_RETRIES = 3;

/** Rate limiting window in milliseconds (1 minute) */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Maximum API requests allowed per rate limit window */
export const RATE_LIMIT_MAX_REQUESTS = 20;

/** Keywords that trigger the crisis safety net */
export const CRISIS_KEYWORDS = [
  "suicide",
  "self-harm",
  "hopeless",
  "give up",
  "can't go on",
] as const;

/** Crisis helpline displayed to students in distress */
export const CRISIS_HELPLINE = "iCall: 9152987821";

/** Supported emotion labels for mood logging */
export const EMOTIONS = [
  "calm",
  "anxious",
  "overwhelmed",
  "motivated",
  "burnt out",
  "hopeful",
  "stressed",
  "numb",
] as const;

/** Derived type for emotion values */
export type Emotion = (typeof EMOTIONS)[number];

/** Emoji icons mapped to each emotion — always paired with text label */
export const EMOTION_ICONS: Record<Emotion, string> = {
  calm: "😌",
  anxious: "😰",
  overwhelmed: "😩",
  motivated: "💪",
  "burnt out": "🔥",
  hopeful: "🌟",
  stressed: "😣",
  numb: "😶",
};

/** Guided mindfulness exercise durations in seconds */
export const MINDFULNESS_DURATION_SECONDS = {
  SHORT: 120,
  MEDIUM: 300,
  LONG: 600,
} as const;

/** Number of days to look back for pattern analysis */
export const ANALYSIS_LOOKBACK_DAYS = 7;

/** In-memory AI response cache TTL in milliseconds (5 minutes) */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** Default page size for paginated queries */
export const DEFAULT_PAGE_SIZE = 30;

/** Maximum tokens for AI-generated responses */
export const AI_MAX_RESPONSE_TOKENS = 300;

/** Debounce delay for journal auto-save in milliseconds */
export const DEBOUNCE_DELAY_MS = 1000;

/**
 * Static system prompt for the GenAI companion.
 * Set once per session — not repeated per turn.
 */
export const AI_SYSTEM_PROMPT = `You are MindEase, a compassionate mental wellness companion for Indian students preparing for competitive exams. You understand the specific pressures of NEET, JEE, CUET, CAT, GATE, and UPSC preparation — including syllabus anxiety, peer comparison, parental pressure, self-doubt, and burnout.

Your role: analyse the student's journal entry and mood log, identify hidden stress patterns they may not have noticed, and provide one specific, actionable coping strategy or mindfulness exercise tailored to what they've shared today.

Tone: warm, non-judgmental, encouraging — like a trusted senior student who genuinely cares. Never clinical or robotic.

Rules:
- Never diagnose. Recommend professional help gently when patterns are severe.
- If you detect any language suggesting self-harm or hopelessness, immediately respond with the iCall helpline (9152987821) and encourage the student to reach out.
- Keep responses concise (≤150 words) unless the student asks for more.
- Always end with one small, achievable action they can take in the next 30 minutes.`;
