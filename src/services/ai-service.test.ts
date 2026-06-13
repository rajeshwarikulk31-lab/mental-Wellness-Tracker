/**
 * @fileoverview Unit tests for AI service.
 * Mocks the Gemini API client and verifies response processing.
 */

import { analyzeJournalEntry, generateCompanionResponse, generateMindfulnessExercise } from "./ai-service";
import { GoogleGenerativeAI } from "@google/generative-ai";

jest.mock("@google/generative-ai", () => {
  const mModel = {
    generateContent: jest.fn().mockResolvedValue({
      response: { text: () => "Mocked AI response. Hope you feel better." },
    }),
    generateContentStream: jest.fn().mockResolvedValue({
      stream: [{ text: () => "Streamed" }, { text: () => " content" }],
    }),
  };
  const mGoogleGenerativeAI = jest.fn(() => ({
    getGenerativeModel: jest.fn(() => mModel),
  }));
  return { GoogleGenerativeAI: mGoogleGenerativeAI };
});

describe("AI Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-key" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("analyzeJournalEntry", () => {
    it("should return parsed AIResponse", async () => {
      const response = await analyzeJournalEntry("Test journal", 5, "calm", "NEET");
      expect(response.content).toBe("Mocked AI response. Hope you feel better.");
      expect(response.isCrisisDetected).toBe(false);
      expect(response.timestamp).toBeDefined();
    });
  });

  describe("generateCompanionResponse", () => {
    it("should process conversation history", async () => {
      const messages = [{ id: "1", role: "user" as const, content: "Hello", timestamp: "now", isCrisisDetected: false }];
      const response = await generateCompanionResponse(messages);
      expect(response.content).toBe("Mocked AI response. Hope you feel better.");
    });
  });

  describe("generateMindfulnessExercise", () => {
    it("should return a structured exercise", async () => {
      const exercise = await generateMindfulnessExercise("anxious", 120);
      expect(exercise.targetEmotion).toBe("anxious");
      expect(exercise.duration).toBe(120);
      expect(exercise.steps.length).toBeGreaterThan(0);
    });
  });
});
