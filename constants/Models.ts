
export type Backends = {
    name: string,
    models: Models[]
}

export type Online = {
    type: "online",
    links: string,
    name: string
}

export type Ofline = {
    type: "ofline",
    name: string,
    path: string
}

export type Models = Online | Ofline

/*
 * name are globally unique 
*/
const MODELS: Backends[] = [
    {
        name: "google/mediapipe",
        models: [
            {
                name: "google/gemini-2",
                links: "https://huggingface.co/cu8code/mediapipe/resolve/main/gemma3-1b-it-int4.task",
                type: "online"
            }
        ]
    }
]


export default MODELS