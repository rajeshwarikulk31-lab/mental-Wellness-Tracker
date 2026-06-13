/**
 * @fileoverview Mood selector component — emotion grid + mood slider.
 * Emotion state conveyed through icon + text label (never colour alone).
 * All touch targets ≥ 44×44px. Fully keyboard accessible.
 */

"use client";
import React from 'react';


import { EMOTIONS, EMOTION_ICONS, MOOD_SCALE } from "@/constants/constants";
import type { Emotion } from "@/constants/constants";

interface MoodSelectorProps {
  selectedEmotion: Emotion | null;
  moodScore: number;
  onEmotionSelect: (emotion: Emotion) => void;
  onMoodScoreChange: (score: number) => void;
}

/**
 * Accessible mood selector with emotion grid and score slider.
 * Icons paired with text labels — never colour-only communication.
 */
export function MoodSelector({
  selectedEmotion,
  moodScore,
  onEmotionSelect,
  onMoodScoreChange,
}: MoodSelectorProps) {
  return (
    <div className="mood-selector">
      <fieldset className="emotion-fieldset">
        <legend className="emotion-legend">How are you feeling right now?</legend>
        <div className="emotion-grid" role="radiogroup" aria-label="Select your current emotion">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion}
              className={`emotion-chip ${selectedEmotion === emotion ? "emotion-chip--selected" : ""}`}
              onClick={() => onEmotionSelect(emotion)}
              role="radio"
              aria-checked={selectedEmotion === emotion}
              aria-label={`Feeling ${emotion}`}
              type="button"
            >
              <span className="emotion-icon" aria-hidden="true">
                {EMOTION_ICONS[emotion]}
              </span>
              <span className="emotion-label">{emotion}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mood-slider-container">
        <label htmlFor="mood-score" className="mood-slider-label">
          Mood Score: <strong>{moodScore}</strong>/10
        </label>
        <input
          id="mood-score"
          type="range"
          min={MOOD_SCALE.MIN}
          max={MOOD_SCALE.MAX}
          value={moodScore}
          onChange={(e) => onMoodScoreChange(parseInt(e.target.value, 10))}
          className="mood-slider"
          aria-valuemin={MOOD_SCALE.MIN}
          aria-valuemax={MOOD_SCALE.MAX}
          aria-valuenow={moodScore}
          aria-valuetext={`Mood score ${moodScore} out of 10`}
        />
        <div className="mood-slider-labels">
          <span>😔 Low</span>
          <span>😊 Great</span>
        </div>
      </div>
    </div>
  );
}
