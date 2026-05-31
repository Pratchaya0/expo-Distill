import * as SQLite from 'expo-sqlite';
import type { SQLiteBindValue } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import type { Recording, Note, PromptTemplate, TranscriptSegment, ActionItem } from '@/types';

const db = SQLite.openDatabaseSync('distill.db');

export async function initDB(): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      duration REAL NOT NULL DEFAULT 0,
      audioPath TEXT NOT NULL,
      transcript TEXT,
      summary TEXT,
      actionItems TEXT,
      mindMap TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      language TEXT NOT NULL DEFAULT 'th',
      templateId TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recordingId INTEGER NOT NULL,
      timestamp REAL NOT NULL DEFAULT 0,
      content TEXT NOT NULL DEFAULT '',
      imagePaths TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      systemPrompt TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_recordings_createdAt ON recordings(createdAt);
    CREATE INDEX IF NOT EXISTS idx_notes_recordingId ON notes(recordingId);
  `);

  // Ensure recording directory exists
  const dir = FileSystem.documentDirectory + 'recordings/';
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const imgDir = FileSystem.documentDirectory + 'images/';
  const imgInfo = await FileSystem.getInfoAsync(imgDir);
  if (!imgInfo.exists) await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });
}

// ── Recordings ──────────────────────────────────────────────────────────────

function rowToRecording(row: Record<string, unknown>): Recording & { id: number } {
  return {
    id: row.id as number,
    title: row.title as string,
    duration: row.duration as number,
    audioPath: row.audioPath as string,
    transcript: row.transcript ? JSON.parse(row.transcript as string) as TranscriptSegment[] : undefined,
    summary: row.summary as string | undefined,
    actionItems: row.actionItems ? JSON.parse(row.actionItems as string) as ActionItem[] : undefined,
    mindMap: row.mindMap as string | undefined,
    tags: JSON.parse(row.tags as string),
    isFavorite: Boolean(row.isFavorite),
    language: (row.language as 'th' | 'en') ?? 'th',
    templateId: row.templateId as string | undefined,
    createdAt: row.createdAt as string,
  };
}

export async function saveRecording(
  r: Omit<Recording, 'id'>,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO recordings (title, duration, audioPath, tags, isFavorite, language, templateId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    r.title, r.duration, r.audioPath, JSON.stringify(r.tags),
    r.isFavorite ? 1 : 0, r.language, r.templateId ?? null, r.createdAt,
  );
  return result.lastInsertRowId;
}

export async function getRecording(id: number): Promise<(Recording & { id: number }) | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM recordings WHERE id = ?', id,
  );
  return row ? rowToRecording(row) : null;
}

export async function listRecordings(favoritesOnly = false): Promise<(Recording & { id: number })[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    favoritesOnly
      ? 'SELECT * FROM recordings WHERE isFavorite = 1 ORDER BY createdAt DESC'
      : 'SELECT * FROM recordings ORDER BY createdAt DESC',
  );
  return rows.map(rowToRecording);
}

export async function updateRecording(
  id: number,
  patch: Partial<Omit<Recording, 'id'>>,
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (patch.title !== undefined) { sets.push('title = ?'); vals.push(patch.title); }
  if (patch.duration !== undefined) { sets.push('duration = ?'); vals.push(patch.duration); }
  if (patch.transcript !== undefined) { sets.push('transcript = ?'); vals.push(JSON.stringify(patch.transcript)); }
  if (patch.summary !== undefined) { sets.push('summary = ?'); vals.push(patch.summary); }
  if (patch.actionItems !== undefined) { sets.push('actionItems = ?'); vals.push(JSON.stringify(patch.actionItems)); }
  if (patch.mindMap !== undefined) { sets.push('mindMap = ?'); vals.push(patch.mindMap); }
  if (patch.isFavorite !== undefined) { sets.push('isFavorite = ?'); vals.push(patch.isFavorite ? 1 : 0); }
  if (patch.language !== undefined) { sets.push('language = ?'); vals.push(patch.language); }
  if (patch.templateId !== undefined) { sets.push('templateId = ?'); vals.push(patch.templateId); }
  if (patch.tags !== undefined) { sets.push('tags = ?'); vals.push(JSON.stringify(patch.tags)); }

  if (sets.length === 0) return;
  vals.push(id);
  await db.runAsync(`UPDATE recordings SET ${sets.join(', ')} WHERE id = ?`, vals as SQLiteBindValue[]);
}

export async function deleteRecording(id: number): Promise<void> {
  const rec = await getRecording(id);
  if (rec) {
    await FileSystem.deleteAsync(rec.audioPath, { idempotent: true });
  }
  await db.runAsync('DELETE FROM recordings WHERE id = ?', id);
  await db.runAsync('DELETE FROM notes WHERE recordingId = ?', id);
}

// ── Notes ────────────────────────────────────────────────────────────────────

export async function saveNote(
  n: Omit<Note, 'id'>,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO notes (recordingId, timestamp, content, imagePaths) VALUES (?, ?, ?, ?)',
    n.recordingId, n.timestamp, n.content, JSON.stringify(n.imagePaths),
  );
  return result.lastInsertRowId;
}

export async function getNotes(recordingId: number): Promise<(Note & { id: number })[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM notes WHERE recordingId = ? ORDER BY timestamp ASC', recordingId,
  );
  return rows.map((r) => ({
    id: r.id as number,
    recordingId: r.recordingId as number,
    timestamp: r.timestamp as number,
    content: r.content as string,
    imagePaths: JSON.parse(r.imagePaths as string),
  }));
}

export async function updateNote(id: number, patch: Partial<Pick<Note, 'content' | 'imagePaths'>>): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.content !== undefined) { sets.push('content = ?'); vals.push(patch.content); }
  if (patch.imagePaths !== undefined) { sets.push('imagePaths = ?'); vals.push(JSON.stringify(patch.imagePaths)); }
  if (!sets.length) return;
  vals.push(id);
  await db.runAsync(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`, vals as SQLiteBindValue[]);
}

export async function deleteNote(id: number): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function listTemplates(): Promise<PromptTemplate[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM templates');
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    systemPrompt: r.systemPrompt as string,
    tags: JSON.parse(r.tags as string),
  }));
}

export async function saveTemplate(t: PromptTemplate): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO templates (id, name, description, systemPrompt, tags)
     VALUES (?, ?, ?, ?, ?)`,
    t.id, t.name, t.description, t.systemPrompt, JSON.stringify(t.tags),
  );
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.runAsync('DELETE FROM templates WHERE id = ?', id);
}
