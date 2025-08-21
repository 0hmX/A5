import { MediaPipeLLMService } from './MediaPipeLLMService';
import { LLMService } from './types';
import MODELS from '../../constants/Models';

export class LLMServiceFactory {
    static getService(modelName: string): [LLMService, null] | [null, Error] {
        const backend = MODELS.find(backend => backend.models.some(model => model.name === modelName));

        if (!backend) {
            return [null, new Error(`Unsupported model: ${modelName}`)];
        }

        switch (backend.name) {
            case 'google/mediapipe':
                return [new MediaPipeLLMService(), null];
            default:
                return [null, new Error(`Unsupported backend: ${backend.name}`)];
        }
    }
}
