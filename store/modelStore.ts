import { createTask, generateResponse } from '@/modules/expo-a5-mediapipe';
import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';
import MODELS from '../constants/Models';
import useDbStore from './dbStore';
import { ModelDownloadInfo, ModelState, ModelStatus } from './types';

interface ModelStoreState {
    models: Record<string, ModelState>;
    downloadingModels: Record<string, number>;
    activeTaskHandle: number | null;
    initializeModels: () => Promise<void>;
    loadModel: (modelName: string) => Promise<[boolean, null] | [null, Error]>;
    generate: (prompt: string) => Promise<[string | null, any | null]>;
    downloadModel: (model: ModelDownloadInfo) => Promise<[boolean | null, any | null]>;
    deleteModel: (modelName: string) => Promise<[boolean | null, any | null]>;
    setModelStatus: (modelName: string, status: ModelStatus) => void;
    setProgress: (modelName: string, progress: number) => void;
}

const useModelStore = create<ModelStoreState>((set, get) => ({
    models: {},
    downloadingModels: {},
    activeTaskHandle: null,
    initializeModels: async () => {
        console.log('ModelStore: Initializing models');
        const initialModels: Record<string, ModelState> = {};
        const { getModelStatus } = useDbStore.getState();
        for (const model of MODELS) {
            const [modelStatus, error] = await getModelStatus(model.name);
            const isDownloaded = modelStatus?.status === 'downloaded';
            console.log(`ModelStore: Model ${model.name} is ${isDownloaded ? 'downloaded' : 'not downloaded'}`);
            initialModels[model.name] = {
                model,
                status: isDownloaded ? 'downloaded' : 'not_downloaded',
            };
        }
        set({ models: initialModels });
    },
    loadModel: async (modelName) => {
        console.log(`ModelStore: Loading model ${modelName}`);
        const { getModelStatus } = useDbStore.getState();
        const [modelStatus, error] = await getModelStatus(modelName);
        if (error || !modelStatus || modelStatus.status !== 'downloaded' || !modelStatus.localPath) {
            return [null, new Error('Model not downloaded or local path not found.')];
        }

        const [taskHandle, createTaskError] = await createTask({ modelPath: modelStatus.localPath });

        if (createTaskError) {
            return [null, createTaskError];
        }

        set({ activeTaskHandle: taskHandle });
        return [true, null];
    },
    generate: async (prompt) => {
        const { activeTaskHandle } = get();
        if (!activeTaskHandle) {
            return [null, new Error('Model not loaded.')];
        }
        return await generateResponse(activeTaskHandle, prompt);
    },
    downloadModel: async (model) => {
        const { name, url } = model;
        const localPath = FileSystem.documentDirectory + name;
        const { setModelStatus, setProgress } = get();

        setModelStatus(name, 'downloading');

        const downloadResumable = FileSystem.createDownloadResumable(
            url,
            localPath,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                setProgress(name, progress);
            }
        );

        try {
            const result = await downloadResumable.downloadAsync();
            if (result) {
                console.log('Finished downloading to ', result.uri);
                setModelStatus(name, 'downloaded');
                const { setModelStatus: setDbModelStatus } = useDbStore.getState();
                await setDbModelStatus(name, 'downloaded', result.uri);
                return [true, null];
            } else {
                setModelStatus(name, 'error');
                return [null, new Error('Download failed.')];
            }
        } catch (e) {
            console.error(e);
            setModelStatus(name, 'error');
            return [null, e];
        }
    },
    deleteModel: async (modelName) => {
        const { setModelStatus } = get();
        const { deleteModel: deleteDbModel } = useDbStore.getState();
        const [success, error] = await deleteDbModel(modelName);
        if (success) {
            setModelStatus(modelName, 'not_downloaded');
            return [true, null];
        } else {
            return [null, error];
        }
    },
    setModelStatus: (modelName, status) =>
        set((state) => {
            const newDownloadingModels = { ...state.downloadingModels };
            if (status === 'downloading') {
                newDownloadingModels[modelName] = 0;
            } else {
                delete newDownloadingModels[modelName];
            }
            return {
                models: {
                    ...state.models,
                    [modelName]: { ...state.models[modelName], status },
                },
                downloadingModels: newDownloadingModels,
            };
        }),
    setProgress: (modelName, progress) =>
        set((state) => ({
            downloadingModels: {
                ...state.downloadingModels,
                [modelName]: progress,
            },
        })),
}));

export default useModelStore;