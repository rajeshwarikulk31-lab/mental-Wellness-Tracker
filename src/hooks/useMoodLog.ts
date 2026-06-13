/**
 * @fileoverview Mood logging hook with optimistic UI updates.
 * Updates UI immediately on mood log, syncs to backend in background.
 */

"use client";

import { useState, useCallback } from "react";
import type { Emotion } from "@/constants/constants";
import type { MoodLog } from "@/types";

interface UseMoodLogReturn {
  selectedEmotion: Emotion | null;
  moodScore: number;
  note: string;
  isLogging: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isCrisisDetected: boolean;
  crisisMessage: { message: string; helpline: string } | null;
  moodHistory: MoodLog[];
  isLoadingHistory: boolean;
  setSelectedEmotion: (emotion: Emotion) => void;
  setMoodScore: (score: number) => void;
  setNote: (note: string) => void;
  logMood: () => Promise<void>;
  loadHistory: (page?: number) => Promise<void>;
}

/**
 * Hook for mood logging with optimistic updates.
 * UI updates immediately; backend sync happens in background.
 * @param userId - Current user's ID
 */
export function useMoodLog(userId: string): UseMoodLogReturn {
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [moodScore, setMoodScore] = useState(5);
  const [note, setNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCrisisDetected, setIsCrisisDetected] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<{ message: string; helpline: string } | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const logMood = useCallback(async () => {
    if (!selectedEmotion) return;

    // Optimistic UI update — add to history immediately
    const optimisticLog: MoodLog = {
      id: `temp-${Date.now()}`,
      userId,
      moodScore,
      emotion: selectedEmotion,
      note,
      createdAt: new Date().toISOString(),
    };
    setMoodHistory((prev) => [optimisticLog, ...prev]);
    setIsLogging(true);
    setHasError(false);
    setIsCrisisDetected(false);
    setCrisisMessage(null);

    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": userId },
        body: JSON.stringify({ userId, moodScore, emotion: selectedEmotion, note }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log mood");
      }

      if (data.isCrisisDetected) {
        setIsCrisisDetected(true);
        setCrisisMessage(data.crisis);
      }

      // Replace optimistic entry with real one
      if (data.moodLog) {
        setMoodHistory((prev) =>
          prev.map((log) => (log.id === optimisticLog.id ? data.moodLog : log))
        );
      }

      // Reset form
      setNote("");
    } catch (error) {
      // Revert optimistic update on failure
      setMoodHistory((prev) => prev.filter((log) => log.id !== optimisticLog.id));
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : "Failed to log mood");
    } finally {
      setIsLogging(false);
    }
  }, [userId, moodScore, selectedEmotion, note]);

  const loadHistory = useCallback(
    async (page: number = 1) => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`/api/mood?userId=${userId}&page=${page}`);
        const data = await response.json();
        if (response.ok) {
          setMoodHistory(data.data || []);
        }
      } catch {
        setHasError(true);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [userId]
  );

  return {
    selectedEmotion, moodScore, note, isLogging, hasError, errorMessage,
    isCrisisDetected, crisisMessage, moodHistory, isLoadingHistory,
    setSelectedEmotion, setMoodScore, setNote, logMood, loadHistory,
  };
}
