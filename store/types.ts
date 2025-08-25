import { Models } from "../constants/Models";

export type AppStatus =
    | 'IDLE'
    | 'LOADING_MODEL'
    | 'GENERATING'
    | 'DOWNLOADING'
    | 'ERROR';

export type ModelStatus = 'downloaded' | 'not_downloaded' | 'downloading' | 'error';

export interface ModelState {
    model: Models;
    status: ModelStatus;
}

export type ChatMessage = {
    id: string;
    role: 'user' | 'model';
    content: string;
};

export type ChatSession = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    history: ChatMessage[];
};

export interface ModelDownloadInfo {
    name: string;
    url: string;
    status: 'not_downloaded' | 'downloading' | 'downloaded' | 'error';
    progress: number;
    localPath: string | null;
}