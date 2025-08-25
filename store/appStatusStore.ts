import { create } from 'zustand';
import { AppStatus } from './types';

interface AppStatusState {
    appStatus: AppStatus;
    errorMessage: string | null;
    setAppStatus: (status: AppStatus) => void;
    setError: (message: string) => void;
    clearError: () => void;
}

const useAppStatusStore = create<AppStatusState>((set) => ({
    appStatus: 'IDLE',
    errorMessage: null,
    setAppStatus: (status: AppStatus) => set({ appStatus: status, errorMessage: null }),
    setError: (message: string) => set({ errorMessage: message, appStatus: 'ERROR' }),
    clearError: () => set({ errorMessage: null }),
}));

export default useAppStatusStore;
