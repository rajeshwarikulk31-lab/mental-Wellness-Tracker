/**
 * @fileoverview Insights API — Returns 7-day aggregated analytics.
 * Uses ANALYSIS_LOOKBACK_DAYS for lookback window.
 * Pre-aggregated daily stats avoid recomputation.
 */

import { NextRequest, NextResponse } from "next/server";
import { ANALYSIS_LOOKBACK_DAYS } from "@/constants/constants";
import type { InsightsData, DailyAggregate } from "@/types";
import type { Emotion } from "@/constants/constants";
import { getDailyAggregates } from "@/services/database";
import { getDateRangeForPeriod } from "@/utils/date-helpers";
import { logError } from "@/utils/logger";

/**
 * Calculates the overall mood trend from daily aggregates.
 * Compares first-half average to second-half average.
 */
function calculateTrend(aggregates: DailyAggregate[]): "improving" | "stable" | "declining" {
  if (aggregates.length < 2) return "stable";
  const midpoint = Math.floor(aggregates.length / 2);
  const firstHalf = aggregates.slice(0, midpoint);
  const secondHalf = aggregates.slice(midpoint);

  const avgFirst = firstHalf.reduce((sum, a) => sum + a.avgMood, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, a) => sum + a.avgMood, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

/**
 * Finds the most common emotion across all aggregates.
 */
function findDominantEmotion(aggregates: DailyAggregate[]): Emotion {
  const emotionCounts: Record<string, number> = {};
  for (const agg of aggregates) {
    const emotion = agg.dominantEmotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + agg.entryCount;
  }
  const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] || "calm") as Emotion;
}

/**
 * Identifies top stressors from emotion distribution patterns.
 */
function identifyTopStressors(aggregates: DailyAggregate[]): string[] {
  const stressEmotions = ["anxious", "overwhelmed", "stressed", "burnt out"];
  const stressors: string[] = [];

  const stressCount = aggregates.filter(
    (a) => stressEmotions.includes(a.dominantEmotion)
  ).length;

  if (stressCount > aggregates.length * 0.5) {
    stressors.push("Persistent stress levels detected");
  }
  if (aggregates.some((a) => a.avgMood <= 3)) {
    stressors.push("Very low mood days observed");
  }
  if (aggregates.length >= 3) {
    const recent = aggregates.slice(-3);
    const declining = recent.every((a, i) => i === 0 || a.avgMood < recent[i - 1].avgMood);
    if (declining) stressors.push("Declining mood trend");
  }

  return stressors;
}

/**
 * GET /api/insights — Returns 7-day aggregated emotional pattern insights.
 * Query params: userId
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { start, end } = getDateRangeForPeriod(ANALYSIS_LOOKBACK_DAYS);
    const dailyAggregates = await getDailyAggregates(userId, start, end);

    const moodAverage = dailyAggregates.length > 0
      ? dailyAggregates.reduce((sum, a) => sum + a.avgMood, 0) / dailyAggregates.length
      : 5;

    const insights: InsightsData = {
      dailyAggregates,
      overallTrend: calculateTrend(dailyAggregates),
      topStressors: identifyTopStressors(dailyAggregates),
      moodAverage: Math.round(moodAverage * 10) / 10,
      dominantEmotion: findDominantEmotion(dailyAggregates),
    };

    return NextResponse.json(insights);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "insights_get" });
    return NextResponse.json({ error: "Failed to retrieve insights" }, { status: 500 });
  }
}
