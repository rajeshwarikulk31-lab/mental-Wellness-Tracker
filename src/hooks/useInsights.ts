"use client";

import useSWR from "swr";
import type { DailyAggregate } from "@/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch data");
  }
  return res.json();
};

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
