/**
 * @fileoverview Unit tests for mood validation.
 * Tests values inside/outside MOOD_SCALE bounds and emotion whitelist.
 */

import { validateMoodScore, validateMoodValue } from "./sanitise";
import { ValidationError } from "@/types";
import { MOOD_SCALE, EMOTIONS } from "@/constants/constants";

describe("moodValidator", () => {
  describe("validateMoodScore", () => {
    it("should accept minimum value", () => {
      expect(() => validateMoodScore(MOOD_SCALE.MIN)).not.toThrow();
    });

    it("should accept maximum value", () => {
      expect(() => validateMoodScore(MOOD_SCALE.MAX)).not.toThrow();
    });

    it("should accept middle value", () => {
      expect(() => validateMoodScore(5)).not.toThrow();
    });

    it("should reject below minimum", () => {
      expect(() => validateMoodScore(MOOD_SCALE.MIN - 1)).toThrow(ValidationError);
    });

    it("should reject above maximum", () => {
      expect(() => validateMoodScore(MOOD_SCALE.MAX + 1)).toThrow(ValidationError);
    });

    it("should reject decimal values", () => {
      expect(() => validateMoodScore(5.5)).toThrow(ValidationError);
    });

    it("should reject negative values", () => {
      expect(() => validateMoodScore(-3)).toThrow(ValidationError);
    });

    it("should reject zero", () => {
      expect(() => validateMoodScore(0)).toThrow(ValidationError);
    });
  });

  describe("validateMoodValue (emotion whitelist)", () => {
    it.each(EMOTIONS.map((e) => [e]))("should accept valid emotion: '%s'", (emotion) => {
      expect(validateMoodValue(emotion)).toBe(true);
    });

    it("should reject invalid emotion strings", () => {
      expect(() => validateMoodValue("happy")).toThrow(ValidationError);
      expect(() => validateMoodValue("sad")).toThrow(ValidationError);
      expect(() => validateMoodValue("angry")).toThrow(ValidationError);
    });

    it("should reject empty string", () => {
      expect(() => validateMoodValue("")).toThrow(ValidationError);
    });

    it("should be case-sensitive (reject uppercase)", () => {
      expect(() => validateMoodValue("CALM")).toThrow(ValidationError);
      expect(() => validateMoodValue("Anxious")).toThrow(ValidationError);
    });
  });
});
