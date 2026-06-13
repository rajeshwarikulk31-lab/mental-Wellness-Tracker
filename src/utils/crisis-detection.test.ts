/**
 * @fileoverview Unit tests for crisis detection.
 * Tests every keyword in CRISIS_KEYWORDS, false positives, and edge cases.
 */

import { detectCrisis, formatCrisisResponse, createCrisisAlert } from "./crisis-detection";
import { CRISIS_KEYWORDS, CRISIS_HELPLINE } from "@/constants/constants";

describe("detectCrisis", () => {
  // Test each CRISIS_KEYWORD
  it.each(CRISIS_KEYWORDS.map((kw) => [kw]))(
    "should detect crisis keyword: '%s'",
    (keyword) => {
      expect(detectCrisis(`I feel like ${keyword}`)).toBe(true);
    }
  );

  it("should be case-insensitive", () => {
    expect(detectCrisis("I feel HOPELESS")).toBe(true);
    expect(detectCrisis("SUICIDE prevention")).toBe(true);
  });

  it("should detect keywords within longer text", () => {
    expect(detectCrisis("Sometimes I feel so hopeless about my exams")).toBe(true);
    expect(detectCrisis("I just want to give up on everything")).toBe(true);
  });

  it("should not flag normal text as crisis", () => {
    expect(detectCrisis("I had a great day studying")).toBe(false);
    expect(detectCrisis("I'm stressed about exams")).toBe(false);
    expect(detectCrisis("I feel anxious but hopeful")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(detectCrisis("")).toBe(false);
  });

  it("should return false for whitespace-only string", () => {
    expect(detectCrisis("   ")).toBe(false);
  });

  it("should return false for null-like input", () => {
    expect(detectCrisis("")).toBe(false);
  });

  it("should detect 'can't go on' with apostrophe", () => {
    expect(detectCrisis("I can't go on anymore")).toBe(true);
  });

  it("should not false positive on 'hopeful'", () => {
    // "hopeful" contains "hope" but not "hopeless"
    expect(detectCrisis("I feel hopeful")).toBe(false);
  });
});

describe("formatCrisisResponse", () => {
  it("should return an empathetic message", () => {
    const response = formatCrisisResponse();
    expect(response.message).toContain("You don't have to face this alone");
    expect(response.helpline).toBe(CRISIS_HELPLINE);
  });

  it("should include the iCall helpline", () => {
    const response = formatCrisisResponse();
    expect(response.helpline).toContain("9152987821");
  });
});

describe("createCrisisAlert", () => {
  it("should create an anonymised alert with redacted text", () => {
    const alert = createCrisisAlert("user123", "I feel hopeless", "user_input");
    expect(alert.userId).toBe("user123");
    expect(alert.triggerText).toContain("[REDACTED]");
    expect(alert.triggerText).toContain("hopeless");
    expect(alert.source).toBe("user_input");
    expect(alert.helplineShown).toBe(true);
    expect(alert.id).toBeDefined();
    expect(alert.createdAt).toBeDefined();
  });

  it("should not contain the raw user text", () => {
    const alert = createCrisisAlert("user123", "My name is John and I feel hopeless", "user_input");
    expect(alert.triggerText).not.toContain("John");
  });
});
