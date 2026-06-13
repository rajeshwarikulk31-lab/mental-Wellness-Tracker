/**
 * @fileoverview Home / Onboarding page.
 * Exam selection → quick mood check → navigate to features.
 * Problem statement keywords: journaling, mood logs, stress triggers,
 * emotional patterns, coping strategies, mindfulness, empathetic companion.
 */

"use client";
import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { ExamSelector } from "@/components/ExamSelector";
import { MoodSelector } from "@/components/MoodSelector";
import { useSession } from "@/hooks/useSession";
import { useMoodLog } from "@/hooks/useMoodLog";
import { CrisisModal } from "@/components/CrisisModal";
import { APP_NAME } from "@/constants/constants";
import type { Emotion, SupportedExam } from "@/constants/constants";
import Link from "next/link";

/**
 * Home page — onboarding flow and feature hub.
 * First visit: select exam → log initial mood → enter app.
 * Returning users: feature navigation cards.
 */
export default function HomePage() {
  const { userId, isOnboarded, selectedExam, completeOnboarding } = useSession();
  const { isCrisisDetected, crisisMessage, setSelectedEmotion, selectedEmotion, moodScore, setMoodScore, logMood } = useMoodLog(userId);
  const [onboardingExam, setOnboardingExam] = useState<SupportedExam | null>(null);

  const handleGetStarted = async () => {
    if (onboardingExam && selectedEmotion) {
      await logMood();
      completeOnboarding(onboardingExam);
    }
  };

  // Onboarding view
  if (!isOnboarded) {
    return (
      <div className="page-content">
        <main className="container">
          <div className="hero-section">
            <h1 className="hero-title">
              <span className="gradient-text">{APP_NAME}</span>
            </h1>
            <p className="hero-subtitle">
              Your AI-powered mental wellness companion for exam preparation.
              Track your mood, journal your thoughts, and get personalised
              coping strategies — all in one place. 🌟
            </p>
          </div>

          <section className="page-section fade-in" aria-label="Exam selection">
            <ExamSelector
              selectedExam={onboardingExam}
              onSelect={setOnboardingExam}
            />
          </section>

          {onboardingExam && (
            <section className="page-section fade-in" aria-label="Initial mood check">
              <div className="card">
                <h3>Quick mood check ✨</h3>
                <p>How are you feeling right now?</p>
                <MoodSelector
                  selectedEmotion={selectedEmotion}
                  moodScore={moodScore}
                  onEmotionSelect={setSelectedEmotion}
                  onMoodScoreChange={setMoodScore}
                />
              </div>
            </section>
          )}

          {onboardingExam && selectedEmotion && (
            <div className="onboarding-cta fade-in" style={{ textAlign: "center" }}>
              <button className="btn-primary" onClick={handleGetStarted}>
                Begin Your Wellness Journey 🚀
              </button>
            </div>
          )}
        </main>

        <CrisisModal
          isOpen={isCrisisDetected}
          message={crisisMessage?.message || ""}
          onClose={() => {}}
        />
      </div>
    );
  }

  // Main hub view
  return (
    <div className="page-content">
      <Header />
      <main className="container">
        <section className="page-section" aria-label="Welcome back">
          <h2>
            Welcome back! <span className="gradient-text">✨</span>
          </h2>
          <p>Preparing for {selectedExam}. You&apos;re doing great — let&apos;s check in.</p>
        </section>

        <section className="page-section" aria-label="Quick actions">
          <div className="exam-grid">
            <Link href="/journal" className="exam-card" style={{ textDecoration: "none" }}>
              <span className="exam-name">📝 Journal</span>
              <span className="exam-description">
                Write about your day and get AI-powered insights into hidden stress triggers
              </span>
            </Link>
            <Link href="/mood" className="exam-card" style={{ textDecoration: "none" }}>
              <span className="exam-name">🎭 Mood Log</span>
              <span className="exam-description">
                Track your emotional patterns and detect trends over time
              </span>
            </Link>
            <Link href="/companion" className="exam-card" style={{ textDecoration: "none" }}>
              <span className="exam-name">💬 AI Companion</span>
              <span className="exam-description">
                Chat with MindEase — your empathetic wellness companion
              </span>
            </Link>
            <Link href="/insights" className="exam-card" style={{ textDecoration: "none" }}>
              <span className="exam-name">📊 Insights</span>
              <span className="exam-description">
                7-day emotional pattern analysis with coping strategies
              </span>
            </Link>
            <Link href="/mindfulness" className="exam-card" style={{ textDecoration: "none" }}>
              <span className="exam-name">🧘 Mindfulness</span>
              <span className="exam-description">
                Guided breathing and mindfulness exercises for stress relief
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Navbar />
    </div>
  );
}
