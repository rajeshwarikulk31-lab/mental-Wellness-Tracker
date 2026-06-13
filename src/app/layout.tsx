import React from 'react';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindEase — Mental Wellness Tracker for Exam Students",
  description:
    "AI-powered mental wellness companion for Indian students preparing for NEET, JEE, CUET, CAT, GATE, and UPSC. " +
    "Track mood, journal daily, detect stress patterns, and get personalised coping strategies.",
  keywords: [
    "mental wellness", "exam stress", "NEET preparation", "JEE stress relief",
    "mood tracker", "journaling", "mindfulness", "student mental health",
    "stress management", "AI wellness companion",
  ],
  viewport: "width=device-width, initial-scale=1",
};

/**
 * Root layout with Inter font, viewport meta, and semantic HTML structure.
 * Wraps all pages with header and bottom navigation.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a1a" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
