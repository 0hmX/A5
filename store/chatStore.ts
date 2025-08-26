import { create } from 'zustand';
import useDbStore from './dbStore';

interface ChatState {
    activeModel: string | null;
    setActiveModel: (name: string) => void;
}

const useChatStore = create<ChatState>((set) => ({
    activeModel: null,
    setActiveModel: (name: string) => {
        set({ activeModel: name });
        useDbStore.getState().recordModelUsage(name);
    },
}));

export default useChatStore;