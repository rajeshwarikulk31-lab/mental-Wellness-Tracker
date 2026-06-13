/**
 * @fileoverview AI companion chat hook with SSE streaming.
 * Parses Server-Sent Events for real-time response display.
 * Client-side crisis detection on received text.
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type { Emotion } from "@/constants/constants";
import type { CompanionMessage } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UseAICompanionReturn {
  messages: CompanionMessage[];
  isStreaming: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isCrisisDetected: boolean;
  crisisMessage: { message: string; helpline: string } | null;
  streamingContent: string;
  sendMessage: (text: string, mood?: number, emotion?: Emotion) => Promise<void>;
  clearConversation: () => void;
}

/**
 * Hook for AI companion chat with SSE streaming support.
 * @param userId - Current user's ID
 */
export function useAICompanion(userId: string): UseAICompanionReturn {
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCrisisDetected, setIsCrisisDetected] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<{ message: string; helpline: string } | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string, mood?: number, emotion?: Emotion) => {
      if (!text.trim() || isStreaming) return;

      setHasError(false);
      setErrorMessage(null);
      setIsCrisisDetected(false);
      setCrisisMessage(null);

      // Add user message to conversation
      const userMessage: CompanionMessage = {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        isCrisisDetected: false,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsStreaming(true);
      setStreamingContent("");

      try {
        abortRef.current = new AbortController();

        const response = await fetch("/api/companion", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-session-id": userId },
          body: JSON.stringify({
            userId,
            message: text,
            conversationHistory: updatedMessages,
            mood,
            emotion,
          }),
          signal: abortRef.current.signal,
        });

        // Check if response is JSON (crisis/error) or SSE stream
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await response.json();
          if (data.isCrisisDetected) {
            setIsCrisisDetected(true);
            setCrisisMessage(data.crisis);
          }
          if (data.error) {
            setHasError(true);
            setErrorMessage(data.error);
          }
          return;
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                if (data.isCrisisDetected) {
                  setIsCrisisDetected(true);
                }
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }

        // Add completed assistant message
        if (fullContent) {
          const assistantMessage: CompanionMessage = {
            id: uuidv4(),
            role: "assistant",
            content: fullContent,
            timestamp: new Date().toISOString(),
            isCrisisDetected: false,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setHasError(true);
        setErrorMessage("Couldn't connect right now. Please try again. 💛");
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [messages, isStreaming, userId]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    setIsCrisisDetected(false);
    setCrisisMessage(null);
  }, []);

  return {
    messages, isStreaming, hasError, errorMessage, isCrisisDetected,
    crisisMessage, streamingContent, sendMessage, clearConversation,
  };
}
