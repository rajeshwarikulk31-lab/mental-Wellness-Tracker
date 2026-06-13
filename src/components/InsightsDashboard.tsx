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
  insights: (InsightsData & { aiAnalysis?: Record<string, unknown> }) | null;
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

      {/* AI Deep Insights */}
      {insights.aiAnalysis && (
        <div className="ai-insights-section card p-4 mt-6 bg-surface-elevated rounded-xl border border-border">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <span>🧠</span> AI Weekly Summary
          </h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            {insights.aiAnalysis.weekly_summary}
          </p>

          {insights.aiAnalysis.dominant_patterns && insights.aiAnalysis.dominant_patterns.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-text mb-2 text-sm uppercase tracking-wider">Recurring Patterns</h4>
              <ul className="list-disc pl-5 text-text-secondary">
                {insights.aiAnalysis.dominant_patterns.map((p: string, i: number) => (
                  <li key={i} className="mb-1">{p}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.aiAnalysis.improvement_areas && insights.aiAnalysis.improvement_areas.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-text mb-2 text-sm uppercase tracking-wider">Actionable Focus Areas</h4>
              <ul className="list-disc pl-5 text-text-secondary">
                {insights.aiAnalysis.improvement_areas.map((a: string, i: number) => (
                  <li key={i} className="mb-1">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.aiAnalysis.burnout_trend && (
             <div className="mt-4 pt-3 border-t border-border/50">
               <span className="font-medium text-text mr-2">Burnout Risk Trend:</span>
               <span className={`px-2 py-1 rounded text-sm ${
                 insights.aiAnalysis.burnout_trend === 'improving' ? 'bg-green-500/10 text-green-400' :
                 insights.aiAnalysis.burnout_trend === 'worsening' ? 'bg-red-500/10 text-red-400' :
                 'bg-blue-500/10 text-blue-400'
               }`}>
                 {insights.aiAnalysis.burnout_trend.charAt(0).toUpperCase() + insights.aiAnalysis.burnout_trend.slice(1)}
               </span>
             </div>
          )}
        </div>
      )}
    </section>
  );
}
