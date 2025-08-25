import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';

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

interface DbState {
  db: SQLite.SQLiteDatabase | null;
  isInitialized: boolean;
  init: () => Promise<[boolean, null] | [null, Error]>;
  getAllSessions: () => Promise<[Session[], null] | [null, Error]>;
  createSession: (id: string, name: string) => Promise<[string, null] | [null, Error]>;
  getMessagesForSession: (sessionId: string) => Promise<[Message[], null] | [null, Error]>;
  insertMessage: (id: string, sessionId: string, role: 'user' | 'model', content: string) => Promise<[string, null] | [null, Error]>;
  deleteSession: (sessionId: string) => Promise<[boolean, null] | [null, Error]>;
  getModelStatus: (modelName: string) => Promise<[{ status: string, localPath: string | null } | null, Error | null]>;
  setModelStatus: (modelName: string, status: string, localPath: string | null) => Promise<[boolean, null] | [null, Error]>;
  getAllModelStatus: () => Promise<[{ modelName: string, status: string, localPath: string | null }[], Error | null]>;
  deleteModel: (modelName: string) => Promise<[boolean, null] | [null, Error]>;
}

const useDbStore = create<DbState>((set, get) => ({
  db: null,
  isInitialized: false,
  init: async () => {
    try {
      console.log('DB: Opening database...');
      const db = await SQLite.openDatabaseAsync('main.db');
      console.log('DB: Database opened. Executing schema...');
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
          role TEXT NOT NULL CHECK(role IN ('user', 'model')),
          content TEXT NOT NULL,
          createdAt TEXT DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (sessionId) REFERENCES sessions (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS model_status (
          modelName TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          localPath TEXT
        );
      `);
      console.log('DB: Schema executed successfully.');
      set({ db, isInitialized: true });
      return [true, null];
    } catch (error) {
      console.error('DB: Error during initDB:', error);
      return [null, error as Error];
    }
  },
  getAllSessions: async () => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const allRows = await db.getAllAsync<Session>('SELECT * FROM sessions ORDER BY createdAt DESC;');
      return [allRows, null];
    } catch (error) {
      return [null, error as Error];
    }
  },
  createSession: async (id, name) => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      console.log(`DB: Creating session with id: ${id}, name: ${name}`);
      await db.runAsync('INSERT INTO sessions (id, name) VALUES (?, ?);', id, name);
      console.log(`DB: Session ${id} created successfully.`);
      return [id, null];
    } catch (error) {
      console.error(`DB: Error creating session ${id}:`, error);
      return [null, error as Error];
    }
  },
  getMessagesForSession: async (sessionId) => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const allRows = await db.getAllAsync<Message>(
        'SELECT * FROM messages WHERE sessionId = ? ORDER BY createdAt ASC;',
        sessionId
      );
      return [allRows, null];
    } catch (error) {
      return [null, error as Error];
    }
  },
  insertMessage: async (id, sessionId, role, content) => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
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
  },
  deleteSession: async (sessionId) => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const result = await db.runAsync('DELETE FROM sessions WHERE id = ?;', sessionId);
      return [result.changes > 0, null];
    } catch (error) {
      return [null, error as Error];
    }
  },
  getModelStatus: async (modelName) => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const result = await db.getFirstAsync<{ status: string, localPath: string | null }>('SELECT status, localPath FROM model_status WHERE modelName = ?;', modelName);
      return [result, null];
    } catch (error) {
      return [null, error as Error];
    }
  },
  setModelStatus: async (modelName, status, localPath) => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      await db.runAsync('INSERT OR REPLACE INTO model_status (modelName, status, localPath) VALUES (?, ?, ?);', modelName, status, localPath);
      return [true, null];
    } catch (error) {
      return [null, error as Error];
    }
  },
  getAllModelStatus: async () => {
    const { db } = get();
    if (!db) {
      return [[], new Error('Database not initialized.')];
    }
    try {
      const allRows = await db.getAllAsync<{ modelName: string, status: string, localPath: string | null }>('SELECT * FROM model_status;');
      return [allRows, null];
    } catch (error) {
      return [[], error as Error];
    }
  },
  deleteModel: async (modelName: string) => {
    const { db } = get();
    if (!db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const result = await db.runAsync('DELETE FROM model_status WHERE modelName = ?;', modelName);
      return [result.changes > 0, null];
    } catch (error) {
      return [null, error as Error];
    }
  },
}));

export default useDbStore;