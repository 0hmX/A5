import * as SQLite from 'expo-sqlite';

export type Session = {
  id: number;
  name: string;
  createdAt: string;
};

export type Message = {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

let db: SQLite.SQLiteDatabase;

export const initDB = async (): Promise<[boolean, null] | [null, Error]> => {
  try {
    db = await SQLite.openDatabaseAsync('main.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (sessionId) REFERENCES sessions (id) ON DELETE CASCADE
      );
    `);
    return [true, null];
  } catch (error) {
    return [null, error as Error];
  }
};

export const getAllSessions = async (): Promise<[Session[], null] | [null, Error]> => {
  try {
    const allRows = await db.getAllAsync<Session>('SELECT * FROM sessions ORDER BY createdAt DESC;');
    return [allRows, null];
  } catch (error) {
    return [null, error as Error];
  }
};

export const createSession = async (name: string): Promise<[number, null] | [null, Error]> => {
  try {
    const result = await db.runAsync('INSERT INTO sessions (name) VALUES (?);', name);
    return [result.lastInsertRowId, null];
  } catch (error) {
    return [null, error as Error];
  }
};

export const getMessagesForSession = async (sessionId: number): Promise<[Message[], null] | [null, Error]> => {
  try {
    const allRows = await db.getAllAsync<Message>(
      'SELECT * FROM messages WHERE sessionId = ? ORDER BY createdAt ASC;',
      sessionId
    );
    return [allRows, null];
  } catch (error) {
    return [null, error as Error];
  }
};

export const insertMessage = async (sessionId: number, role: 'user' | 'assistant', content: string): Promise<[number, null] | [null, Error]> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO messages (sessionId, role, content) VALUES (?, ?, ?);',
      sessionId,
      role,
      content
    );
    return [result.lastInsertRowId, null];
  } catch (error) {
    return [null, error as Error];
  }
};

export const deleteSession = async (sessionId: number): Promise<[boolean, null] | [null, Error]> => {
  try {
    const result = await db.runAsync('DELETE FROM sessions WHERE id = ?;', sessionId);
    return [result.changes > 0, null];
  } catch (error) {
    return [null, error as Error];
  }
};