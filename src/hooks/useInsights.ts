"use client";

import useSWR from "swr";
import type { DailyAggregate } from "@/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useInsights() {
  const { data, mutate, error } = useSWR('/api/insights', fetcher);
  
  const insights = data || null;
  const isLoading = !data && !error;
  const hasError = !!error;

  const loadInsights = async () => {
    await mutate();
  };

  return {
    insights,
    isLoading,
    hasError,
    loadInsights,
  };
}
