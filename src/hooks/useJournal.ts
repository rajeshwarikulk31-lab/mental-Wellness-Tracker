"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { JournalEntry } from "@/types";
import type { SupportedExam, Emotion } from "@/constants/constants";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useJournal() {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCrisisDetected, setIsCrisisDetected] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<{ message: string; helpline: string } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // SWR handles fetching and caching the history
  const { data, mutate, error } = useSWR('/api/journal', fetcher);
  const history: JournalEntry[] = React.useMemo(() => data?.data || [], [data?.data]);
  const isLoadingHistory = !data && !error;

  const isOverLimit = content.length > 5000;
  const charCount = content.length;

  const saveEntry = useCallback(async (mood: number, emotion: Emotion, exam: SupportedExam) => {
    if (!content.trim() || isOverLimit) return;

    setIsSaving(true);
    setHasError(false);
    setIsCrisisDetected(false);
    setCrisisMessage(null);
    setAiAnalysis(null);

    // Optimistic UI update
    const optimisticEntry = {
      id: `temp-${Date.now()}`,
      userId: "optimistic",
      content,
      mood,
      emotion,
      exam,
      aiAnalysis: "Analyzing your entry...",
      isCrisisDetected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      encryptedContent: "",
    };
    
    mutate({ data: [optimisticEntry, ...history] }, false);

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mood, emotion, exam }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to save journal entry");
      }

      if (resData.isCrisisDetected) {
        setIsCrisisDetected(true);
        setCrisisMessage(resData.crisis);
      }
      
      if (resData.entry?.aiAnalysis) {
        setAiAnalysis(resData.entry.aiAnalysis);
      }

      // Sync with real data
      mutate();
      setContent("");
      return resData;
    } catch (err) {
      mutate(); // Revert on failure
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save entry");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [content, isOverLimit, history, mutate]);

  const loadHistory = useCallback(async (page: number = 1) => {
    await mutate();
  }, [mutate]);

  return {
    content, setContent, charCount, isSaving, hasError, errorMessage,
    isCrisisDetected, crisisMessage, history, isLoadingHistory,
    isOverLimit, saveEntry, loadHistory, aiAnalysis,
  };
}
