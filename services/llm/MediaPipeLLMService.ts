import MODELS from '@/constants/Models';
import ExpoLlmMediapipe, { NativeModuleSubscription } from 'expo-llm-mediapipe';
import { LLMService } from './LLMService';

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

        const requestId = ++this.requestIdCounter;
        let partialResponseSubscription: NativeModuleSubscription | null = null;
        let errorResponseSubscription: NativeModuleSubscription | null = null;

        return new Promise(async (resolve, reject) => {
            try {
                partialResponseSubscription = ExpoLlmMediapipe.addListener(
                    'onPartialResponse',
                    (event) => {
                        if (event.handle === this.modelHandle && event.requestId === requestId) {
                            onToken(event.response);
                        }
                    }
                );

                errorResponseSubscription = ExpoLlmMediapipe.addListener(
                    'onErrorResponse',
                    (event) => {
                        if (event.handle === this.modelHandle && event.requestId === requestId) {
                            console.error(`Stream error for request ${requestId}: ${event.error}`);
                            reject(new Error(event.error));
                        }
                    }
                );

                await ExpoLlmMediapipe.generateResponseAsync(
                    this.modelHandle!,
                    requestId,
                    prompt
                );

                resolve([undefined, null]);
            } catch (e: any) {
                reject(e);
            } finally {
                if (partialResponseSubscription) {
                    partialResponseSubscription.remove();
                }
                if (errorResponseSubscription) {
                    errorResponseSubscription.remove();
                }
            }
        });
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
        const model = MODELS.find((m) => m.name === modelName);

        if (!model || model.type !== 'online' || !model.links) {
            console.log(`MediaPipeLLMService: Invalid model name or missing link for ${modelName}`);
            return [null, new Error('Invalid model name or missing link.')];
        }
        const url = model.links;
        const sanitizedModelName = modelName.replace(/\//g, '-');
        console.log(`MediaPipeLLMService: Sanitized model name to ${sanitizedModelName}`);

        let subscription: NativeModuleSubscription | null = null;

        return new Promise(async (resolve, reject) => {
            try {
                subscription = ExpoLlmMediapipe.addListener(
                    'downloadProgress',
                    (event) => {
                        if (event.modelName === sanitizedModelName) {
                            if (event.status === 'downloading' && event.progress !== undefined) {
                                console.log(`MediaPipeLLMService: Download progress for ${sanitizedModelName}: ${event.progress}`);
                                onProgress(event.progress);
                            } else if (event.status === 'completed') {
                                console.log(`MediaPipeLLMService: Download completed for ${sanitizedModelName}`);
                                resolve([modelName, null]);
                            } else if (event.status === 'error') {
                                console.log(`MediaPipeLLMService: Download error for ${sanitizedModelName}: ${event.error}`);
                                reject(new Error(event.error || 'Download failed.'));
                            } else if (event.status === 'cancelled') {
                                console.log(`MediaPipeLLMService: Download cancelled for ${sanitizedModelName}`);
                                reject(new Error('Download cancelled.'));
                            }
                        }
                    }
                );

                await ExpoLlmMediapipe.downloadModel(url, sanitizedModelName, { overwrite: true });
            } catch (e: any) {
                console.log(`MediaPipeLLMService: Error downloading model ${sanitizedModelName}: ${e.message}`);
                reject(e);
            } finally {
                if (subscription) {
                    subscription.remove();
                }
            }
        });
    }
}
