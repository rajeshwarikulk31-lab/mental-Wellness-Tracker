import { z } from "zod";

export const AIResponseSchema = z.object({
  emotional_summary: z.string().optional().describe("A 1-2 sentence empathetic summary"),
  detected_triggers: z.array(z.string()).optional().describe("Identified stress triggers"),
  recommended_actions: z.array(z.string()).optional().describe("Actionable advice"),
  burnout_risk: z.enum(["low", "medium", "high"]).optional().describe("Estimated burnout risk"),
});

export const HistoricalInsightsSchema = z.object({
  weekly_summary: z.string().describe("A holistic paragraph summarizing the student's emotional week"),
  dominant_patterns: z.array(z.string()).describe("Recurring emotional patterns or triggers detected"),
  improvement_areas: z.array(z.string()).describe("Specific areas to focus on for mental wellness"),
  burnout_trend: z.enum(["improving", "stable", "worsening"]).describe("How the burnout risk is trending over the week"),
});
