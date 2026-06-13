/**
 * @fileoverview Unit tests for rate limiter.
 * Tests: within limit, at limit (20th), over limit (21st), window reset.
 */

import { checkRateLimit, recordRequest, resetRateLimit, getRateLimitHeaders } from "./rate-limiter";
import { RATE_LIMIT_MAX_REQUESTS } from "@/constants/constants";

describe("rateLimiter", () => {
  const testSession = "test-session-" + Date.now();

  beforeEach(() => {
    resetRateLimit(testSession);
  });

  it("should allow requests within the limit", () => {
    for (let i = 0; i < 5; i++) {
      recordRequest(testSession);
    }
    const state = checkRateLimit(testSession);
    expect(state.isLimited).toBe(false);
    expect(state.requests.length).toBe(5);
  });

  it("should allow exactly RATE_LIMIT_MAX_REQUESTS requests", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      recordRequest(testSession);
    }
    const state = checkRateLimit(testSession);
    // At exactly the limit, isLimited should be true (>=)
    expect(state.isLimited).toBe(true);
  });

  it("should block the 21st request (over limit)", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS + 1; i++) {
      recordRequest(testSession);
    }
    const state = checkRateLimit(testSession);
    expect(state.isLimited).toBe(true);
    expect(state.retryAfterMs).toBeGreaterThan(0);
  });

  it("should reset rate limit for a session", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS + 1; i++) {
      recordRequest(testSession);
    }
    resetRateLimit(testSession);
    const state = checkRateLimit(testSession);
    expect(state.isLimited).toBe(false);
    expect(state.requests.length).toBe(0);
  });

  it("should include Retry-After header when limited", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS + 1; i++) {
      recordRequest(testSession);
    }
    const state = checkRateLimit(testSession);
    const headers = getRateLimitHeaders(state);
    expect(headers["Retry-After"]).toBeDefined();
    expect(parseInt(headers["Retry-After"])).toBeGreaterThan(0);
  });

  it("should include X-RateLimit headers", () => {
    recordRequest(testSession);
    const state = checkRateLimit(testSession);
    const headers = getRateLimitHeaders(state);
    expect(headers["X-RateLimit-Limit"]).toBe(String(RATE_LIMIT_MAX_REQUESTS));
    expect(headers["X-RateLimit-Remaining"]).toBeDefined();
  });

  it("should not have Retry-After when not limited", () => {
    recordRequest(testSession);
    const state = checkRateLimit(testSession);
    const headers = getRateLimitHeaders(state);
    expect(headers["Retry-After"]).toBeUndefined();
  });
});
