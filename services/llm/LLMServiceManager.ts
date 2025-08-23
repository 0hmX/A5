import { LLMService } from './LLMService';
import { LLMServiceFactory } from './LLMServiceFactory';

export class LLMServiceManager {
    private activeLlmService: LLMService | null = null;
    private activeModelName: string | null = null;

    async getService(modelName: string): Promise<[LLMService, null] | [null, Error]> {
        console.log(`LLMServiceManager: Requesting service for model ${modelName}`);
        if (this.activeLlmService && this.activeModelName !== modelName) {
            console.log(`LLMServiceManager: Releasing previously active model ${this.activeModelName}`);
            await this.releaseService();
        }

        if (!this.activeLlmService) {
            console.log(`LLMServiceManager: No active service, creating a new one`);
            const [service, error] = LLMServiceFactory.getService(modelName);
            if (error) {
                return [null, error];
            }
            this.activeLlmService = service;
            this.activeModelName = modelName;
            console.log(`LLMServiceManager: New service created for model ${modelName}`);
        }

        return [this.activeLlmService, null];
    }

    async releaseService(): Promise<[void, null] | [null, Error]> {
        console.log('LLMServiceManager: Releasing active service');
        if (this.activeLlmService) {
            const [_, error] = await this.activeLlmService.unloadModel();
            if (error) {
                return [null, error];
            }
            this.activeLlmService = null;
            this.activeModelName = null;
            console.log('LLMServiceManager: Active service released');
        }
        return [undefined, null];
    }
}
