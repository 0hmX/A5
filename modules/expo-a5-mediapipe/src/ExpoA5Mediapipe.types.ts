export interface TaskOptions {
  modelPath: string;
  maxTokens?: number;
  topK?: number;
  temperature?: number;
  randomSeed?: number;
}

export interface PartialResponseEvent {
  payload: [string | null, any | null];
  done: boolean;
}

export interface ErrorResponseEvent {
  payload: [null, string];
}

export type ExpoA5MediapipeModuleEvents = {
  onPartialResponse: (event: PartialResponseEvent) => void;
  onErrorResponse: (event: ErrorResponseEvent) => void;
};