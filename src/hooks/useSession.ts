/**
 * @fileoverview Session management hook with auto-expiry.
 * Uses SESSION_TIMEOUT_MS constant. Generates userId on first visit.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SESSION_TIMEOUT_MS } from "@/constants/constants";
import type { SupportedExam } from "@/constants/constants";
import { v4 as uuidv4 } from "uuid";

interface UseSessionReturn {
  isSessionActive: boolean;
  selectedExam: SupportedExam | null;
  setSelectedExam: (exam: SupportedExam) => void;
  isOnboarded: boolean;
  completeOnboarding: (exam: SupportedExam) => void;
  resetSession: () => void;
}

/**
 * Hook for session management with timeout-based expiry.
 * Persists userId and exam preference in localStorage.
 */
export function useSession(): UseSessionReturn {
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [selectedExam, setSelectedExam] = useState<SupportedExam | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** Resets the session expiry timer */
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsSessionActive(false);
    }, SESSION_TIMEOUT_MS);
  }, []);

  /** Checks for an active session on mount */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const stored = localStorage.getItem("mindease_session");
        if (!stored) throw new Error("No session");
        
        const session = JSON.parse(stored);
        
        const elapsed = Date.now() - session.lastActive;
        if (elapsed < SESSION_TIMEOUT_MS) {
          setSelectedExam(session.exam);
          setIsOnboarded(true);
          resetTimer();
          return;
        }
      } catch {
        // Fall through to inactive session
      }

      setIsSessionActive(false);
    };

    checkSession();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  /** Persists session state to localStorage */
  const persistSession = useCallback(
    (exam: SupportedExam | null) => {
      localStorage.setItem(
        "mindease_session",
        JSON.stringify({ exam, lastActive: Date.now() })
      );
      resetTimer();
    },
    [resetTimer]
  );

  const completeOnboarding = useCallback(
    (exam: SupportedExam) => {
      setSelectedExam(exam);
      setIsOnboarded(true);
      persistSession(exam);
    },
    [persistSession]
  );

  const resetSession = useCallback(() => {
    localStorage.removeItem("mindease_session");
    setSelectedExam(null);
    setIsOnboarded(false);
    setIsSessionActive(true);
  }, []);

  // Update lastActive on any user interaction
  useEffect(() => {
    const updateActivity = () => {
      if (selectedExam) {
        persistSession(selectedExam);
      }
    };
    window.addEventListener("click", updateActivity);
    window.addEventListener("keydown", updateActivity);
    return () => {
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [selectedExam, persistSession]);

  return {
    isSessionActive, selectedExam, setSelectedExam,
    isOnboarded, completeOnboarding, resetSession,
  };
}
