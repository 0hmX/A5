type Common = {
    name: string,
    tags: string[],
    backend: string
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

/*
 * name are globally unique 
*/
const MODELS: Models[] = [
    {
        name: "google/gemini-2",
        tags: ["int4", "super small"],
        backend: "mediapipe",
        links: "https://huggingface.co/cu8code/mediapipe/resolve/main/gemma3-1b-it-int4.task",
        type: "online"
    }
]


export default MODELS