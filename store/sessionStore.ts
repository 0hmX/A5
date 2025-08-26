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
            // You might want to set an error state here
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
                // You might want to set an error state here
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
                    // You might want to set an error state here
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
        const newSessionName = `Session ${get().sessions.length + 1}`;
        console.log(`SessionStore: Creating session in DB with id: ${newSessionId}`);
        const [createdId, createError] = await createSession(newSessionId, newSessionName);
        if (createError) {
            // You might want to set an error state here
            return null;
        }
        const newSession: ChatSession = {
            id: createdId!,
            name: newSessionName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [], // Add history back for in-memory state
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
        // Load messages for the newly active session
        const sessionToActivate = get().sessions.find(s => s.id === sessionId);
        if (sessionToActivate && !sessionToActivate.history.length) {
            const { getMessagesForSession } = useDbStore.getState();
            getMessagesForSession(sessionId).then(([messages, error]) => {
                if (error) {
                    // You might want to set an error state here
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
            // You might want to set an error state here
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
}));

export default useSessionStore;
