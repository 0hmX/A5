import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import useDbStore from './dbStore';
import { ChatMessage, ChatSession } from './types';

interface SessionState {
    sessions: ChatSession[];
    activeSessionId: string | null;
    initializeSessions: () => Promise<void>;
    createNewSession: () => Promise<string | null>;
    setActiveSession: (sessionId: string) => void;
    addMessageToSession: (sessionId: string, message: ChatMessage) => Promise<void>;
    renameSession: (sessionId: string, newName: string) => Promise<void>;
}

const useSessionStore = create<SessionState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    initializeSessions: async () => {
        console.log('SessionStore: initializeSessions started');
        const { getAllSessions, createSession, getMessagesForSession } = useDbStore.getState();
        const [allDbSessions, error] = await getAllSessions();
        if (error) {
            console.error('SessionStore: Error getting all sessions:', error.message);
            return;
        }
        console.log('SessionStore: Got all sessions from DB:', allDbSessions);

        let chatSessions: ChatSession[] = [];

        if (allDbSessions.length === 0) {
            console.log('SessionStore: No sessions found, creating default session');
            const newSessionId = uuidv4();
            const [createdId, createError] = await createSession(newSessionId, 'Default Session');
            if (createError) {
                console.error('SessionStore: Error creating default session:', createError.message);
                return;
            }
            const newSession: ChatSession = {
                id: createdId!,
                name: 'Default Session',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: [],
            };
            chatSessions.push(newSession);
            console.log('SessionStore: Default session created:', newSession);
        } else {
            console.log('SessionStore: Loading messages for existing sessions');
            for (const dbSession of allDbSessions) {
                const [messages, messagesError] = await getMessagesForSession(dbSession.id);
                if (messagesError) {
                    console.error(`SessionStore: Error getting messages for session ${dbSession.id}:`, messagesError.message);
                    return;
                }
                chatSessions.push({
                    ...dbSession,
                    history: messages,
                });
                console.log(`SessionStore: Loaded ${messages.length} messages for session ${dbSession.id}`);
            }
        }
        set({ sessions: chatSessions, activeSessionId: chatSessions[0]?.id || null });
        console.log('SessionStore: initializeSessions finished. Sessions in store:', chatSessions);
    },
    createNewSession: async (): Promise<string | null> => {
        console.log('SessionStore: createNewSession started');
        const { createSession } = useDbStore.getState();
        const newSessionId = uuidv4();
        const newSessionName = `New Session`;
        console.log(`SessionStore: Creating session in DB with id: ${newSessionId}`);
        const [createdId, createError] = await createSession(newSessionId, newSessionName);
        if (createError) {
            return null;
        }
        const newSession: ChatSession = {
            id: createdId!,
            name: newSessionName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [],
        };
        console.log('SessionStore: Calling set state to add new session');
        set((state) => {
            console.log('SessionStore: Inside set state, new activeSessionId will be:', newSession.id);
            return { sessions: [...state.sessions, newSession], activeSessionId: newSession.id };
        });
        console.log('SessionStore: createNewSession finished');
        return newSession.id;
    },
    setActiveSession: (sessionId: string) => {
        set({ activeSessionId: sessionId });
        const sessionToActivate = get().sessions.find(s => s.id === sessionId);
        if (sessionToActivate && !sessionToActivate.history.length) {
            const { getMessagesForSession } = useDbStore.getState();
            getMessagesForSession(sessionId).then(([messages, error]) => {
                if (error) {
                    return;
                }
                set((state) => ({
                    sessions: state.sessions.map(s =>
                        s.id === sessionId ? { ...s, history: messages } : s
                    )
                }));
            });
        }
    },
    addMessageToSession: async (sessionId: string, message: ChatMessage) => {
        const { insertMessage } = useDbStore.getState();
        const [insertedId, error] = await insertMessage(
            message.id,
            sessionId,
            message.role,
            message.content,
            message.modelName,
            message.generationTimeMs
        );
        if (error) {
            return;
        }
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === sessionId
                    ? { ...session, history: [...session.history, message] }
                    : session
            ),
        }));
    },
    renameSession: async (sessionId: string, newName: string) => {
        console.log(`SessionStore: Attempting to rename session ${sessionId} to "${newName}"`);
        const { updateSessionName } = useDbStore.getState();
        const [_, error] = await updateSessionName(sessionId, newName);
        if (error) {
            console.error('SessionStore: Error renaming session in DB:', error.message);
            return;
        }
        set((state) => {
            console.log(`SessionStore: Successfully renamed session ${sessionId} in state.`);
            return {
                sessions: state.sessions.map((session) =>
                    session.id === sessionId ? { ...session, name: newName } : session
                ),
            }
        });
    },
}));

export default useSessionStore;
