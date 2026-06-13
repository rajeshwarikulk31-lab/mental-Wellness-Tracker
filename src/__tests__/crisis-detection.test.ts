import {
  detectCrisis,
  formatCrisisResponse,
  createCrisisAlert,
} from "../utils/crisis-detection";

// Mock constants
jest.mock("@/constants/constants", () => ({
  CRISIS_KEYWORDS: ["suicide", "kill myself", "hopeless"],
  CRISIS_HELPLINE: "123-456-7890",
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: () => "mocked-uuid",
}));

describe("Crisis Detection Utilities", () => {
  describe("detectCrisis", () => {
    it("should return true when crisis keywords are present", () => {
      expect(detectCrisis("I want to kill myself")).toBe(true);
      expect(detectCrisis("feeling hopeless today")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(detectCrisis("SUICIDE")).toBe(true);
      expect(detectCrisis("Kill MySelf")).toBe(true);
    });

    it("should return false for normal text", () => {
      expect(detectCrisis("I am having a good day")).toBe(false);
      expect(detectCrisis("A bit sad but managing")).toBe(false);
    });

    it("should return false for empty or whitespace strings", () => {
      expect(detectCrisis("")).toBe(false);
      expect(detectCrisis("   ")).toBe(false);
    });
  });

  describe("formatCrisisResponse", () => {
    it("should return an empathetic message and the helpline", () => {
      const response = formatCrisisResponse();
      expect(response).toHaveProperty("message");
      expect(response.message).toContain("trained counsellor");
      expect(response.helpline).toBe("123-456-7890");
    });
  });

  describe("createCrisisAlert", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-13T12:00:00.000Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should create a redacted alert for user input", () => {
      const alert = createCrisisAlert("user-1", "I feel hopeless and want to kill myself", "user_input");
      expect(alert.id).toBe("mocked-uuid");
      expect(alert.userId).toBe("user-1");
      expect(alert.triggerText).toBe("[REDACTED] Keywords detected: kill myself, hopeless");
      expect(alert.source).toBe("user_input");
      expect(alert.helplineShown).toBe(true);
      expect(alert.createdAt).toBe("2026-06-13T12:00:00.000Z");
    });

    it("should create a redacted alert for AI response", () => {
      const alert = createCrisisAlert("user-2", "mention of suicide", "ai_response");
      expect(alert.id).toBe("mocked-uuid");
      expect(alert.userId).toBe("user-2");
      expect(alert.triggerText).toBe("[REDACTED] Keywords detected: suicide");
      expect(alert.source).toBe("ai_response");
      expect(alert.helplineShown).toBe(true);
      expect(alert.createdAt).toBe("2026-06-13T12:00:00.000Z");
    });
  });
});
