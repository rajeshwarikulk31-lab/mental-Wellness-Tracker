"use client";

import { useState, useCallback, useRef } from "react";
import type { CompanionMessage } from "@/types";
import type { Emotion } from "@/constants/constants";

export function useAICompanion() {
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCrisisDetected, setIsCrisisDetected] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<{ message: string; helpline: string } | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string, mood?: number, emotion?: Emotion) => {
      if (!message.trim() || isStreaming) return;

      setIsStreaming(true);
      setHasError(false);
      setErrorMessage(null);
      setIsCrisisDetected(false);
      setCrisisMessage(null);

      const userMessage: CompanionMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        isCrisisDetected: false,
      };

      const aiPlaceholder: CompanionMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isCrisisDetected: false,
      };

      setMessages((prev) => [...prev, userMessage, aiPlaceholder]);

      try {
        abortControllerRef.current = new AbortController();
        
        const response = await fetch("/api/companion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationHistory: messages,
            mood,
            emotion,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to connect to AI companion");
        }

        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.isCrisisDetected) {
            setIsCrisisDetected(true);
            setCrisisMessage(data.crisis);
            setMessages((prev) => prev.slice(0, -1)); // Remove placeholder
            return;
          }
          if (data.error) throw new Error(data.error);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response stream");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);
                
                if (data.isCrisisDetected) {
                   setIsCrisisDetected(true);
                   // the response has been recorded, we can show standard crisis modal via UI
                }

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === "assistant") {
                    lastMessage.content += data.content;
                  }
                  return newMessages;
                });
              } catch (e) {
                // Parse error on incomplete chunk, ignore
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setHasError(true);
          setErrorMessage("I'm having trouble connecting right now. Please try again in a moment. 💛");
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              lastMessage.content = "I'm having trouble connecting right now. Please try again in a moment. 💛";
            }
            return newMessages;
          });
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setHasError(false);
    setErrorMessage(null);
    setIsCrisisDetected(false);
    setCrisisMessage(null);
  }, []);

  return {
    messages,
    isStreaming,
    hasError,
    errorMessage,
    isCrisisDetected,
    crisisMessage,
    sendMessage,
    clearChat,
  };
}
