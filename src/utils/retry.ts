/**
 * @fileoverview Retry logic with exponential backoff.
 * Uses MAX_RETRIES constant. Only retries NetworkError and retryable AIApiError.
 * Never retries ValidationError.
 */

import { MAX_RETRIES } from "@/constants/constants";
import { NetworkError, AIApiError, ValidationError } from "@/types";
import { logError, logInfo } from "./logger";

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

/**
 * Determines if an error is worth retrying.
 * NetworkErrors and retryable AIApiErrors are retriable.
 * ValidationErrors are never retried.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof ValidationError) return false;
  if (error instanceof NetworkError) return true;
  if (error instanceof AIApiError) return error.isRetryable;
  return false;
}

/**
 * Calculates exponential backoff delay: baseDelay × 2^attempt.
 * Adds jitter to prevent thundering herd.
 */
function calculateDelay(attempt: number, baseDelayMs: number): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs;
  return exponentialDelay + jitter;
}

/**
 * Wraps an async operation with exponential backoff retry logic.
 * @param operation - Async function to execute
 * @param options - Optional retry configuration
 * @returns Result of the operation
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      const delay = calculateDelay(attempt, baseDelayMs);
      logInfo(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/** Promise-based sleep utility for backoff delays */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
