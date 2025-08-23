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

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<[boolean, null] | [null, Error]> {
    try {
      console.log('DB: Opening database...');
      this.db = await SQLite.openDatabaseAsync('main.db');
      console.log('DB: Database opened. Executing schema...');
      await this.db.execAsync(`
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
      `);
      console.log('DB: Schema executed successfully.');
      return [true, null];
    } catch (error) {
      console.error('DB: Error during initDB:', error);
      return [null, error as Error];
    }
  }

  async getAllSessions(): Promise<[Session[], null] | [null, Error]> {
    if (!this.db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const allRows = await this.db.getAllAsync<Session>('SELECT * FROM sessions ORDER BY createdAt DESC;');
      return [allRows, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  async createSession(id: string, name: string): Promise<[string, null] | [null, Error]> {
    if (!this.db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      console.log(`DB: Creating session with id: ${id}, name: ${name}`);
      await this.db.runAsync('INSERT INTO sessions (id, name) VALUES (?, ?);', id, name);
      console.log(`DB: Session ${id} created successfully.`);
      return [id, null];
    } catch (error) {
      console.error(`DB: Error creating session ${id}:`, error);
      return [null, error as Error];
    }
  }

  async getMessagesForSession(sessionId: string): Promise<[Message[], null] | [null, Error]> {
    if (!this.db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const allRows = await this.db.getAllAsync<Message>(
        'SELECT * FROM messages WHERE sessionId = ? ORDER BY createdAt ASC;',
        sessionId
      );
      return [allRows, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  async insertMessage(id: string, sessionId: string, role: 'user' | 'model', content: string): Promise<[string, null] | [null, Error]> {
    if (!this.db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      await this.db.runAsync(
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
  }

  async deleteSession(sessionId: string): Promise<[boolean, null] | [null, Error]> {
    if (!this.db) {
      return [null, new Error('Database not initialized.')];
    }
    try {
      const result = await this.db.runAsync('DELETE FROM sessions WHERE id = ?;', sessionId);
      return [result.changes > 0, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
