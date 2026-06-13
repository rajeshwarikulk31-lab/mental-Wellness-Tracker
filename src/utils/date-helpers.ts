/**
 * @fileoverview Date utility functions for lookback windows and formatting.
 * Uses ANALYSIS_LOOKBACK_DAYS from constants for pattern analysis.
 */

import { ANALYSIS_LOOKBACK_DAYS } from "@/constants/constants";

/**
 * Returns a Date that is ANALYSIS_LOOKBACK_DAYS ago from now.
 * Used to limit pattern analysis window.
 */
export function getLookbackDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() - ANALYSIS_LOOKBACK_DAYS);
  return date;
}

/**
 * Formats a Date object to ISO 8601 string (date portion only).
 * @param date - Date to format
 * @returns YYYY-MM-DD formatted string
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Formats an ISO date string to human-readable display format.
 * @param dateStr - ISO 8601 date string
 * @returns Formatted string like "13 Jun 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Checks if a date string represents today's date.
 * @param dateStr - ISO 8601 date string to check
 */
export function isToday(dateStr: string): boolean {
  const today = formatDateISO(new Date());
  const target = dateStr.split("T")[0];
  return today === target;
}

/**
 * Returns start and end ISO date strings for a given number of days back.
 * @param days - Number of days to look back
 * @returns Object with start (days ago) and end (today) dates
 */
export function getDateRangeForPeriod(days: number): {
  start: string;
  end: string;
} {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: formatDateISO(start),
    end: formatDateISO(end),
  };
}
