/**
 * @fileoverview AI Companion chat page with SSE streaming.
 * Conversational interface with streaming responses.
 * aria-live region for real-time AI response updates.
 */

"use client";
import React, { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { CrisisModal } from "@/components/CrisisModal";
import { useSession } from "@/hooks/useSession";
import { useAICompanion } from "@/hooks/useAICompanion";

/**
 * AI Companion chat page — empathetic wellness conversations.
 * Streams responses via SSE. Crisis detection on both sides.
 */
export default function CompanionPage() {
  const { isSessionActive } = useSession();
  const companion = useAICompanion();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [companion.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      companion.sendMessage(inputText);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page-content">
      <Header />
      <main className="container" style={{ padding: 0 }}>
        <div className="chat-container">
          {/* Messages */}
          <div className="chat-messages" role="log" aria-label="Conversation with MindEase">
            {companion.messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                <p style={{ fontSize: "var(--font-size-2xl)" }}>💬</p>
                <p>Hi! I&apos;m MindEase, your wellness companion.</p>
                <p>Tell me about your day, how you&apos;re feeling, or anything on your mind.</p>
              </div>
            )}

            {companion.messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble chat-bubble--${msg.role === "user" ? "user" : "assistant"}`}
              >
                {msg.content}
              </div>
            ))}

            {/* Streaming content */}
            {companion.isStreaming && (
              <div className="chat-bubble chat-bubble--assistant">
                <div className="typing-indicator" aria-label="MindEase is typing">
                  <span className="typing-dot" aria-hidden="true" />
                  <span className="typing-dot" aria-hidden="true" />
                  <span className="typing-dot" aria-hidden="true" />
                </div>
              </div>
            )}

            {companion.hasError && (
              <div className="ai-response-error" role="alert" style={{ margin: "var(--space-4)" }}>
                {companion.errorMessage}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <label htmlFor="companion-input" className="sr-only">
              Type your message to MindEase
            </label>
            <input
              id="companion-input"
              className="chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me what's on your mind..."
              disabled={companion.isStreaming}
              aria-label="Type your message"
            />
            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={!inputText.trim() || companion.isStreaming}
              aria-label="Send message"
            >
              {companion.isStreaming ? "..." : "Send"}
            </button>
          </div>
        </div>
      </main>
      <Navbar />

      <CrisisModal
        isOpen={companion.isCrisisDetected}
        message={companion.crisisMessage?.message || ""}
        onClose={() => {}}
      />
    </div>
  );
}
