/**
 * @fileoverview Journal management hook with debounced save and optimistic updates.
 * Triggers AI analysis only on explicit save, not on every keystroke.
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { JOURNAL_MAX_CHARS, DEBOUNCE_DELAY_MS } from "@/constants/constants";
import type { Emotion, SupportedExam } from "@/constants/constants";
import type { JournalEntry, AIResponse } from "@/types";

interface UseJournalReturn {
  content: string;
  setContent: (value: string) => void;
  charCount: number;
  isOverLimit: boolean;
  isSaving: boolean;
  hasError: boolean;
  errorMessage: string | null;
  aiAnalysis: AIResponse | null;
  isCrisisDetected: boolean;
  crisisMessage: { message: string; helpline: string } | null;
  saveEntry: (mood: number, emotion: Emotion, exam: SupportedExam) => Promise<void>;
  entries: JournalEntry[];
  isLoadingEntries: boolean;
  loadEntries: (page?: number) => Promise<void>;
}

/**
 * Hook for journal entry management.
 * Debounces saves, handles AI analysis, and crisis detection.
 * @param userId - Current user's ID
 */
export function useJournal(userId: string): UseJournalReturn {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIResponse | null>(null);
  const [isCrisisDetected, setIsCrisisDetected] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<{ message: string; helpline: string } | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const charCount = content.length;
  const isOverLimit = charCount > JOURNAL_MAX_CHARS;

  const saveEntry = useCallback(
    async (mood: number, emotion: Emotion, exam: SupportedExam) => {
      if (!content.trim() || isOverLimit) return;

      setIsSaving(true);
      setHasError(false);
      setErrorMessage(null);
      setIsCrisisDetected(false);
      setCrisisMessage(null);

      try {
        const response = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-session-id": userId },
          body: JSON.stringify({ content, mood, emotion, exam, userId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save journal entry");
        }

        if (data.isCrisisDetected) {
          setIsCrisisDetected(true);
          setCrisisMessage(data.crisis);
        } else if (data.analysis) {
          setAiAnalysis({
            content: data.analysis,
            isCrisisDetected: false,
            suggestedAction: null,
            timestamp: new Date().toISOString(),
          });
        }

        setContent("");
      } catch (error) {
        setHasError(true);
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong. Please try again."
        );
      } finally {
        setIsSaving(false);
      }
    },
    [content, isOverLimit, userId]
  );

  const loadEntries = useCallback(
    async (page: number = 1) => {
      setIsLoadingEntries(true);
      try {
        const response = await fetch(`/api/journal?userId=${userId}&page=${page}`);
        const data = await response.json();
        if (response.ok) {
          setEntries(data.data || []);
        }
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoadingEntries(false);
      }
    },
    [userId]
  );

  return {
    content, setContent, charCount, isOverLimit, isSaving, hasError,
    errorMessage, aiAnalysis, isCrisisDetected, crisisMessage,
    saveEntry, entries, isLoadingEntries, loadEntries,
  };
}
