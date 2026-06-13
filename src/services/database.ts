/**
 * @fileoverview SQLite database service using sql.js (pure JS, no native deps).
 * Server-side only. Stores journal entries (encrypted), mood logs,
 * daily aggregates, and anonymised crisis events.
 * Indexes on userId + date for efficient lookback queries.
 */

import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_PAGE_SIZE } from "@/constants/constants";
import type { JournalEntry, MoodLog, DailyAggregate, CrisisAlert, PaginatedResponse } from "@/types";
import { encryptText, decryptText } from "@/utils/encryption";
import { logError, logInfo } from "@/utils/logger";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "mindease.db");

let dbInstance: SqlJsDatabase | null = null;

/** SQL statements for table creation */
const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    encrypted_content TEXT NOT NULL,
    mood INTEGER NOT NULL,
    emotion TEXT NOT NULL,
    exam TEXT NOT NULL,
    ai_analysis TEXT,
    is_crisis_detected INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    mood_score INTEGER NOT NULL,
    emotion TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_aggregates (
    userId TEXT NOT NULL,
    date TEXT NOT NULL,
    avg_mood REAL,
    dominant_emotion TEXT,
    entry_count INTEGER DEFAULT 0,
    emotion_distribution TEXT DEFAULT '{}',
    PRIMARY KEY (userId, date)
  );

  CREATE TABLE IF NOT EXISTS crisis_events (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    trigger_text TEXT NOT NULL,
    source TEXT NOT NULL,
    helpline_shown INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(userId, created_at);
  CREATE INDEX IF NOT EXISTS idx_mood_user_date ON mood_logs(userId, created_at);
`;

/**
 * Ensures the data directory exists for SQLite file storage.
 */
function ensureDataDirectory(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

/**
 * Persists the in-memory database to disk.
 */
function persistDatabase(db: SqlJsDatabase): void {
  try {
    ensureDataDirectory();
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "db_persist" });
  }
}

/**
 * Initializes the SQLite database, creating tables if they don't exist.
 * Loads existing database from disk if available.
 * @returns Initialized database instance
 */
export async function initializeDatabase(): Promise<SqlJsDatabase> {
  try {
    const SQL = await initSqlJs({
      locateFile: file => path.join(process.cwd(), "node_modules", "sql.js", "dist", file)
    });
    ensureDataDirectory();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } else {
      dbInstance = new SQL.Database();
    }

    dbInstance.run(CREATE_TABLES_SQL);
    persistDatabase(dbInstance);
    logInfo("Database initialized successfully");
    return dbInstance;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "db_init" });
    throw error;
  }
}

/**
 * Returns the singleton database instance, initializing if needed.
 */
export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!dbInstance) {
    return initializeDatabase();
  }
  return dbInstance;
}

/**
 * Saves an encrypted journal entry to the database.
 * @param entry - Journal entry data (id, timestamps auto-generated)
 * @returns The saved journal entry with generated fields
 */
export async function saveJournalEntry(
  entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt" | "encryptedContent"> & { content: string }
): Promise<JournalEntry> {
  try {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const encryptedContent = encryptText(entry.content);

    db.run(
      `INSERT INTO journal_entries (id, userId, encrypted_content, mood, emotion, exam, ai_analysis, is_crisis_detected, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, entry.userId, encryptedContent, entry.mood, entry.emotion, entry.exam, entry.aiAnalysis, entry.isCrisisDetected ? 1 : 0, now, now]
    );
    persistDatabase(db);

    return {
      id, userId: entry.userId, encryptedContent, mood: entry.mood,
      emotion: entry.emotion, exam: entry.exam, aiAnalysis: entry.aiAnalysis,
      isCrisisDetected: entry.isCrisisDetected, createdAt: now, updatedAt: now,
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "save_journal" });
    throw error;
  }
}

/**
 * Retrieves paginated journal entries, decrypting content.
 * @param userId - User identifier
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of entries per page
 */
export async function getJournalEntries(
  userId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<JournalEntry>> {
  try {
    const db = await getDatabase();
    const offset = (page - 1) * pageSize;

    const countResult = db.exec("SELECT COUNT(*) as total FROM journal_entries WHERE userId = ?", [userId]);
    const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

    const results = db.exec(
      "SELECT * FROM journal_entries WHERE userId = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, pageSize, offset]
    );

    const entries: JournalEntry[] = results.length > 0
      ? results[0].values.map((row) => mapRowToJournalEntry(results[0].columns, row))
      : [];

    return { data: entries, page, pageSize, total, hasMore: offset + pageSize < total };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "get_journals" });
    throw error;
  }
}

