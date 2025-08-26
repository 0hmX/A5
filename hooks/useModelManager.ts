import useModelStore from '@/store/modelStore'; // Import useModelStore
import { ModelDownloadInfo } from '@/store/types';

export function useModelManager(modelName: string) {
    const { models, downloadingModels, downloadModel, deleteModel } = useModelStore();

    const model = models[modelName];
    const downloadStatus = downloadingModels[modelName];

    const status = downloadStatus ? 'downloading' : model?.status || 'not_downloaded';
    const progress = downloadStatus?.progress || 0;
    const speedMbps = downloadStatus?.speedMbps || null;

    return {
        status,
        progress,
        speedMbps,
        downloadModel: (modelInfo: ModelDownloadInfo) => downloadModel(modelInfo),
        deleteModel: () => deleteModel(modelName),
    };
}