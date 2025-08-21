import MODELS from '@/constants/Models';
import ExpoLlmMediapipe, {
    NativeModuleSubscription,
} from 'expo-llm-mediapipe';
import { LLMService } from './types';

export class MediaPipeLLMService implements LLMService {
    private modelHandle: number | null = null;
    private requestIdCounter = 0;

    async loadModel(
        modelName: string,
        options: {
            maxTokens?: number;
            topK?: number;
            temperature?: number;
            randomSeed?: number;
        }
    ): Promise<[void, null] | [null, Error]> {
        try {
            if (this.modelHandle !== null) {
                await this.unloadModel();
            }
            const handle = await ExpoLlmMediapipe.createModelFromDownloaded(
                modelName,
                options.maxTokens,
                options.topK,
                options.temperature,
                options.randomSeed
            );
            this.modelHandle = handle;
            return [undefined, null];
        } catch (e: any) {
            return [null, e];
        }
    }

    async generate(prompt: string): Promise<[string, null] | [null, Error]> {
        if (this.modelHandle === null) {
            return [null, new Error('Model not loaded.')];
        }
        try {
            const requestId = ++this.requestIdCounter;
            const result = await ExpoLlmMediapipe.generateResponse(
                this.modelHandle,
                requestId,
                prompt
            );
            return [result, null];
        } catch (e: any) {
            return [null, e];
        }
    }

    async generateStream(
        prompt: string,
        onToken: (token: string) => void
    ): Promise<[void, null] | [null, Error]> {
        if (this.modelHandle === null) {
            return [null, new Error('Model not loaded.')];
        }
        try {
            const requestId = ++this.requestIdCounter;

            ExpoLlmMediapipe.addListener('onPartialResponse', (event) => {
                if (event.handle === this.modelHandle && event.requestId === requestId) {
                    onToken(event.response);
                }
            });

            ExpoLlmMediapipe.addListener('onErrorResponse', (event) => {
                if (event.handle === this.modelHandle && event.requestId === requestId) {
                    console.error(`Stream error for request ${requestId}: ${event.error}`);
                }
            });

            await ExpoLlmMediapipe.generateResponseAsync(
                this.modelHandle,
                requestId,
                prompt
            );

            return [undefined, null];
        } catch (e: any) {
            return [null, e];
        }
    }

    async unloadModel(): Promise<[void, null] | [null, Error]> {
        if (this.modelHandle === null) {
            return [undefined, null];
        }
        try {
            await ExpoLlmMediapipe.releaseModel(this.modelHandle);
            this.modelHandle = null;
            return [undefined, null];
        } catch (e: any) {
            return [null, e];
        }
    }

    async downloadModel(
        modelName: string,
        onProgress: (progress: number) => void
    ): Promise<[string, null] | [null, Error]> {
        const model = MODELS.mediapipe.find((m) => m.name === modelName);

        if (!model || !model.links) {
            return [null, new Error('Invalid model name or missing link.')];
        }
        const url = model.links;

        return new Promise((resolve) => {
            let subscription: NativeModuleSubscription | null = null;

            const cleanup = () => {
                if (subscription) {
                    subscription.remove();
                    subscription = null;
                }
            };

            subscription = ExpoLlmMediapipe.addListener(
                'downloadProgress',
                (event) => {
                    if (event.modelName === modelName) {
                        if (event.status === 'downloading' && event.progress !== undefined) {
                            onProgress(event.progress);
                        } else if (event.status === 'completed') {
                            cleanup();
                            resolve([modelName, null]);
                        } else if (event.status === 'error') {
                            cleanup();
                            resolve([null, new Error(event.error || 'Download failed.')]);
                        } else if (event.status === 'cancelled') {
                            cleanup();
                            resolve([null, new Error('Download cancelled.')]);
                        }
                    }
                }
            );

            ExpoLlmMediapipe.downloadModel(url, modelName, { overwrite: true }).catch(
                (e: any) => {
                    cleanup();
                    resolve([null, e]);
                }
            );
        });
    }
}
