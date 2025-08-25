import useModelStore from '@/store/modelStore'; // Import useModelStore
import { ModelDownloadInfo } from '@/store/types';

export function useModelManager(modelName: string) {
    const { models, downloadingModels, downloadModel, deleteModel } = useModelStore();

    const model = models[modelName];

    const status = downloadingModels[modelName] ? 'downloading' : model?.status || 'not_downloaded';
    const progress = downloadingModels[modelName] || 0;

    return {
        status,
        progress,
        downloadModel: (modelInfo: ModelDownloadInfo) => downloadModel(modelInfo),
        deleteModel: () => deleteModel(modelName),
    };
}