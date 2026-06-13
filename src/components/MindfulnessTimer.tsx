/**
 * @fileoverview Mindfulness timer with breathing animation.
 * Circular progress, step navigation, respects prefers-reduced-motion.
 */

"use client";
import React from 'react';


import { MINDFULNESS_DURATION_SECONDS } from "@/constants/constants";
import type { MindfulnessExercise } from "@/types";

type DurationKey = keyof typeof MINDFULNESS_DURATION_SECONDS;

interface MindfulnessTimerProps {
  exercise: MindfulnessExercise | null;
  isActive: boolean;
  isPaused: boolean;
  isLoading: boolean;
  timeRemaining: number;
  currentStep: number;
  selectedDuration: DurationKey;
  onDurationChange: (d: DurationKey) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNextStep: () => void;
}

/** Formats seconds to MM:SS display */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Mindfulness timer with circular progress ring and step list.
 * Breathing animation respects prefers-reduced-motion.
 */
export function MindfulnessTimer({
  exercise,
  isActive,
  isPaused,
  isLoading,
  timeRemaining,
  currentStep,
  selectedDuration,
  onDurationChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onNextStep,
}: MindfulnessTimerProps) {
  const totalDuration = MINDFULNESS_DURATION_SECONDS[selectedDuration];
  const progress = isActive ? (totalDuration - timeRemaining) / totalDuration : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <section className="mindfulness-timer" aria-label="Guided mindfulness exercise">
      {!isActive && !exercise && (
        <div className="mindfulness-setup">
          <h3>🧘 Choose your duration</h3>
          <div className="duration-selector" role="radiogroup" aria-label="Exercise duration">
            {(Object.keys(MINDFULNESS_DURATION_SECONDS) as DurationKey[]).map((key) => (
              <button
                key={key}
                className={`duration-chip ${selectedDuration === key ? "duration-chip--selected" : ""}`}
                onClick={() => onDurationChange(key)}
                role="radio"
                aria-checked={selectedDuration === key}
              >
                {Math.round(MINDFULNESS_DURATION_SECONDS[key] / 60)} min
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={onStart}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Generating exercise..." : "Start Exercise 🌿"}
          </button>
        </div>
      )}

      {isActive && (
        <div className="mindfulness-active">
          <h3>{exercise?.title || "Mindfulness Exercise"}</h3>

          {/* Circular progress ring */}
          <div className={`timer-ring-container ${!isPaused ? "breathing" : ""}`}>
            <svg className="timer-ring" viewBox="0 0 200 200" aria-hidden="true">
              <circle
                className="timer-ring-bg"
                cx="100" cy="100" r="90"
                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"
              />
              <circle
                className="timer-ring-progress"
                cx="100" cy="100" r="90"
                fill="none" stroke="url(#timerGradient)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 100 100)"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c5cfc" />
                  <stop offset="100%" stopColor="#3ecfcf" />
                </linearGradient>
              </defs>
            </svg>
            <div className="timer-display" aria-live="polite" aria-atomic="true">
              <span className="timer-time">{formatTime(timeRemaining)}</span>
              <span className="timer-status">{isPaused ? "Paused" : "Breathe..."}</span>
            </div>
          </div>

          {/* Current step */}
          {exercise && exercise.steps.length > 0 && (
            <div className="mindfulness-step" aria-live="polite">
              <p className="step-counter">
                Step {currentStep + 1} of {exercise.steps.length}
              </p>
              <p className="step-instruction">{exercise.steps[currentStep]}</p>
              {currentStep < exercise.steps.length - 1 && (
                <button className="btn-secondary" onClick={onNextStep}>
                  Next Step →
                </button>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="mindfulness-controls">
            {isPaused ? (
              <button className="btn-primary" onClick={onResume} aria-label="Resume exercise">
                ▶ Resume
              </button>
            ) : (
              <button className="btn-secondary" onClick={onPause} aria-label="Pause exercise">
                ⏸ Pause
              </button>
            )}
            <button className="btn-danger" onClick={onStop} aria-label="Stop exercise">
              ⏹ Stop
            </button>
          </div>
        </div>
      )}

      {!isActive && exercise && (
        <div className="mindfulness-complete fade-in">
          <h3>🎉 Well done!</h3>
          <p>You completed your mindfulness exercise. Take a moment to notice how you feel.</p>
          <button className="btn-primary" onClick={onStart}>
            Start Another 🌿
          </button>
        </div>
      )}
    </section>
  );
}
