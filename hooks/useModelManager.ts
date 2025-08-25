import useModelService from '../services/ModelService';
import { ModelDownloadInfo } from '../store/types';

export function useModelManager(modelName: string) {
    const { models, downloadModel, deleteModel } = useModelService();

    const model = models[modelName];

    return {
        status: model?.status || 'not_downloaded',
        progress: model?.progress || 0,
        downloadModel: (modelInfo: ModelDownloadInfo) => downloadModel(modelInfo),
        deleteModel: () => deleteModel(modelName),
    };
}
