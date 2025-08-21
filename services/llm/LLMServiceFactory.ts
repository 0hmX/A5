import { MediaPipeLLMService } from './MediaPipeLLMService';
import { LLMService } from './types';

export class LLMServiceFactory {
    static getService(backendName: string): [LLMService, null] | [null, Error] {
        switch (backendName) {
            case 'google/mediapipe':
                return [new MediaPipeLLMService(), null];
            default:
                return [null, new Error(`Unsupported backend: ${backendName}`)];
        }
    }
}
