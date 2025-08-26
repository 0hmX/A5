import { createTask, generateResponse } from '@/modules/expo-a5-mediapipe';
import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';
import MODELS from '../constants/Models';
import useDbStore from './dbStore';
import { ModelDownloadInfo, ModelState, ModelStatus } from './types';

interface ModelStoreState {
    models: Record<string, ModelState>;
    downloadingModels: Record<string, { progress: number; speedMbps: number | null }>;
    activeTaskHandle: number | null;
    loadedModelName: string | null;
    isInitialized: boolean;
    modelLoadTimeMs: number | null;
    generationTimeMs: number | null;
    initializeModels: () => Promise<void>;
    loadModel: (modelName: string) => Promise<[boolean, null] | [null, Error]>;
    generate: (prompt: string) => Promise<[string | null, any | null]>;
    downloadModel: (model: ModelDownloadInfo) => Promise<[boolean | null, any | null]>;
    deleteModel: (modelName: string) => Promise<[boolean | null, any | null]>;
    setModelStatus: (modelName: string, status: ModelStatus) => void;
    setDownloadProgress: (modelName: string, progress: number, speedMbps: number | null) => void;
}

const useModelStore = create<ModelStoreState>((set, get) => ({
    models: {},
    downloadingModels: {},
    activeTaskHandle: null,
    loadedModelName: null,
    isInitialized: false,
    modelLoadTimeMs: null,
    generationTimeMs: null,
    initializeModels: async () => {
        console.log('ModelStore/initializeModels: Starting initialization');
        const initialModels: Record<string, ModelState> = {};
        const { getModelStatus, deleteModel: deleteDbModel } = useDbStore.getState();
        console.log('ModelStore/initializeModels: Got dbStore functions');

        for (const model of MODELS) {
            console.log(`ModelStore/initializeModels: Processing model ${model.name}`);
            const [modelStatus, error] = await getModelStatus(model.name);
            console.log(`ModelStore/initializeModels: getModelStatus for ${model.name} returned:`, modelStatus, error);

            let isDownloaded = modelStatus?.status === 'downloaded';
            console.log(`ModelStore/initializeModels: Initial isDownloaded for ${model.name}: ${isDownloaded}`);

            if (isDownloaded && modelStatus?.localPath) {
                console.log(`ModelStore/initializeModels: Checking file existence at ${modelStatus.localPath}`);
                try {
                    const fileInfo = await FileSystem.getInfoAsync(modelStatus.localPath);
                    console.log(`ModelStore/initializeModels: FileInfo for ${model.name}:`, fileInfo);
                    isDownloaded = fileInfo.exists;
                    if (!fileInfo.exists) {
                        console.log(`ModelStore/initializeModels: File doesn't exist, deleting from DB`);
                        await deleteDbModel(model.name);
                        isDownloaded = false;
                    }
                } catch (fileCheckError) {
                    console.log(`ModelStore/initializeModels: File check error for ${model.name}:`, fileCheckError);
                    isDownloaded = false;
                }
            }

            console.log(`ModelStore/initializeModels: Final status for ${model.name}: ${isDownloaded ? 'downloaded' : 'not_downloaded'}`);
            initialModels[model.name] = {
                model,
                status: isDownloaded ? 'downloaded' : 'not_downloaded',
            };
        }
        console.log('ModelStore/initializeModels: Setting models state:', initialModels);
        set({ models: initialModels, isInitialized: true });
        console.log('ModelStore/initializeModels: Initialization complete');
    },
    loadModel: async (modelName) => {
        console.log(`ModelStore/loadModel: Starting to load model ${modelName}`);
        const { getModelStatus } = useDbStore.getState();
        const [modelStatus, error] = await getModelStatus(modelName);
        console.log(`ModelStore/loadModel: Model status from DB:`, modelStatus, error);

        if (error || !modelStatus || modelStatus.status !== 'downloaded' || !modelStatus.localPath) {
            console.log(`ModelStore/loadModel: Model not ready - error: ${error}, status: ${modelStatus?.status}, path: ${modelStatus?.localPath}`);
            return [null, new Error('Model not downloaded or local path not found.')];
        }

        console.log(`ModelStore/loadModel: Creating task with path: ${modelStatus.localPath}`);
        const startTime = performance.now();

        const [taskHandle, createTaskError] = await createTask({ modelPath: modelStatus.localPath });

        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`ModelStore/loadModel: Model loaded in ${duration.toFixed(2)} ms.`);

        if (createTaskError) {
            console.log(`ModelStore/loadModel: Task creation failed with error: ${createTaskError}`);
            set({ modelLoadTimeMs: null });
            return [null, Error(createTaskError)];
        }

        console.log(`ModelStore/loadModel: Setting activeTaskHandle to ${taskHandle}`);
        set({ activeTaskHandle: taskHandle, modelLoadTimeMs: duration, loadedModelName: modelName });
        const state = get();
        console.log(`ModelStore/loadModel: Current activeTaskHandle after set: ${state.activeTaskHandle}`);
        return [true, null];
    },
    generate: async (prompt) => {
        console.log(`ModelStore/generate: Starting generation with prompt: ${prompt}`);
        const { activeTaskHandle } = get();
        console.log(`ModelStore/generate: Current activeTaskHandle: ${activeTaskHandle}`);

        if (activeTaskHandle === null) {  // Changed from !activeTaskHandle
            console.log('ModelStore/generate: No active task handle found');
            return [null, new Error('Model not loaded.')];
        }

        console.log(`ModelStore/generate: Calling generateResponse with handle ${activeTaskHandle}`);
        const startTime = performance.now();

        const result = await generateResponse(activeTaskHandle, prompt);

        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`ModelStore/generate: Generation finished in ${duration.toFixed(2)} ms.`);
        set({ generationTimeMs: duration });

        console.log('ModelStore/generate: generateResponse returned:', result);
        return result;
    },
    downloadModel: async (model) => {
        console.log(`ModelStore/downloadModel: Starting download for ${model.name}`);
        const { name, url } = model;
        const localPath = FileSystem.documentDirectory + name + model.extension;
        console.log(`ModelStore/downloadModel: Local path will be ${localPath}`);
        const { setModelStatus, setDownloadProgress } = get();

        setModelStatus(name, 'downloading');
        console.log(`ModelStore/downloadModel: Set status to downloading`);

        let lastTimestamp = Date.now();
        let lastBytesWritten = 0;

        const downloadResumable = FileSystem.createDownloadResumable(
            url,
            localPath,
            {},
            (downloadProgress) => {
                const now = Date.now();
                const timeDelta = now - lastTimestamp; // in ms
                const bytesDelta = downloadProgress.totalBytesWritten - lastBytesWritten;
                
                let speedMbps = null;
                if (timeDelta > 500) { // Only update speed every 500ms
                    const speedBps = bytesDelta / (timeDelta / 1000); // bytes per second
                    speedMbps = (speedBps * 8) / 1_000_000; // megabits per second
                    lastTimestamp = now;
                    lastBytesWritten = downloadProgress.totalBytesWritten;
                }

                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                const currentSpeed = get().downloadingModels[name]?.speedMbps;
                setDownloadProgress(name, progress, speedMbps === null ? currentSpeed : speedMbps);
            }
        );

        try {
            console.log(`ModelStore/downloadModel: Starting download`);
            const result = await downloadResumable.downloadAsync();
            console.log(`ModelStore/downloadModel: Download result:`, result);

            if (result) {
                console.log(`ModelStore/downloadModel: Download successful to ${result.uri}`);
                setModelStatus(name, 'downloaded');
                const { setModelStatus: setDbModelStatus } = useDbStore.getState();
                await setDbModelStatus(name, 'downloaded', result.uri);
                console.log(`ModelStore/downloadModel: Updated DB status`);
                return [true, null];
            } else {
                console.log(`ModelStore/downloadModel: Download failed - no result`);
                setModelStatus(name, 'error');
                return [null, new Error('Download failed.')];
            }
        } catch (e) {
            console.log(`ModelStore/downloadModel: Download error:`, e);
            setModelStatus(name, 'error');
            return [null, e];
        }
    },
    deleteModel: async (modelName) => {
        console.log(`ModelStore/deleteModel: Deleting model ${modelName}`);
        const { setModelStatus, loadedModelName } = get();
        const { deleteModel: deleteDbModel } = useDbStore.getState();
        const [success, error] = await deleteDbModel(modelName);
        console.log(`ModelStore/deleteModel: Delete result - success: ${success}, error:`, error);

        if (success) {
            setModelStatus(modelName, 'not_downloaded');
            if (modelName === loadedModelName) {
                set({ activeTaskHandle: null, loadedModelName: null, modelLoadTimeMs: null });
            }
            console.log(`ModelStore/deleteModel: Set status to not_downloaded`);
            return [true, null];
        } else {
            console.log(`ModelStore/deleteModel: Delete failed`);
            return [null, error];
        }
    },
    setModelStatus: (modelName, status) => {
        console.log(`ModelStore/setModelStatus: Setting ${modelName} to ${status}`);
        set((state) => {
            const newDownloadingModels = { ...state.downloadingModels };
            if (status === 'downloading') {
                newDownloadingModels[modelName] = { progress: 0, speedMbps: null };
            } else {
                delete newDownloadingModels[modelName];
            }
            console.log(`ModelStore/setModelStatus: Updated downloadingModels:`, newDownloadingModels);
            return {
                models: {
                    ...state.models,
                    [modelName]: { ...state.models[modelName], status },
                },
                downloadingModels: newDownloadingModels,
            };
        });
    },
    setDownloadProgress: (modelName, progress, speedMbps) => {
        set((state) => ({
            downloadingModels: {
                ...state.downloadingModels,
                [modelName]: { progress, speedMbps },
            },
        }));
    },
}));

export default useModelStore;