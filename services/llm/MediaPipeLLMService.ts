import MODELS, { Online } from '@/constants/Models';
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
            const sanitizedModelName = modelName.replace(/\//g, '-');
            console.log(`MediaPipeLLMService: Loading model ${sanitizedModelName}`);
            const handle = await ExpoLlmMediapipe.createModelFromDownloaded(
                sanitizedModelName,
                options.maxTokens,
                options.topK,
                options.temperature,
                options.randomSeed
            );
            this.modelHandle = handle;
            return [undefined, null];
        } catch (e: any) {
            console.log(`MediaPipeLLMService: Error loading model ${modelName}: ${e.message}`);
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
        console.log(`MediaPipeLLMService: Downloading model ${modelName}`);
        let model: Online | null = null;
        for (const backend of MODELS) {
            const foundModel = backend.models.find((m) => m.name === modelName);
            if (foundModel && foundModel.type === 'online') {
                model = foundModel;
                break;
            }
        }

        if (!model || !model.links) {
            console.log(`MediaPipeLLMService: Invalid model name or missing link for ${modelName}`);
            return [null, new Error('Invalid model name or missing link.')];
        }
        const url = model.links;
        const sanitizedModelName = modelName.replace(/\//g, '-');
        console.log(`MediaPipeLLMService: Sanitized model name to ${sanitizedModelName}`);

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
                    if (event.modelName === sanitizedModelName) {
                        if (event.status === 'downloading' && event.progress !== undefined) {
                            console.log(`MediaPipeLLMService: Download progress for ${sanitizedModelName}: ${event.progress}`);
                            onProgress(event.progress);
                        } else if (event.status === 'completed') {
                            console.log(`MediaPipeLLMService: Download completed for ${sanitizedModelName}`);
                            cleanup();
                            resolve([modelName, null]);
                        } else if (event.status === 'error') {
                            console.log(`MediaPipeLLMService: Download error for ${sanitizedModelName}: ${event.error}`);
                            cleanup();
                            resolve([null, new Error(event.error || 'Download failed.')]);
                        } else if (event.status === 'cancelled') {
                            console.log(`MediaPipeLLMService: Download cancelled for ${sanitizedModelName}`);
                            cleanup();
                            resolve([null, new Error('Download cancelled.')]);
                        }
                    }
                }
            );

            ExpoLlmMediapipe.downloadModel(url, sanitizedModelName, { overwrite: true }).catch(
                (e: any) => {
                    console.log(`MediaPipeLLMService: Error downloading model ${sanitizedModelName}: ${e.message}`);
                    cleanup();
                    resolve([null, e]);
                }
            );
        });
    }
}
