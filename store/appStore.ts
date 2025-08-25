import MODELS from '@/constants/Models';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppStatus, ChatMessage, ChatSession, ModelState, ModelStatus } from './types';
import serviceLocator from '../lib/di/ServiceLocator';
import { DatabaseService } from '../services/DatabaseService';
import useModelService from '../services/ModelService';

interface AppState {
    appStatus: AppStatus;
    errorMessage: string | null;
    models: Record<string, ModelState>;
    activeModel: string | null;
    progress: number;
    sessions: ChatSession[];
    activeSessionId: string | null;
    downloadingModels: Record<string, number>;
    setAppStatus: (status: AppStatus) => void;
    setError: (message: string) => void;
    clearError: () => void;
    initializeModels: () => void;
    setActiveModel: (name: string) => void;
    setModelStatus: (name: string, status: ModelStatus) => void;
    setProgress: (modelName: string, progress: number) => void;
    initializeSessions: () => Promise<void>;
    createNewSession: () => Promise<string | null>;
    setActiveSession: (sessionId: string) => void;
    addMessageToSession: (sessionId: string, message: ChatMessage) => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
    appStatus: 'IDLE',
    errorMessage: null,
    models: {},
    activeModel: null,
    progress: 0,
    sessions: [],
    activeSessionId: null,
    downloadingModels: {},
    setAppStatus: (status: AppStatus) => set({ appStatus: status, errorMessage: null }),
    setError: (message: string) => set({ errorMessage: message, appStatus: 'ERROR' }),
    clearError: () => set({ errorMessage: null }),
    initializeModels: async () => {
        console.log('AppStore: Initializing models');
        const initialModels: Record<string, ModelState> = {};
        const modelService = useModelService.getState();
        for (const model of MODELS) {
            const [localPath, error] = await modelService.getModelLocalPath(model.name);
            const isDownloaded = localPath && !error;
            console.log(`AppStore: Model ${model.name} is ${isDownloaded ? 'downloaded' : 'not downloaded'}`);
            initialModels[model.name] = {
                model,
                status: isDownloaded ? 'downloaded' : 'not_downloaded',
            };
        }
        set({ models: initialModels });
    },
    setActiveModel: (name: string) => set({ activeModel: name }),
    setModelStatus: (name: string, status: ModelStatus) =>
        set((state) => {
            const newDownloadingModels = { ...state.downloadingModels };
            if (status === 'downloading') {
                newDownloadingModels[name] = 0;
            } else {
                delete newDownloadingModels[name];
            }
            return {
                models: {
                    ...state.models,
                    [name]: { ...state.models[name], status },
                },
                downloadingModels: newDownloadingModels,
            };
        }),
    setProgress: (modelName: string, progress: number) =>
        set((state) => ({
            downloadingModels: {
                ...state.downloadingModels,
                [modelName]: progress,
            },
        })),
    initializeSessions: async () => {
        console.log('AppStore: initializeSessions started');
        const dbService = serviceLocator.get<DatabaseService>('DatabaseService');
        const [allDbSessions, error] = await dbService.getAllSessions();
        if (error) {
            console.error('AppStore: Error getting all sessions:', error.message);
            get().setError(error.message);
            return;
        }
        console.log('AppStore: Got all sessions from DB:', allDbSessions);

        let chatSessions: ChatSession[] = [];

        if (allDbSessions.length === 0) {
            console.log('AppStore: No sessions found, creating default session');
            const newSessionId = uuidv4();
            const [createdId, createError] = await dbService.createSession(newSessionId, 'Default Session');
            if (createError) {
                console.error('AppStore: Error creating default session:', createError.message);
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
            console.log('AppStore: Default session created:', newSession);
        } else {
            console.log('AppStore: Loading messages for existing sessions');
            for (const dbSession of allDbSessions) {
                const [messages, messagesError] = await dbService.getMessagesForSession(dbSession.id);
                if (messagesError) {
                    console.error(`AppStore: Error getting messages for session ${dbSession.id}:`, messagesError.message);
                    get().setError(messagesError.message);
                    return;
                }
                chatSessions.push({
                    ...dbSession,
                    history: messages,
                });
                console.log(`AppStore: Loaded ${messages.length} messages for session ${dbSession.id}`);
            }
        }
        set({ sessions: chatSessions, activeSessionId: chatSessions[0]?.id || null });
        console.log('AppStore: initializeSessions finished. Sessions in store:', chatSessions);
    },
    createNewSession: async (): Promise<string | null> => {
        console.log('AppStore: createNewSession started');
        const dbService = serviceLocator.get<DatabaseService>('DatabaseService');
        const newSessionId = uuidv4();
        const newSessionName = `Session ${get().sessions.length + 1}`;
        console.log(`AppStore: Creating session in DB with id: ${newSessionId}`);
        const [createdId, createError] = await dbService.createSession(newSessionId, newSessionName);
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
            const dbService = serviceLocator.get<DatabaseService>('DatabaseService');
            dbService.getMessagesForSession(sessionId).then(([messages, error]) => {
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
        const dbService = serviceLocator.get<DatabaseService>('DatabaseService');
        const [insertedId, error] = await dbService.insertMessage(message.id, sessionId, message.role, message.content);
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
}));

export default useAppStore;
