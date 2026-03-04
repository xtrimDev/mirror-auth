import { chromaClient, users } from '@dbClient';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

class LogError extends Error {
  constructor(message, statusCode = 500, errorType = "SERVER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

export async function POST(request) {
  try {
    const incomingFormData = await request.formData();
    const image = incomingFormData.getAll("image");

    if (!image || image.length != 1) {
      throw new LogError("No Face Image Provided.", 400, "IMAGE_NOT_FOUND");
    }

    const formData = new FormData();
    formData.append("files", image[0]);

    const pyres = await fetch(`${process.env.PYTHON_SERVER_URL}/generate`, {
      method: "POST",
      body: formData,
    });

    if (!pyres.ok) {
      throw new LogError(
        "Internal Server Error",
        500,
        "SERVER_ERROR",
      );
    }

    const pydt = await pyres.json();
    if (!pydt.success) {
      throw new LogError(
        "Embedding generation Failed",
        417,
        "FACE_ERROR",
      );
    }

    /**check if face is registered? */
    await chromaClient.heartbeat();

    const collection = await chromaClient.getOrCreateCollection({
      name: process.env.CHROMA_CLIENT_DB,
      embeddingFunction: null
    })

    const result = await collection.query({
      nResults: 1,
      queryEmbeddings: [pydt.embeddings]
    })

    const matchedId = result.ids?.[0]?.[0];
    const distance = result.distances[0]
    const THRESHOLD = process.env.FACE_THRESHOLD;

    if (!matchedId || distance === undefined || !(result.ids[0].length > 0 && distance < THRESHOLD)) {
      throw new LogError(
        "Face is Not Registered yet.",
        400,
        "NOT_REGISTERED"
      );
    }

    const user = await users.findOne({userId: `${result.ids[0][0]}`});

    if (user == null) {
      await collection.delete({ids: [`${result.ids[0][0]}`]})
      
      throw new LogError(
        "Face is Not Registered yet.",
        400,
        "NOT_REGISTERED"
      )
    }  
    
    /** JWT TOKEN */
    const token = jwt.sign(user.toObject(), process.env.JWT_SECRET_KEY);

    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        type: error.errorType || "UNKNOWN_ERROR",
      },
      { status: error.statusCode || 500 }
    );
  }
}