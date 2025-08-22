import MODELS from '@/constants/Models';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppStatus, ChatMessage, ChatSession, ModelState, ModelStatus } from './types';

interface AppState {
    appStatus: AppStatus;
    errorMessage: string | null;
    models: Record<string, ModelState>;
    activeModel: string | null;
    progress: number;
    sessions: ChatSession[];
    activeSessionId: string | null;
    setAppStatus: (status: AppStatus) => void;
    setError: (message: string) => void;
    clearError: () => void;
    initializeModels: () => void;
    setActiveModel: (name: string) => void;
    setModelStatus: (name: string, status: ModelStatus) => void;
    setProgress: (progress: number) => void;
    initializeSessions: () => void;
    createNewSession: () => void;
    setActiveSession: (sessionId: string) => void;
    addMessageToSession: (sessionId: string, message: ChatMessage) => void;
}

const useAppStore = create<AppState>((set, get) => ({
    appStatus: 'IDLE',
    errorMessage: null,
    models: {},
    activeModel: null,
    progress: 0,
    sessions: [],
    activeSessionId: null,
    setAppStatus: (status: AppStatus) => set({ appStatus: status, errorMessage: null }),
    setError: (message: string) => set({ errorMessage: message, appStatus: 'ERROR' }),
    clearError: () => set({ errorMessage: null }),
    initializeModels: () => {
        const initialModels: Record<string, ModelState> = {};
        MODELS.forEach((backend) => {
            backend.models.forEach((model) => {
                initialModels[model.name] = {
                    model,
                    status: 'not_downloaded',
                };
            });
        });
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
    initializeSessions: () => {
        if (get().sessions.length === 0) {
            const newSession: ChatSession = {
                id: uuidv4(),
                name: 'Default Session',
                history: [],
            };
            set({ sessions: [newSession], activeSessionId: newSession.id });
        }
    },
    createNewSession: () => {
        const newSession: ChatSession = {
            id: uuidv4(),
            name: `Session ${get().sessions.length + 1}`,
            history: [],
        };
        set((state) => ({ sessions: [...state.sessions, newSession], activeSessionId: newSession.id }));
    },
    setActiveSession: (sessionId: string) => set({ activeSessionId: sessionId }),
    addMessageToSession: (sessionId: string, message: ChatMessage) => {
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

