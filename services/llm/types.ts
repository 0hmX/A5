export interface LLMService {
  loadModel(
    modelName: string,
    options: {
      maxTokens?: number;
      topK?: number;
      temperature?: number;
      randomSeed?: number;
    }
  ): Promise<[void, null] | [null, Error]>;

  generate(prompt: string): Promise<[string, null] | [null, Error]>;

  generateStream(
    prompt: string,
    onToken: (token: string) => void
  ): Promise<[void, null] | [null, Error]>;

  unloadModel(): Promise<[void, null] | [null, Error]>;

  downloadModel(
    modelName: string,
    onProgress: (progress: number) => void
  ): Promise<[string, null] | [null, Error]>;
}