/** Maps a database row to a JournalEntry, decrypting content */
function mapRowToJournalEntry(columns: string[], row: unknown[]): JournalEntry {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });

  let content: string | undefined;
  try {
    content = decryptText(obj.encrypted_content as string);
  } catch {
    content = "[Unable to decrypt]";
  }

  return {
    id: obj.id as string,
    userId: obj.userId as string,
    encryptedContent: obj.encrypted_content as string,
    content,
    mood: obj.mood as number,
    emotion: obj.emotion as string as JournalEntry["emotion"],
    exam: obj.exam as string as JournalEntry["exam"],
    aiAnalysis: (obj.ai_analysis as string) || null,
    isCrisisDetected: (obj.is_crisis_detected as number) === 1,
    createdAt: obj.created_at as string,
    updatedAt: obj.updated_at as string,
  };
}

/**
 * Saves a mood log entry.
 * @param log - Mood log data (id, timestamp auto-generated)
 */
export async function saveMoodLog(
  log: Omit<MoodLog, "id" | "createdAt">
): Promise<MoodLog> {
  try {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run(
      "INSERT INTO mood_logs (id, userId, mood_score, emotion, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, log.userId, log.moodScore, log.emotion, log.note, now]
    );
    persistDatabase(db);

    return { id, userId: log.userId, moodScore: log.moodScore, emotion: log.emotion, note: log.note, createdAt: now };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "save_mood" });
    throw error;
  }
}

/**
 * Retrieves paginated mood history for a user.
 */
export async function getMoodHistory(
  userId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<MoodLog>> {
  try {
    const db = await getDatabase();
    const offset = (page - 1) * pageSize;

    const countResult = db.exec("SELECT COUNT(*) FROM mood_logs WHERE userId = ?", [userId]);
    const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

    const results = db.exec(
      "SELECT * FROM mood_logs WHERE userId = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, pageSize, offset]
    );

    const logs: MoodLog[] = results.length > 0
      ? results[0].values.map((row) => {
          const cols = results[0].columns;
          const obj: Record<string, unknown> = {};
          cols.forEach((col, i) => { obj[col] = row[i]; });
          return {
            id: obj.id as string, userId: obj.userId as string,
            moodScore: obj.mood_score as number, emotion: obj.emotion as MoodLog["emotion"],
            note: (obj.note as string) || "", createdAt: obj.created_at as string,
          };
        })
      : [];

    return { data: logs, page, pageSize, total, hasMore: offset + pageSize < total };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "get_mood_history" });
    throw error;
  }
}

/**
 * Upserts a daily aggregate row for pre-computed stats.
 */
export async function saveDailyAggregate(aggregate: DailyAggregate): Promise<void> {
  try {
    const db = await getDatabase();
    db.run(
      `INSERT OR REPLACE INTO daily_aggregates (userId, date, avg_mood, dominant_emotion, entry_count, emotion_distribution)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [aggregate.userId, aggregate.date, aggregate.avgMood, aggregate.dominantEmotion,
       aggregate.entryCount, JSON.stringify(aggregate.emotionDistribution)]
    );
    persistDatabase(db);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "save_aggregate" });
    throw error;
  }
}

/**
 * Retrieves daily aggregates within a date range.
 */
export async function getDailyAggregates(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyAggregate[]> {
  try {
    const db = await getDatabase();
    const results = db.exec(
      "SELECT * FROM daily_aggregates WHERE userId = ? AND date >= ? AND date <= ? ORDER BY date ASC",
      [userId, startDate, endDate]
    );

    if (results.length === 0) return [];
    return results[0].values.map((row) => {
      const cols = results[0].columns;
      const obj: Record<string, unknown> = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return {
        userId: obj.userId as string, date: obj.date as string,
        avgMood: obj.avg_mood as number, dominantEmotion: obj.dominant_emotion as DailyAggregate["dominantEmotion"],
        entryCount: obj.entry_count as number,
        emotionDistribution: JSON.parse((obj.emotion_distribution as string) || "{}"),
      };
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "get_aggregates" });
    throw error;
  }
}

/**
 * Saves an anonymised crisis event for audit purposes.
 */
export async function saveCrisisEvent(alert: CrisisAlert): Promise<void> {
  try {
    const db = await getDatabase();
    db.run(
      "INSERT INTO crisis_events (id, userId, trigger_text, source, helpline_shown, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [alert.id, alert.userId, alert.triggerText, alert.source, alert.helplineShown ? 1 : 0, alert.createdAt]
    );
    persistDatabase(db);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "save_crisis" });
    throw error;
  }
}
