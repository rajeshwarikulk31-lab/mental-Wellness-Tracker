/**
 * @fileoverview AI response panel with streaming support.
 * aria-live="polite" for streaming, aria-busy during loading.
 * Typewriter effect respects prefers-reduced-motion.
 */

"use client";
import React from 'react';


import type { AIResponse } from "@/types";

interface AIResponsePanelProps {
  analysis: AIResponse | null;
  streamingContent: string;
  isStreaming: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Accessible AI response display with live region for streaming.
 * Shows analysis results, streaming text, or loading state.
 */
export function AIResponsePanel({
  analysis,
  streamingContent,
  isStreaming,
  isLoading,
  hasError,
  errorMessage,
}: AIResponsePanelProps) {
  const displayContent = streamingContent || analysis?.content || null;

  return (
    <section className="ai-response-panel" aria-label="AI analysis response">
      <h3 className="ai-response-title">
        <span aria-hidden="true">🤖</span> MindEase Analysis
      </h3>

      <div
        className="ai-response-content"
        aria-live="polite"
        aria-busy={isLoading || isStreaming}
        aria-atomic="false"
        aria-relevant="additions text"
      >
        {isLoading && !isStreaming && (
          <div className="typing-indicator" aria-label="MindEase is thinking">
            <span className="typing-dot" aria-hidden="true" />
            <span className="typing-dot" aria-hidden="true" />
            <span className="typing-dot" aria-hidden="true" />
          </div>
        )}

        {displayContent && (
          <div className="ai-response-text fade-in">
            {displayContent}
            {isStreaming && <span className="cursor-blink" aria-hidden="true">▊</span>}
          </div>
        )}

        {!displayContent && !isLoading && !isStreaming && (
          <p className="ai-response-placeholder">
            Your personalised analysis will appear here after you save your journal entry.
          </p>
        )}

        {hasError && (
          <div className="ai-response-error" role="alert">
            <span aria-hidden="true">⚠️</span>
            {errorMessage || "Something went wrong. Please try again."}
          </div>
        )}

        {analysis?.suggestedAction && !isStreaming && (
          <div className="ai-suggested-action">
            <strong>✅ Your 30-minute action:</strong>
            <p>{analysis.suggestedAction}</p>
          </div>
        )}
      </div>
    </section>
  );
}
