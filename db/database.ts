import * as SQLite from 'expo-sqlite';

export type Session = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
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
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now', 'localtime')),
        updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
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

export const createSession = async (id: string, name: string): Promise<[string, null] | [null, Error]> => {
  try {
    await db.runAsync('INSERT INTO sessions (id, name) VALUES (?, ?);', id, name);
    return [id, null];
  } catch (error) {
    return [null, error as Error];
  }
};

export const getMessagesForSession = async (sessionId: string): Promise<[Message[], null] | [null, Error]> => {
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

export const insertMessage = async (id: string, sessionId: string, role: 'user' | 'model', content: string): Promise<[string, null] | [null, Error]> => {
  try {
    await db.runAsync(
      'INSERT INTO messages (id, sessionId, role, content) VALUES (?, ?, ?, ?);',
      id,
      sessionId,
      role,
      content
    );
    return [id, null];
  } catch (error) {
    return [null, error as Error];
  }
};

export const deleteSession = async (sessionId: string): Promise<[boolean, null] | [null, Error]> => {
  try {
    const result = await db.runAsync('DELETE FROM sessions WHERE id = ?;', sessionId);
    return [result.changes > 0, null];
  } catch (error) {
    return [null, error as Error];
  }
};