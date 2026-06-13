/**
 * @fileoverview Journal page — write entries with GenAI analysis.
 * Supports daily open-ended journaling with AI-powered stress trigger detection.
 */

"use client";
import React from 'react';


import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { JournalEditor } from "@/components/JournalEditor";
import { MoodSelector } from "@/components/MoodSelector";
import { AIResponsePanel } from "@/components/AIResponsePanel";
import { CrisisModal } from "@/components/CrisisModal";
import { useJournal } from "@/hooks/useJournal";
import { useSession } from "@/hooks/useSession";
import { useState } from "react";
import type { Emotion } from "@/constants/constants";

/**
 * Journal page — combines mood selection, journal editor, and AI analysis.
 * Analysis triggered on save (not per keystroke) for efficiency.
 */
export default function JournalPage() {
  const { selectedExam } = useSession();
  const journal = useJournal();
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [moodScore, setMoodScore] = useState(5);

  const handleSave = () => {
    if (emotion && selectedExam) {
      journal.saveEntry(moodScore, emotion, selectedExam);
    }
  };

  return (
    <div className="page-content">
      <Header />
      <main className="container">
        <h2 className="section-title">📝 Daily Journal</h2>

        <section className="page-section card">
          <MoodSelector
            selectedEmotion={emotion}
            moodScore={moodScore}
            onEmotionSelect={setEmotion}
            onMoodScoreChange={setMoodScore}
          />
        </section>

        <section className="page-section card">
          <JournalEditor
            content={journal.content}
            charCount={journal.charCount}
            isOverLimit={journal.isOverLimit}
            isSaving={journal.isSaving}
            onContentChange={journal.setContent}
            onSave={handleSave}
          />
        </section>

        <section className="page-section">
          <AIResponsePanel
            analysis={journal.aiAnalysis ? { content: journal.aiAnalysis, isCrisisDetected: journal.isCrisisDetected, suggestedAction: null, timestamp: '' } : null}
            streamingContent=""
            isStreaming={false}
            isLoading={journal.isSaving}
            hasError={journal.hasError}
            errorMessage={journal.errorMessage}
          />
        </section>

        {/* Previous entries */}
        {journal.history.length > 0 && (
          <section className="page-section" aria-label="Previous journal entries">
            <h3>Previous Entries</h3>
            {journal.history.map((entry) => (
              <article key={entry.id} className="card" style={{ marginBottom: "var(--space-4)" }}>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                  {new Date(entry.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </p>
                <p>{entry.content}</p>
                {entry.aiAnalysis && (
                  <div className="ai-suggested-action">
                    <strong>AI Analysis:</strong>
                    <p>{entry.aiAnalysis}</p>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
      <Navbar />

      <CrisisModal
        isOpen={journal.isCrisisDetected}
        message={journal.crisisMessage?.message || ""}
        onClose={() => {}}
      />
    </div>
  );
}
