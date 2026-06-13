/**
 * @fileoverview Exam selector component.
 * Dropdown/cards for SUPPORTED_EXAMS selection.
 */

"use client";
import React from 'react';


import { SUPPORTED_EXAMS } from "@/constants/constants";
import type { SupportedExam } from "@/constants/constants";

interface ExamSelectorProps {
  selectedExam: SupportedExam | null;
  onSelect: (exam: SupportedExam) => void;
}

/** Exam-specific descriptions for onboarding context */
const EXAM_DESCRIPTIONS: Record<SupportedExam, string> = {
  NEET: "Medical entrance — Biology, Physics, Chemistry",
  JEE: "Engineering entrance — Physics, Chemistry, Maths",
  CUET: "University entrance — Multiple subjects",
  CAT: "MBA entrance — Verbal, Quant, Logic",
  GATE: "Postgrad engineering — Technical subjects",
  UPSC: "Civil services — Prelims, Mains, Interview",
};

/**
 * Exam selection cards for onboarding.
 * Each card has a descriptive label explaining the exam.
 */
export function ExamSelector({ selectedExam, onSelect }: ExamSelectorProps) {
  return (
    <fieldset className="exam-selector">
      <legend className="exam-legend">Which exam are you preparing for?</legend>
      <div className="exam-grid" role="radiogroup" aria-label="Select your target exam">
        {SUPPORTED_EXAMS.map((exam) => (
          <button
            key={exam}
            className={`exam-card ${selectedExam === exam ? "exam-card--selected" : ""}`}
            onClick={() => onSelect(exam)}
            role="radio"
            aria-checked={selectedExam === exam}
            type="button"
          >
            <span className="exam-name">{exam}</span>
            <span className="exam-description">{EXAM_DESCRIPTIONS[exam]}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
