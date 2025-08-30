type Common = {
    name: string,
    tags: string[],
    backend: string,
    extension: string,
    size: number,
    parameter: string,
    description: string,

}

export type Online = {
    type: "online",
    links: string,
}

export type Ofline = {
    type: "ofline",
    path: string,
}

export type Models = (Online | Ofline) & Common

const MODELS: Models[] = [
    {
        name: "gemma3-1b-it-int4",
        tags: ["int4", "super small"],
        backend: "mediapipe",
        links: "https://huggingface.co/cu8code/mediapipe/resolve/main/gemma3-1b-it-int4.task",
        type: "online",
        extension: "task",
        description: "this smallest model ever made by google with only a presision of u4 (4 * 8)bits kind of insane;",
        parameter: "1b",
        size: 500
    },
    {
        name: "gemma3-1B-IT_multi-prefill-seq_q8_ekv1280",
        tags: ["q8", "medium"],
        backend: "mediapipe",
        links: "https://huggingface.co/cu8code/mediapipe/resolve/main/Gemma3-1B-IT_multi-prefill-seq_q8_ekv1280.task",
        type: "online",
        extension: "task",
        description: "this medium size model ever made by google with only a presision of u4 (8 * 8)bits kind of insane;",
        parameter: "1b",
        size: 1.05 * 1024
    }
]


export default MODELS