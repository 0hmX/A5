import { requireNativeModule } from 'expo-modules-core';
import type { TaskOptions } from './ExpoA5Mediapipe.types';

type ExpoA5MediapipeModule = {
  createTask(options: TaskOptions): Promise<[number, null] | [null, string]>;
  generateResponse(taskHandle: number, prompt: string): Promise<[string, null] | [null, string]>;
  generateResponseAsync(taskHandle: number, prompt: string): Promise<[boolean, null] | [null, string]>;
  releaseTask(taskHandle: number): Promise<[boolean, null] | [null, string]>;
};

const mediapipeModule = requireNativeModule<ExpoA5MediapipeModule>('ExpoA5Mediapipe');

export function createTask(options: TaskOptions) {
  return mediapipeModule.createTask(options);
}

export function generateResponse(taskHandle: number, prompt: string) {
  return mediapipeModule.generateResponse(taskHandle, prompt);
}

export function generateResponseAsync(taskHandle: number, prompt: string) {
  return mediapipeModule.generateResponseAsync(taskHandle, prompt);
}

export function releaseTask(taskHandle: number) {
  return mediapipeModule.releaseTask(taskHandle);
}