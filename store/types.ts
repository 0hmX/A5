export type AppStatus =
    | 'IDLE'
    | 'LOADING_MODEL'
    | 'GENERATING'
    | 'DOWNLOADING'
    | 'ERROR';

export type ModelType = 'online' | 'local';

export interface Model {
    name: string;
    type: ModelType;
    links?: string;
    path?: string;
}

export type ModelStatus = 'downloaded' | 'not_downloaded' | 'downloading';

export interface ModelState {
    model: Model;
    status: ModelStatus;
}
