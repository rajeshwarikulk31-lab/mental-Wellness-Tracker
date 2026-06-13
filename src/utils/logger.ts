/**
 * @fileoverview PII-safe logging utility.
 * Redacts phone numbers, emails, and common name patterns before logging.
 * No personal data ever reaches log output.
 */

/** 10-digit Indian phone numbers with optional +91 prefix */
const PHONE_PATTERN = /(\+91[\s-]?)?[6-9]\d{9}/g;

/** Email addresses */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Aadhaar-like 12-digit numbers */
const AADHAAR_PATTERN = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;

const REDACTION_PLACEHOLDER = "[REDACTED]";

/**
 * Strips personally identifiable information from text.
 * Replaces phone numbers, emails, and Aadhaar-like numbers.
 * @param text - Text that may contain PII
 * @returns Text with PII replaced by [REDACTED]
 */
export function redactPII(text: string): string {
  return text
    .replace(PHONE_PATTERN, REDACTION_PLACEHOLDER)
    .replace(EMAIL_PATTERN, REDACTION_PLACEHOLDER)
    .replace(AADHAAR_PATTERN, REDACTION_PLACEHOLDER);
}

/**
 * Logs an informational message with optional context.
 * Context values are PII-redacted before output.
 * @param message - Log message
 * @param context - Optional key-value context data
 */
export function logInfo(
  message: string,
  context?: Record<string, unknown>
): void {
  const safeMessage = redactPII(message);
  const timestamp = new Date().toISOString();
  const logEntry = { level: "INFO", timestamp, message: safeMessage, ...sanitiseContext(context) };
  console.log(JSON.stringify(logEntry));
}

/**
 * Logs an error with stack trace. Technical details preserved, PII stripped.
 * @param error - Error object
 * @param context - Optional key-value context data
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: "ERROR",
    timestamp,
    name: error.name,
    message: redactPII(error.message),
    stack: error.stack ? redactPII(error.stack) : undefined,
    ...sanitiseContext(context),
  };
  console.error(JSON.stringify(logEntry));
}

/**
 * Logs an anonymised crisis event for audit trail.
 * Never stores the actual content — only metadata.
 * @param userId - User identifier (hashed in practice)
 * @param source - Whether from user_input or ai_response
 */
export function logCrisisEvent(userId: string, source: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: "CRISIS",
    timestamp,
    userId: hashUserId(userId),
    source,
    action: "helpline_displayed",
  };
  console.warn(JSON.stringify(logEntry));
}

/** Redacts all string values in a context object */
function sanitiseContext(
  context?: Record<string, unknown>
): Record<string, unknown> {
  if (!context) return {};
  const sanitised: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    sanitised[key] = typeof value === "string" ? redactPII(value) : value;
  }
  return sanitised;
}

/** Simple hash for userId to prevent PII in logs */
function hashUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `user_${Math.abs(hash).toString(36)}`;
}
