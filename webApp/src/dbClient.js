import { ChromaClient } from "chromadb";
import mongoose, { Schema } from "mongoose";

const chromaClient = new ChromaClient({
    host: process.env.CHROMA_CLIENT_HOST,
    port: Number(process.env.CHROMA_CLIENT_PORT),
    ssl: false
});

mongoose.connect("mongodb://localhost:27017/" + process.env.CHROMA_CLIENT_DB)
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log("Mongo error:", err));

const userSchema = new Schema({
    userId: {type: String, require: true, unique: true},
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true }
});

const applicationSchema = new Schema({
    createdBy: {type: String, required: true},
    name: { type: String, required: true },
    description: { type: String, default: "" },
    appUrl: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    logo: { type: String, required: true },
    clientId: { type: String, required: true, unique: true },
    clientSecret: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const TokenSchema = new Schema({
    createdBy: { type: String, required: true },
    appId: { type: String, required: true },
    token: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now }, 
    expireAt: { type: Date, default: undefined }
  });
TokenSchema.index({ "expireAt": 1 }, { expireAfterSeconds: 0 });

const users = mongoose.models.Users || mongoose.model("Users", userSchema);
const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);
const Token = mongoose.models.Token || mongoose.model("Token", TokenSchema);

export { chromaClient, users, Application, Token };