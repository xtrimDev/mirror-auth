import { ChromaClient } from "chromadb";

const client = new ChromaClient({
    host: process.env.CHROMA_CLIENT_HOST,
    port: process.env.CHROMA_CLIENT_PORT,
    ssl: false
});


export {client};
