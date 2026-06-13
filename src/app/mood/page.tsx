/**
 * @fileoverview Mood logging page with history and emotional pattern tracking.
 */

"use client";
import React, { useEffect } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { MoodSelector } from "@/components/MoodSelector";
import { CrisisModal } from "@/components/CrisisModal";
import { useSession } from "@/hooks/useSession";
import { useMoodLog } from "@/hooks/useMoodLog";
import { EMOTION_ICONS } from "@/constants/constants";

/**
 * Mood page — log current mood with optimistic updates and view history.
 */
export default function MoodPage() {
  const { userId } = useSession();
  const mood = useMoodLog(userId);

  useEffect(() => {
    if (userId) mood.loadHistory();
  }, [userId]);

  return (
    <div className="page-content">
      <Header />
      <main className="container">
        <h2 className="section-title">🎭 Mood Logger</h2>

        <section className="page-section card">
          <MoodSelector
            selectedEmotion={mood.selectedEmotion}
            moodScore={mood.moodScore}
            onEmotionSelect={mood.setSelectedEmotion}
            onMoodScoreChange={mood.setMoodScore}
          />

          <div style={{ marginTop: "var(--space-6)" }}>
            <label htmlFor="mood-note">Add a quick note (optional)</label>
            <input
              id="mood-note"
              type="text"
              value={mood.note}
              onChange={(e) => mood.setNote(e.target.value)}
              placeholder="e.g., Just finished a mock test..."
              aria-describedby="mood-note-hint"
            />
            <p id="mood-note-hint" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
              A brief context for this mood entry
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={mood.logMood}
            disabled={!mood.selectedEmotion || mood.isLogging}
            aria-busy={mood.isLogging}
            style={{ marginTop: "var(--space-6)", width: "100%" }}
          >
            {mood.isLogging ? "Logging..." : "Log Mood 📊"}
          </button>

          {mood.hasError && (
            <p role="alert" style={{ color: "var(--color-accent-danger)", marginTop: "var(--space-3)" }}>
              {mood.errorMessage}
            </p>
          )}
        </section>

        {/* Mood history */}
        <section className="page-section" aria-label="Mood history">
          <h3>Recent Mood Logs</h3>
          {mood.isLoadingHistory && <div className="skeleton" style={{ height: "200px" }} aria-busy="true" />}
          {!mood.isLoadingHistory && mood.moodHistory.length === 0 && (
            <p style={{ color: "var(--color-text-muted)" }}>No mood entries yet. Start logging!</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {mood.moodHistory.map((log) => (
              <div key={log.id} className="card" style={{ padding: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <span style={{ fontSize: "var(--font-size-2xl)" }} aria-hidden="true">
                  {EMOTION_ICONS[log.emotion]}
                </span>
                <div style={{ flex: 1 }}>
                  <strong>{log.emotion}</strong> — {log.moodScore}/10
                  {log.note && <p style={{ margin: 0, fontSize: "var(--font-size-sm)" }}>{log.note}</p>}
                </div>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Navbar />

      <CrisisModal
        isOpen={mood.isCrisisDetected}
        message={mood.crisisMessage?.message || ""}
        onClose={() => {}}
      />
    </div>
  );
}
