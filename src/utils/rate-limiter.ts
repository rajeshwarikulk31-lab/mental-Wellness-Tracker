/**
 * @fileoverview In-memory rate limiter per user session.
 * Enforces RATE_LIMIT_MAX_REQUESTS within RATE_LIMIT_WINDOW_MS.
 * Returns 429 status with Retry-After header on breach.
 */

import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from "@/constants/constants";
import type { RateLimitState } from "@/types";

/** In-memory store: sessionId → array of request timestamps */
const sessionLimits = new Map<string, number[]>();

/**
 * Checks whether a session has exceeded the rate limit.
 * Prunes expired timestamps from the window before checking.
 * @param sessionId - Unique session identifier
 * @returns Current rate limit state with isLimited flag
 */
export function checkRateLimit(sessionId: string): RateLimitState {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = sessionLimits.get(sessionId) ?? [];

  // Prune requests outside the current window
  const activeRequests = timestamps.filter((ts) => ts > windowStart);
  sessionLimits.set(sessionId, activeRequests);

  const isLimited = activeRequests.length >= RATE_LIMIT_MAX_REQUESTS;
  const retryAfterMs = isLimited
    ? activeRequests[0] + RATE_LIMIT_WINDOW_MS - now
    : 0;

  return { requests: activeRequests, isLimited, retryAfterMs };
}

/**
 * Records a new request timestamp for a session.
 * @param sessionId - Unique session identifier
 */
export function recordRequest(sessionId: string): void {
  const timestamps = sessionLimits.get(sessionId) ?? [];
  timestamps.push(Date.now());
  sessionLimits.set(sessionId, timestamps);
}

/**
 * Resets the rate limit for a session (e.g., on session expiry).
 * @param sessionId - Unique session identifier
 */
export function resetRateLimit(sessionId: string): void {
  sessionLimits.delete(sessionId);
}

/**
 * Generates HTTP response headers for rate limiting.
 * Includes Retry-After header when the session is rate-limited.
 * @param state - Current rate limit state
 * @returns Headers object for HTTP response
 */
export function getRateLimitHeaders(
  state: RateLimitState
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
    "X-RateLimit-Remaining": String(
      Math.max(0, RATE_LIMIT_MAX_REQUESTS - state.requests.length)
    ),
  };
  if (state.isLimited) {
    headers["Retry-After"] = String(Math.ceil(state.retryAfterMs / 1000));
  }
  return headers;
}
