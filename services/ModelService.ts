import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';
import { ModelDownloadInfo } from '../store/types';

interface ModelServiceState {
    models: Record<string, ModelDownloadInfo>;
    initializeService: () => Promise<[boolean | null, any | null]>;
    downloadModel: (model: ModelDownloadInfo) => Promise<[boolean | null, any | null]>;
    getModelLocalPath: (modelName: string) => Promise<[string | null, any | null]>;
    deleteModel: (modelName: string) => Promise<[boolean | null, any | null]>;
}

const useModelService = create<ModelServiceState>((set, get) => ({
    models: {},
    initializeService: async () => {
        // TODO: Implement offline detection
        return [true, null];
    },
    downloadModel: async (model) => {
        const { name, url } = model;
        const localPath = FileSystem.documentDirectory + name;

        set((state) => ({
            models: {
                ...state.models,
                [name]: { ...model, status: 'downloading', progress: 0, localPath },
            },
        }));

        const downloadResumable = FileSystem.createDownloadResumable(
            url,
            localPath,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                set((state) => ({
                    models: {
                        ...state.models,
                        [name]: { ...state.models[name], progress },
                    },
                }));
            }
        );

        try {
            const result = await downloadResumable.downloadAsync();
            if (result) {
                console.log('Finished downloading to ', result.uri);
                set((state) => ({
                    models: {
                        ...state.models,
                        [name]: { ...state.models[name], status: 'downloaded' },
                    },
                }));
                return [true, null];
            } else {
                set((state) => ({
                    models: {
                        ...state.models,
                        [name]: { ...state.models[name], status: 'error' },
                    },
                }));
                return [null, new Error('Download failed.')];
            }
        } catch (e) {
            console.error(e);
            set((state) => ({
                models: {
                    ...state.models,
                    [name]: { ...state.models[name], status: 'error' },
                },
            }));
            return [null, e];
        }
    },
    getModelLocalPath: async (modelName) => {
        const model = get().models[modelName];
        if (model && model.status === 'downloaded') {
            return [model.localPath, null];
        }
        return [null, 'Model not downloaded'];
    },
    deleteModel: async (modelName) => {
        const model = get().models[modelName];
        if (model && model.localPath) {
            try {
                await FileSystem.deleteAsync(model.localPath);
                set((state) => ({
                    models: {
                        ...state.models,
                        [modelName]: { ...model, status: 'not_downloaded', progress: 0, localPath: null },
                    },
                }));
                return [true, null];
            } catch (e) {
                console.error(e);
                return [null, e];
            }
        }
        return [null, 'Model not found'];
    },
}));

export default useModelService;
