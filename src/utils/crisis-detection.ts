/**
 * @fileoverview Crisis detection and safety net.
 * Checks user input AND AI responses against CRISIS_KEYWORDS.
 * On detection: pauses normal flow, shows empathetic message + helpline.
 */

import { CRISIS_KEYWORDS, CRISIS_HELPLINE } from "@/constants/constants";
import type { CrisisAlert } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Checks text for crisis keywords indicating self-harm or hopelessness.
 * Uses case-insensitive substring matching.
 * @param text - Text to scan (user input or AI response)
 * @returns True if any crisis keyword is detected
 */
export function detectCrisis(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const lowerText = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}

/**
 * Returns an empathetic crisis response with helpline information.
 * Designed to feel warm and supportive, not clinical.
 */
export function formatCrisisResponse(): { message: string; helpline: string } {
  return {
    message:
      "I hear you, and what you're feeling matters deeply. You don't have to face this alone. " +
      "Please reach out to a trained counsellor who truly understands — they're just a call away, " +
      "and there's absolutely no shame in asking for support. You deserve to feel better. 💛",
    helpline: CRISIS_HELPLINE,
  };
}

/**
 * Creates an anonymised crisis alert for audit logging.
 * Redacts the trigger text to protect privacy.
 * @param userId - User identifier (will be hashed in logs)
 * @param triggerText - The text that triggered crisis detection
 * @param source - Whether crisis was detected in user input or AI response
 */
export function createCrisisAlert(
  userId: string,
  triggerText: string,
  source: "user_input" | "ai_response"
): CrisisAlert {
  const redactedText = redactCrisisTrigger(triggerText);
  return {
    id: uuidv4(),
    userId,
    triggerText: redactedText,
    source,
    helplineShown: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Redacts the trigger text, keeping only the matched keyword.
 * Ensures no raw PII is stored in crisis logs.
 */
function redactCrisisTrigger(text: string): string {
  const lowerText = text.toLowerCase();
  const matched = CRISIS_KEYWORDS.filter((kw) => lowerText.includes(kw));
  return `[REDACTED] Keywords detected: ${matched.join(", ")}`;
}
