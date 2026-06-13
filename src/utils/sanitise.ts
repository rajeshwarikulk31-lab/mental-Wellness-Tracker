/**
 * @fileoverview Input sanitisation utilities.
 * Strips XSS vectors, SQL injection patterns, prompt injection attempts,
 * and unusual Unicode from user input before processing or sending to AI.
 */

import { JOURNAL_MAX_CHARS, EMOTIONS, MOOD_SCALE } from "@/constants/constants";
import type { Emotion } from "@/constants/constants";
import { ValidationError } from "@/types";

const SCRIPT_TAG_PATTERN = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const SQL_INJECTION_PATTERN =
  /('|--|;|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/gi;
const UNUSUAL_UNICODE_PATTERN =
  /[\u200B-\u200F\u2028-\u202F\uFEFF\u0000-\u001F]/g;

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/gi,
  /you\s+are\s+now/gi,
  /system\s*:\s*/gi,
  /\[\s*INST\s*\]/gi,
  /<<\s*SYS\s*>>/gi,
  /\bpretend\s+you\s+are\b/gi,
  /\bact\s+as\s+(a|an)?\s*\b/gi,
];

/**
 * Sanitises user input by stripping dangerous patterns.
 * @param input - Raw user input string
 * @returns Cleaned input safe for processing
 */
export function sanitiseInput(input: string): string {
  let sanitised = input;
  sanitised = sanitised.replace(SCRIPT_TAG_PATTERN, "");
  sanitised = sanitised.replace(HTML_TAG_PATTERN, "");
  sanitised = sanitised.replace(SQL_INJECTION_PATTERN, "");
  sanitised = sanitised.replace(UNUSUAL_UNICODE_PATTERN, "");
  sanitised = stripPromptInjection(sanitised);
  return sanitised.trim();
}

/**
 * Strips prompt injection attempts from text.
 * @param text - Input text to clean
 * @returns Text with prompt injection patterns removed
 */
function stripPromptInjection(text: string): string {
  let cleaned = text;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned;
}

/**
 * Validates journal entry length against JOURNAL_MAX_CHARS.
 * @param text - Journal entry text
 * @throws ValidationError if text exceeds maximum length
 */
export function validateJournalLength(text: string): void {
  if (text.length > JOURNAL_MAX_CHARS) {
    throw new ValidationError(
      `Journal entry must be ${JOURNAL_MAX_CHARS} characters or fewer. Currently: ${text.length}`,
      "content"
    );
  }
}

/**
 * Validates that an emotion value is in the allowed EMOTIONS list.
 * @param emotion - Emotion string to validate
 * @returns Type-narrowed emotion value
 * @throws ValidationError if emotion is not in EMOTIONS whitelist
 */
export function validateMoodValue(emotion: string): emotion is Emotion {
  const isValid = (EMOTIONS as readonly string[]).includes(emotion);
  if (!isValid) {
    throw new ValidationError(
      `Invalid emotion: "${emotion}". Must be one of: ${EMOTIONS.join(", ")}`,
      "emotion"
    );
  }
  return true;
}

/**
 * Validates mood score is within MOOD_SCALE bounds.
 * @param score - Numeric mood score
 * @throws ValidationError if outside MIN–MAX range
 */
export function validateMoodScore(score: number): void {
  if (!Number.isInteger(score) || score < MOOD_SCALE.MIN || score > MOOD_SCALE.MAX) {
    throw new ValidationError(
      `Mood score must be an integer between ${MOOD_SCALE.MIN} and ${MOOD_SCALE.MAX}`,
      "mood"
    );
  }
}

/**
 * Removes all HTML tags from a string.
 * @param text - Input text potentially containing HTML
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(text: string): string {
  return text.replace(HTML_TAG_PATTERN, "");
}

/**
 * Detects prompt injection patterns in user input.
 * @param text - Input text to check
 * @returns True if any prompt injection pattern is found
 */
export function detectPromptInjection(text: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

/**
 * Validates that an exam value is in the SUPPORTED_EXAMS list.
 * @param exam - Exam string to validate
 * @throws ValidationError if not a supported exam
 */
export function validateExam(exam: string): void {
  const { SUPPORTED_EXAMS } = require("@/constants/constants");
  if (!SUPPORTED_EXAMS.includes(exam)) {
    throw new ValidationError(
      `Invalid exam: "${exam}". Must be one of: ${SUPPORTED_EXAMS.join(", ")}`,
      "exam"
    );
  }
}
