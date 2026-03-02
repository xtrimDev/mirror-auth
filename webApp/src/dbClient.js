import { ChromaClient } from "chromadb";
import mongoose, { Schema } from "mongoose";

const chromaClient = new ChromaClient({
    host: process.env.CHROMA_CLIENT_HOST,
    port: Number(process.env.CHROMA_CLIENT_PORT),
    ssl: false
});

mongoose.connect("mongodb://localhost:27017/OAuth")
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log("Mongo error:", err));

const userSchema = new Schema({
    userId: {type: String, require: true, unique: true},
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true }
});

const users = mongoose.models.Users || mongoose.model("Users", userSchema);
export { chromaClient, users };