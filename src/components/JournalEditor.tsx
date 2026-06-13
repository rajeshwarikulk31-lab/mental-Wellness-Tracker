/**
 * @fileoverview Journal editor with character counter and save button.
 * Analysis triggered on save only — not on every keystroke (debounced).
 * 16px min font in textarea to prevent iOS zoom.
 */

"use client";
import React from 'react';


import { JOURNAL_MAX_CHARS } from "@/constants/constants";

interface JournalEditorProps {
  content: string;
  charCount: number;
  isOverLimit: boolean;
  isSaving: boolean;
  onContentChange: (value: string) => void;
  onSave: () => void;
}

/**
 * Accessible journal textarea with live character count.
 * Paired label, 16px font, and save-on-submit (not per keystroke).
 */
export function JournalEditor({
  content,
  charCount,
  isOverLimit,
  isSaving,
  onContentChange,
  onSave,
}: JournalEditorProps) {
  return (
    <div className="journal-editor">
      <label htmlFor="journal-entry" className="journal-label">
        📝 What&apos;s on your mind today?
      </label>
      <p className="journal-hint" id="journal-hint">
        Write freely about your day, exam prep, feelings — anything you want to express.
        This is your safe space.
      </p>
      <textarea
        id="journal-entry"
        className={`journal-textarea ${isOverLimit ? "journal-textarea--error" : ""}`}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Today I felt..."
        rows={8}
        aria-describedby="journal-hint journal-char-count"
        aria-invalid={isOverLimit}
        maxLength={JOURNAL_MAX_CHARS + 100}
      />
      <div className="journal-footer">
        <span
          id="journal-char-count"
          className={`char-count ${isOverLimit ? "char-count--error" : ""}`}
          aria-live="polite"
        >
          {charCount}/{JOURNAL_MAX_CHARS} characters
        </span>
        <button
          className="btn-primary journal-save-btn"
          onClick={onSave}
          disabled={isSaving || isOverLimit || charCount === 0}
          aria-busy={isSaving}
        >
          {isSaving ? "Saving..." : "Save & Analyze ✨"}
        </button>
      </div>
    </div>
  );
}
