/**
 * @fileoverview Mindfulness page — guided exercises with timer.
 * Adaptive mindfulness based on current emotional state.
 */

"use client";
import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { MindfulnessTimer } from "@/components/MindfulnessTimer";
import { MoodSelector } from "@/components/MoodSelector";
import { useSession } from "@/hooks/useSession";
import { useMindfulness } from "@/hooks/useMindfulness";
import type { Emotion } from "@/constants/constants";

/**
 * Mindfulness page — select current emotion, then receive
 * a guided exercise tailored to that emotional state.
 */
export default function MindfulnessPage() {
  useSession();
  const mindfulness = useMindfulness();
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [moodScore, setMoodScore] = useState(5);

  const handleStart = () => {
    if (emotion) {
      mindfulness.startExercise(emotion);
    }
  };

  return (
    <div className="page-content">
      <Header />
      <main className="container">
        <h2 className="section-title">🧘 Mindfulness</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          Take a moment to breathe. Choose how you&apos;re feeling, and we&apos;ll create
          a personalised exercise just for you.
        </p>

        {!mindfulness.isActive && !mindfulness.exercise && (
          <section className="page-section card">
            <MoodSelector
              selectedEmotion={emotion}
              moodScore={moodScore}
              onEmotionSelect={setEmotion}
              onMoodScoreChange={setMoodScore}
            />
          </section>
        )}

        <section className="page-section">
          <MindfulnessTimer
            exercise={mindfulness.exercise}
            isActive={mindfulness.isActive}
            isPaused={mindfulness.isPaused}
            isLoading={mindfulness.isLoading}
            timeRemaining={mindfulness.timeRemaining}
            currentStep={mindfulness.currentStep}
            selectedDuration={mindfulness.selectedDuration}
            onDurationChange={mindfulness.setSelectedDuration}
            onStart={handleStart}
            onPause={mindfulness.pauseExercise}
            onResume={mindfulness.resumeExercise}
            onStop={mindfulness.stopExercise}
            onNextStep={mindfulness.nextStep}
          />
        </section>

        {mindfulness.hasError && (
          <div className="ai-response-error" role="alert">
            Couldn&apos;t generate exercise. Please try again.
          </div>
        )}
      </main>
      <Navbar />
    </div>
  );
}
