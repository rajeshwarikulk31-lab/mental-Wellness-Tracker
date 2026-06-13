"use client";

import React, { useState, useCallback } from "react";
import useSWR from "swr";
import type { Emotion } from "@/constants/constants";
import type { MoodLog } from "@/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMoodLog() {
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [moodScore, setMoodScore] = useState(5);
  const [note, setNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCrisisDetected, setIsCrisisDetected] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<{ message: string; helpline: string } | null>(null);
  
  // Use SWR for caching and automatic revalidation
  const { data, mutate, error } = useSWR('/api/mood', fetcher);
  const moodHistory: MoodLog[] = React.useMemo(() => data?.data || [], [data?.data]);
  const isLoadingHistory = !data && !error;

  const logMood = useCallback(async () => {
    if (!selectedEmotion) return;

    // Optimistic UI update
    const optimisticLog: MoodLog = {
      id: `temp-${Date.now()}`,
      userId: "optimistic",
      moodScore,
      emotion: selectedEmotion,
      note,
      createdAt: new Date().toISOString(),
    };
    
    // Mutate SWR cache optimistically without revalidating immediately
    mutate({ data: [optimisticLog, ...moodHistory] }, false);
    
    setIsLogging(true);
    setHasError(false);
    setIsCrisisDetected(false);
    setCrisisMessage(null);

    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodScore, emotion: selectedEmotion, note }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to log mood");
      }

      if (resData.isCrisisDetected) {
        setIsCrisisDetected(true);
        setCrisisMessage(resData.crisis);
      }

      // Revalidate to sync with real DB data
      mutate();
      setNote("");
    } catch (err) {
      // Revert on failure by triggering a revalidation
      mutate();
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "Failed to log mood");
    } finally {
      setIsLogging(false);
    }
  }, [moodScore, selectedEmotion, note, moodHistory, mutate]);

  // Keep loadHistory for backwards compatibility with UI components if they call it explicitly
  const loadHistory = useCallback(async (page: number = 1) => {
    // SWR handles this, so we just trigger a revalidation if requested
    await mutate();
  }, [mutate]);

  return {
    selectedEmotion, moodScore, note, isLogging, hasError, errorMessage,
    isCrisisDetected, crisisMessage, moodHistory, isLoadingHistory,
    setSelectedEmotion, setMoodScore, setNote, logMood, loadHistory,
  };
}
