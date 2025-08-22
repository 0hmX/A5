import { MediaPipeLLMService } from './MediaPipeLLMService';
import { LLMService } from './types';
import MODELS from '../../constants/Models';

export class LLMServiceFactory {
    static getService(modelName: string): [LLMService, null] | [null, Error] {
        const model = MODELS.find(model => model.name === modelName);

        if (!model) {
            return [null, new Error(`Unsupported model: ${modelName}`)];
        }

        switch (model.backend) {
            case 'mediapipe':
                return [new MediaPipeLLMService(), null];
            default:
                return [null, new Error(`Unsupported backend: ${model.backend}`)];
        }
    }
}
