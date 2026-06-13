/**
 * @fileoverview Mindfulness timer hook with duration options.
 * Uses MINDFULNESS_DURATION_SECONDS from constants.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MINDFULNESS_DURATION_SECONDS } from "@/constants/constants";
import type { Emotion } from "@/constants/constants";
import type { MindfulnessExercise } from "@/types";

type DurationKey = keyof typeof MINDFULNESS_DURATION_SECONDS;

interface UseMindfulnessReturn {
  exercise: MindfulnessExercise | null;
  isLoading: boolean;
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  currentStep: number;
  selectedDuration: DurationKey;
  hasError: boolean;
  setSelectedDuration: (duration: DurationKey) => void;
  startExercise: (emotion: Emotion) => Promise<void>;
  pauseExercise: () => void;
  resumeExercise: () => void;
  stopExercise: () => void;
  nextStep: () => void;
}

/**
 * Hook for guided mindfulness exercises with timer.
 */
export function useMindfulness(): UseMindfulnessReturn {
  const [exercise, setExercise] = useState<MindfulnessExercise | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<DurationKey>("SHORT");
  const [hasError, setHasError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, timeRemaining]);

  const startExercise = useCallback(
    async (emotion: Emotion) => {
      setIsLoading(true);
      setHasError(false);
      const duration = MINDFULNESS_DURATION_SECONDS[selectedDuration];

      try {
        const response = await fetch(
          `/api/mindfulness?emotion=${emotion}&duration=${duration}`
        );
        if (!response.ok) throw new Error("Failed to generate exercise");
        const data = await response.json();
        setExercise(data);
        setTimeRemaining(duration);
        setCurrentStep(0);
        setIsActive(true);
        setIsPaused(false);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDuration]
  );

  const pauseExercise = useCallback(() => setIsPaused(true), []);
  const resumeExercise = useCallback(() => setIsPaused(false), []);

  const stopExercise = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setCurrentStep(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const nextStep = useCallback(() => {
    if (exercise && currentStep < exercise.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [exercise, currentStep]);

  return {
    exercise, isLoading, isActive, isPaused, timeRemaining,
    currentStep, selectedDuration, hasError, setSelectedDuration,
    startExercise, pauseExercise, resumeExercise, stopExercise, nextStep,
  };
}
