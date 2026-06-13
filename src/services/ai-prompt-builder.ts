/**
 * @fileoverview AI prompt builder for Gemini API calls.
 * Constructs context-rich prompts for journal analysis,
 * companion conversations, and mindfulness exercises.
 * System prompt is set once per session from constants.
 */

import { AI_SYSTEM_PROMPT } from "@/constants/constants";
import type { Emotion, SupportedExam } from "@/constants/constants";
import type { CompanionMessage } from "@/types";

/**
 * Returns the static system prompt for the AI companion.
 * Set once per session — not repeated per turn.
 */
export function getSystemPrompt(): string {
  return AI_SYSTEM_PROMPT;
}

/**
 * Builds a prompt for AI analysis of a journal entry.
 * Includes mood score, emotion, and exam context.
 * @param journalText - Sanitised journal entry text
 * @param mood - Current mood score (1–10)
 * @param emotion - Current emotion label
 * @param exam - Student's target exam
 */
export function buildJournalAnalysisPrompt(
  journalText: string,
  mood: number,
  emotion: Emotion,
  exam: SupportedExam
): string {
  return [
    `The student is preparing for ${exam}.`,
    `Current mood: ${mood}/10 | Feeling: ${emotion}`,
    "",
    "Today's journal entry:",
    `"${journalText}"`,
    "",
    "Please analyse this entry. Identify any hidden stress patterns,",
    "emotional triggers, or signs of burnout they may not have noticed.",
    "Then provide one specific, actionable coping strategy tailored to their situation.",
    "",
    'Respond in valid JSON format ONLY:',
    '{',
    '  "emotional_summary": "A brief summary of their emotional state and hidden patterns",',
    '  "detected_triggers": ["trigger1", "trigger2"],',
    '  "recommended_actions": ["action1"],',
    '  "burnout_risk": "low" | "medium" | "high"',
    '}',
  ].join("\n");
}

/**
 * Builds a conversational prompt with chat history context.
 * Limits history to last 10 messages to stay within token budget.
 * @param conversationHistory - Previous messages in the conversation
 * @param currentMood - Optional current mood score
 * @param currentEmotion - Optional current emotion
 */
export function buildCompanionPrompt(
  conversationHistory: CompanionMessage[],
  currentMood?: number,
  currentEmotion?: Emotion
): string {
  const recentHistory = conversationHistory.slice(-10);

  const parts: string[] = [];

  if (currentMood !== undefined || currentEmotion !== undefined) {
    const moodPart = currentMood !== undefined ? `${currentMood}/10` : "not specified";
    const emotionPart = currentEmotion ?? "not specified";
    parts.push(`Student's current state — Mood: ${moodPart} | Feeling: ${emotionPart}`);
    parts.push("");
  }

  parts.push("Conversation so far:");
  for (const msg of recentHistory) {
    const role = msg.role === "user" ? "Student" : "MindEase";
    parts.push(`${role}: ${msg.content}`);
  }

  return parts.join("\n");
}

/**
 * Builds a prompt requesting a guided mindfulness exercise.
 * Tailored to the student's current emotion and desired duration.
 * @param emotion - Current emotion to address
 * @param durationSeconds - Exercise duration in seconds
 */
export function buildMindfulnessPrompt(
  emotion: Emotion,
  durationSeconds: number
): string {
  const minutes = Math.round(durationSeconds / 60);
  return [
    `The student is feeling "${emotion}" and has ${minutes} minutes for a mindfulness exercise.`,
    "",
    "Please create a guided mindfulness exercise with:",
    "1. A calming title",
    "2. A brief description (1-2 sentences)",
    `3. Step-by-step instructions (${minutes} minutes total)`,
    "4. Each step should include timing guidance",
    "",
    'Respond in valid JSON format: { "title": "...", "description": "...", "steps": ["step1", "step2", ...] }',
  ].join("\n");
}

export function buildHistoricalInsightsPrompt(
  journals: string[],
  aggregates: any[]
): string {
  return [
    `The student has provided ${journals.length} journal entries over the past week.`,
    `Here are their daily mood aggregates: ${JSON.stringify(aggregates.map(a => ({ date: a.date, mood: a.avgMood, emotion: a.dominantEmotion })))}`,
    "",
    "Journal Entries:",
    ...journals.map((j, i) => `Day ${i + 1}: "${j}"`),
    "",
    "Please analyze these entries together to find long-term patterns, recurring stressors, and overall burnout trends.",
    "",
    'Respond in valid JSON format ONLY:',
    '{',
    '  "weekly_summary": "Holistic paragraph summarizing their week",',
    '  "dominant_patterns": ["pattern1", "pattern2"],',
    '  "improvement_areas": ["area1"],',
    '  "burnout_trend": "improving" | "stable" | "worsening"',
    '}',
  ].join("\n");
}
