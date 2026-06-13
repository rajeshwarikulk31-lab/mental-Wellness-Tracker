/**
 * @fileoverview Insights hook — fetches and memoizes 7-day aggregated data.
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { InsightsData } from "@/types";

interface UseInsightsReturn {
  insights: InsightsData | null;
  isLoading: boolean;
  hasError: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching 7-day emotional pattern insights.
 * Memoizes the result to avoid re-renders on chart components.
 * @param userId - Current user's ID
 */
export function useInsights(userId: string): UseInsightsReturn {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch(`/api/insights?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch insights");
      const data = await response.json();
      setInsights(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, isLoading, hasError, refresh: fetchInsights };
}
