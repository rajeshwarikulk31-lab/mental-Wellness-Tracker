/**
 * @fileoverview Insights page — 7-day emotional pattern analytics.
 * Lazy-loaded dashboard with memoized charts.
 */

"use client";
import React from 'react';


import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { InsightsDashboard } from "@/components/InsightsDashboard";
import { useSession } from "@/hooks/useSession";
import { useInsights } from "@/hooks/useInsights";

/**
 * Insights page — displays 7-day aggregated mood trends,
 * emotion distribution, and detected stress patterns.
 */
export default function InsightsPage() {
  const { isSessionActive } = useSession();
  const { insights, isLoading, hasError, loadInsights } = useInsights();

  return (
    <div className="page-content">
      <Header />
      <main className="container">
        <h2 className="section-title">📊 Your Insights</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          Emotional patterns and stress triggers from the past 7 days.
        </p>

        <InsightsDashboard
          insights={insights}
          isLoading={isLoading}
          hasError={hasError}
          onRefresh={loadInsights}
        />
      </main>
      <Navbar />
    </div>
  );
}
