import MODELS from '@/constants/Models';
import ExpoLlmMediapipe from 'expo-llm-mediapipe';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppStatus, ChatMessage, ChatSession, ModelState, ModelStatus } from './types';
import { createSession, getAllSessions, insertMessage, getMessagesForSession } from '../db/database';

interface AppState {
    appStatus: AppStatus;
    errorMessage: string | null;
    models: Record<string, ModelState>;
    activeModel: string | null;
    progress: number;
    sessions: ChatSession[];
    activeSessionId: string | null;
    isDbInitialized: boolean; // Added
    setAppStatus: (status: AppStatus) => void;
    setError: (message: string) => void;
    clearError: () => void;
    initializeModels: () => void;
    setActiveModel: (name: string) => void;
    setModelStatus: (name: string, status: ModelStatus) => void;
    setProgress: (progress: number) => void;
    initializeSessions: () => Promise<void>;
    createNewSession: () => Promise<string | null>;
    setActiveSession: (sessionId: string) => void;
    addMessageToSession: (sessionId: string, message: ChatMessage) => Promise<void>;
    setDbInitialized: (initialized: boolean) => void; // Added
}

const useAppStore = create<AppState>((set, get) => ({
    appStatus: 'IDLE',
    errorMessage: null,
    models: {},
    activeModel: null,
    progress: 0,
    sessions: [],
    activeSessionId: null,
    isDbInitialized: false, // Added
    setAppStatus: (status: AppStatus) => set({ appStatus: status, errorMessage: null }),
    setError: (message: string) => set({ errorMessage: message, appStatus: 'ERROR' }),
    clearError: () => set({ errorMessage: null }),
    initializeModels: async () => {
        console.log('AppStore: Initializing models');
        const initialModels: Record<string, ModelState> = {};
        for (const model of MODELS) {
            const sanitizedModelName = model.name.replace(/\//g, '-');
            console.log(`AppStore: Checking if model ${sanitizedModelName} is downloaded`);
            const isDownloaded = await ExpoLlmMediapipe.isModelDownloaded(sanitizedModelName);
            console.log(`AppStore: Model ${sanitizedModelName} is ${isDownloaded ? 'downloaded' : 'not downloaded'}`);
            initialModels[model.name] = {
                model,
                status: isDownloaded ? 'downloaded' : 'not_downloaded',
            };
        }
        set({ models: initialModels });
    },
    setActiveModel: (name: string) => set({ activeModel: name }),
    setModelStatus: (name: string, status: ModelStatus) =>
        set((state) => ({
            models: {
                ...state.models,
                [name]: { ...state.models[name], status },
            },
        })),
    setProgress: (progress: number) => set({ progress }),
    initializeSessions: async () => {
        const [allDbSessions, error] = await getAllSessions();
        if (error) {
            get().setError(error.message);
            return;
        }

        let chatSessions: ChatSession[] = [];

        if (allDbSessions.length === 0) {
            const newSessionId = uuidv4();
            const [createdId, createError] = await createSession(newSessionId, 'Default Session');
            if (createError) {
                get().setError(createError.message);
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
        } else {
            for (const dbSession of allDbSessions) {
                const [messages, messagesError] = await getMessagesForSession(dbSession.id);
                if (messagesError) {
                    get().setError(messagesError.message);
                    return;
                }
                chatSessions.push({
                    ...dbSession,
                    history: messages,
                });
            }
        }
        set({ sessions: chatSessions, activeSessionId: chatSessions[0]?.id || null });
    },
    createNewSession: async (): Promise<string | null> => {
        console.log('AppStore: createNewSession started');
        const newSessionId = uuidv4();
        const newSessionName = `Session ${get().sessions.length + 1}`;
        console.log(`AppStore: Creating session in DB with id: ${newSessionId}`);
        const [createdId, createError] = await createSession(newSessionId, newSessionName);
        if (createError) {
            get().setError(createError.message);
            return null;
        }
        const newSession: ChatSession = {
            id: createdId!,
            name: newSessionName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [], // Add history back for in-memory state
        };
        console.log('AppStore: Calling set state to add new session');
        set((state) => {
            console.log('AppStore: Inside set state, new activeSessionId will be:', newSession.id);
            return { sessions: [...state.sessions, newSession], activeSessionId: newSession.id };
        });
        console.log('AppStore: createNewSession finished');
        return newSession.id;
    },
    setActiveSession: (sessionId: string) => {
        set({ activeSessionId: sessionId });
        // Load messages for the newly active session
        const sessionToActivate = get().sessions.find(s => s.id === sessionId);
        if (sessionToActivate && !sessionToActivate.history.length) {
            getMessagesForSession(sessionId).then(([messages, error]) => {
                if (error) {
                    get().setError(error.message);
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
        const [insertedId, error] = await insertMessage(message.id, sessionId, message.role, message.content);
        if (error) {
            get().setError(error.message);
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
    setDbInitialized: (initialized: boolean) => set({ isDbInitialized: initialized }), // Added
}));

export default useAppStore;

