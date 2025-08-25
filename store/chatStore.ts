import { create } from 'zustand';

interface ChatState {
    activeModel: string | null;
    setActiveModel: (name: string) => void;
}

const useChatStore = create<ChatState>((set) => ({
    activeModel: null,
    setActiveModel: (name: string) => set({ activeModel: name }),
}));

export default useChatStore;
