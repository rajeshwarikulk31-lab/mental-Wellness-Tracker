/**
 * @fileoverview App header with gradient branding.
 */

"use client";
import React from 'react';


import { APP_NAME } from "@/constants/constants";

/**
 * App header with MindEase branding and gradient text.
 */
export function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-logo">
          <span className="header-icon" aria-hidden="true">🧠</span>
          <span className="gradient-text">{APP_NAME}</span>
        </h1>
        <p className="header-tagline">Your mental wellness companion</p>
      </div>
    </header>
  );
}
