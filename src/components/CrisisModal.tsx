/**
 * @fileoverview Crisis safety modal — focus-trapped, role="alert".
 * Displays empathetic message and CRISIS_HELPLINE.
 * Keyboard accessible: Escape to close, focus trapped inside.
 */

"use client";
import React, { useEffect, useRef, useCallback } from "react";
import { CRISIS_HELPLINE } from "@/constants/constants";

interface CrisisModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

/**
 * Accessible crisis modal with focus trap and urgent ARIA semantics.
 * Shows empathetic message + helpline when crisis keywords detected.
 */
export function CrisisModal({ isOpen, message, onClose }: CrisisModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap — keep focus inside modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="crisis-overlay" aria-modal="true" role="dialog" aria-labelledby="crisis-title">
      <div className="crisis-modal" ref={modalRef} role="alert">
        <div className="crisis-icon" aria-hidden="true">💛</div>
        <h2 id="crisis-title" className="crisis-title">You&apos;re Not Alone</h2>
        <p className="crisis-message">{message}</p>
        <div className="crisis-helpline-card">
          <p className="crisis-helpline-label">Talk to someone who cares:</p>
          <a
            href="tel:9152987821"
            className="crisis-helpline-number"
            aria-label={`Call crisis helpline at ${CRISIS_HELPLINE}`}
          >
            📞 {CRISIS_HELPLINE}
          </a>
        </div>
        <button
          ref={closeButtonRef}
          className="btn-secondary crisis-close-btn"
          onClick={onClose}
          aria-label="Close crisis support message"
        >
          I understand, continue
        </button>
      </div>
    </div>
  );
}
