import {
    createTask,
    generateResponse,
    generateResponseAsync,
    releaseTask,
    PartialResponsePayload,
    ErrorResponsePayload,
} from '@/modules/expo-a5-mediapipe';
import { LLMService } from './LLMService';
import useModelService from '../ModelService';

export class MediaPipeLLMService implements LLMService {
    private taskHandle: number | null = null;

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
            if (this.taskHandle !== null) {
                await this.unloadModel();
            }
            const [modelPath, error] = await useModelService.getState().getModelLocalPath(modelName);
            if (error) {
                return [null, error];
            }

            const [handle, createTaskError] = await createTask({
                modelPath: modelPath!,
                ...options,
            });

            if (createTaskError) {
                return [null, createTaskError];
            }

            this.taskHandle = handle;
            return [undefined, null];
        } catch (e: any) {
            return [null, e];
        }
    }

    async generate(prompt: string): Promise<[string, null] | [null, Error]> {
        if (this.taskHandle === null) {
            return [null, new Error('Model not loaded.')];
        }
        try {
            const [response, error] = await generateResponse(this.taskHandle, prompt);
            if (error) {
                return [null, error];
            }
            return [response, null];
        } catch (e: any) {
            return [null, e];
        }
    }

    async generateStream(
        prompt: string,
        onToken: (token: string) => void
    ): Promise<[void, null] | [null, Error]> {
        if (this.taskHandle === null) {
            return [null, new Error('Model not loaded.')];
        }

        return new Promise(async (resolve, reject) => {
            const partialResponseListener = (payload: PartialResponsePayload) => {
                const [token, error] = payload;
                if (error) {
                    reject(error);
                } else if (token) {
                    onToken(token);
                }
            };

            const errorResponseListener = (payload: ErrorResponsePayload) => {
                const [_, error] = payload;
                if (error) {
                    reject(error);
                }
            };

            try {
                // Add listeners
                // This is a hypothetical implementation as the new API does not specify how to add listeners
                // I will assume a similar pattern to the old API
                const { NativeModule } = await import('@/modules/expo-a5-mediapipe/src/ExpoA5MediapipeModule');
                const partialResponseSubscription = NativeModule.addListener('onPartialResponse', partialResponseListener);
                const errorResponseSubscription = NativeModule.addListener('onErrorResponse', errorResponseListener);


                const [success, error] = await generateResponseAsync(this.taskHandle!, prompt);

                if (error) {
                    reject(error);
                } else {
                    resolve([undefined, null]);
                }
            } catch (e: any) {
                reject(e);
            } finally {
                // Remove listeners
                // This is a hypothetical implementation as the new API does not specify how to remove listeners
                // I will assume a similar pattern to the old API
                const { NativeModule } = await import('@/modules/expo-a5-mediapipe/src/ExpoA5MediapipeModule');
                NativeModule.removeAllListeners('onPartialResponse');
                NativeModule.removeAllListeners('onErrorResponse');
            }
        });
    }

    async unloadModel(): Promise<[void, null] | [null, Error]> {
        if (this.taskHandle === null) {
            return [undefined, null];
        }
        try {
            const [success, error] = await releaseTask(this.taskHandle);
            if (error) {
                return [null, error];
            }
            this.taskHandle = null;
            return [undefined, null];
        } catch (e: any) {
            return [null, e];
        }
    }
}