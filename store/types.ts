import { Models } from "../constants/Models";

export type AppStatus =
    | 'IDLE'
    | 'LOADING_MODEL'
    | 'GENERATING'
    | 'DOWNLOADING'
    | 'ERROR';

export type ModelStatus = 'downloaded' | 'not_downloaded' | 'downloading';

export interface ModelState {
    model: Models;
    status: ModelStatus;
    backend: string;
}