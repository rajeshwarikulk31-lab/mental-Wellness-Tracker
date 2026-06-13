/**
 * @fileoverview Insights dashboard — lazy-loaded with memoized charts.
 * Displays 7-day mood trends, emotion distribution, and top stressors.
 * Canvas-based charts for performance.
 */

"use client";
import React, { useMemo, useRef, useEffect } from "react";
import { EMOTION_ICONS } from "@/constants/constants";
import type { Emotion } from "@/constants/constants";
import type { InsightsData, DailyAggregate } from "@/types";

interface InsightsDashboardProps {
  insights: InsightsData | null;
  isLoading: boolean;
  hasError: boolean;
  onRefresh: () => void;
}

/**
 * Analytics dashboard with mood trend chart and emotion breakdown.
 * All visual data paired with text labels (WCAG colour independence).
 */
export function InsightsDashboard({
  insights,
  isLoading,
  hasError,
  onRefresh,
}: InsightsDashboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** Memoized trend description to avoid re-renders */
  const trendDescription = useMemo(() => {
    if (!insights) return "";
    const trendMap = {
      improving: "📈 Your mood is trending upward — great progress!",
      stable: "📊 Your mood has been steady this week.",
      declining: "📉 Your mood has dipped recently. Let's work on that together.",
    };
    return trendMap[insights.overallTrend];
  }, [insights]);

  // Draw mood trend chart on canvas
  useEffect(() => {
    if (!canvasRef.current || !insights?.dailyAggregates.length) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const aggregates = insights.dailyAggregates;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "rgba(124, 92, 252, 0.05)";
    ctx.fillRect(0, 0, width, height);

    if (aggregates.length < 2) return;

    const xStep = (width - padding * 2) / (aggregates.length - 1);
    const yScale = (height - padding * 2) / 10;

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i += 2) {
      const y = height - padding - i * yScale;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw gradient line
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#7c5cfc");
    gradient.addColorStop(1, "#3ecfcf");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.beginPath();

    aggregates.forEach((agg, i) => {
      const x = padding + i * xStep;
      const y = height - padding - agg.avgMood * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw data points
    aggregates.forEach((agg, i) => {
      const x = padding + i * xStep;
      const y = height - padding - agg.avgMood * yScale;
      ctx.fillStyle = "#7c5cfc";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [insights]);

  if (isLoading) {
    return (
      <div className="insights-loading" aria-busy="true">
        <div className="skeleton skeleton-chart" />
        <div className="skeleton skeleton-stats" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="insights-error" role="alert">
        <p>Couldn&apos;t load your insights right now.</p>
        <button className="btn-secondary" onClick={onRefresh}>
          Try again
        </button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="insights-empty">
        <p>No data yet. Start logging your mood to see insights! 📊</p>
      </div>
    );
  }

  return (
    <section className="insights-dashboard" aria-label="Weekly mood insights">
      <div className="insights-header">
        <h2>Your 7-Day Insights</h2>
        <button className="btn-icon" onClick={onRefresh} aria-label="Refresh insights">
          🔄
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-value">{insights.moodAverage}</span>
          <span className="stat-label">Avg Mood</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {EMOTION_ICONS[insights.dominantEmotion]} {insights.dominantEmotion}
          </span>
          <span className="stat-label">Dominant Feeling</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{insights.dailyAggregates.length}</span>
          <span className="stat-label">Days Tracked</span>
        </div>
      </div>

      {/* Trend description */}
      <div className="trend-banner">
        <p>{trendDescription}</p>
      </div>

      {/* Mood chart */}
      <div className="chart-container">
        <h3>Mood Trend</h3>
        <canvas
          ref={canvasRef}
          width={600}
          height={250}
          className="mood-chart"
          aria-label={`Mood trend chart showing ${insights.overallTrend} trend over ${insights.dailyAggregates.length} days`}
          role="img"
        />
      </div>

      {/* Top stressors */}
      {insights.topStressors.length > 0 && (
        <div className="stressors-section">
          <h3>⚡ Patterns Detected</h3>
          <ul className="stressor-list">
            {insights.topStressors.map((stressor, i) => (
              <li key={i} className="stressor-item">
                {stressor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
