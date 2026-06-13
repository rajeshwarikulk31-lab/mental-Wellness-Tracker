import {
  checkRateLimit,
  recordRequest,
  resetRateLimit,
  getRateLimitHeaders,
} from "../utils/rate-limiter";

jest.mock("@/constants/constants", () => ({
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 5,
}));

describe("Rate Limiter Utilities", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-13T12:00:00.000Z"));
  });

  afterEach(() => {
    // We can't clear the module level Map easily unless we reset it per test
    // We'll use random session IDs or reset manually
    jest.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow requests below the limit", () => {
      const sessionId = "session-1";
      resetRateLimit(sessionId);
      
      const state = checkRateLimit(sessionId);
      expect(state.isLimited).toBe(false);
      expect(state.requests.length).toBe(0);
      expect(state.retryAfterMs).toBe(0);
    });

    it("should prune old requests outside the window", () => {
      const sessionId = "session-2";
      resetRateLimit(sessionId);

      recordRequest(sessionId);
      
      // Advance time beyond window
      jest.advanceTimersByTime(60001);
      
      const state = checkRateLimit(sessionId);
      expect(state.requests.length).toBe(0);
      expect(state.isLimited).toBe(false);
    });

    it("should limit when requests exceed the maximum", () => {
      const sessionId = "session-3";
      resetRateLimit(sessionId);

      // Record 5 requests
      for (let i = 0; i < 5; i++) {
        recordRequest(sessionId);
      }
      
      const state = checkRateLimit(sessionId);
      expect(state.isLimited).toBe(true);
      expect(state.requests.length).toBe(5);
      expect(state.retryAfterMs).toBe(60000); // Because they all happened exactly at "now"
    });
  });

  describe("recordRequest", () => {
    it("should store request timestamps", () => {
      const sessionId = "session-4";
      resetRateLimit(sessionId);

      recordRequest(sessionId);
      const state = checkRateLimit(sessionId);
      expect(state.requests.length).toBe(1);
    });
  });

  describe("resetRateLimit", () => {
    it("should clear the session data", () => {
      const sessionId = "session-5";
      recordRequest(sessionId);
      resetRateLimit(sessionId);
      const state = checkRateLimit(sessionId);
      expect(state.requests.length).toBe(0);
    });
  });

  describe("getRateLimitHeaders", () => {
    it("should return headers for a non-limited state", () => {
      const state = {
        requests: [1, 2, 3],
        isLimited: false,
        retryAfterMs: 0,
      };
      const headers = getRateLimitHeaders(state);
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("2");
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("should return headers with Retry-After for a limited state", () => {
      const state = {
        requests: [1, 2, 3, 4, 5],
        isLimited: true,
        retryAfterMs: 3500, // 3.5 seconds
      };
      const headers = getRateLimitHeaders(state);
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["Retry-After"]).toBe("4"); // Math.ceil(3500 / 1000)
    });

    it("should ensure remaining is not negative", () => {
      const state = {
        requests: [1, 2, 3, 4, 5, 6],
        isLimited: true,
        retryAfterMs: 3500,
      };
      const headers = getRateLimitHeaders(state);
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
    });
  });
});
