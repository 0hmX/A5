import MODELS from '@/constants/Models';
import { create } from 'zustand';
import { AppStatus, Model, ModelState, ModelStatus } from './types';

interface AppState {
    appStatus: AppStatus;
    errorMessage: string | null;
    models: Record<string, ModelState>;
    activeModel: string | null;
    progress: number;
    setAppStatus: (status: AppStatus) => void;
    setError: (message: string) => void;
    clearError: () => void;
    initializeModels: () => void;
    setActiveModel: (name: string) => void;
    setModelStatus: (name: string, status: ModelStatus) => void;
    setProgress: (progress: number) => void;
}

const useAppStore = create<AppState>((set) => ({
    appStatus: 'IDLE',
    errorMessage: null,
    models: {},
    activeModel: null,
    progress: 0,
    setAppStatus: (status: AppStatus) => set({ appStatus: status, errorMessage: null }),
    setError: (message: string) => set({ errorMessage: message, appStatus: 'ERROR' }),
    clearError: () => set({ errorMessage: null }),
    initializeModels: () => {
        const initialModels: Record<string, ModelState> = {};
        MODELS.mediapipe.forEach((model) => {
            initialModels[model.name] = {
                model: model as Model,
                status: 'not_downloaded', 
            };
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
}));

export default useAppStore;
