import { NextResponse } from 'next/server';
import { randomUUID } from "crypto";
import { chromaClient, users } from "@dbClient"

class RegError extends Error {
  constructor(message, statusCode = 500, errorType = "SERVER_ERROR", extra = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.extra = extra;
  }
}

export async function POST(request) {
  try {
    /** collect all data coming from the frontend */
    const incomingFormData = await request.formData();

    /** extract all data along with faceImages */
    const faceImages = incomingFormData.getAll("faceImages");
    const userData = {};

    for (const [key, value] of incomingFormData.entries()) {
      if (key !== "faceImages") {
        userData[key] = value;
      }
    }

    /** Input Form validation */
    userData.fullName = userData.fullName?.trim();
    userData.email = userData.email?.trim();
    userData.mobileNumber = userData.mobileNumber?.trim();

    const { fullName, email, mobileNumber } = userData;

    const errors = {};

    const isEmpty = (value) => !value || value === "";

    if (isEmpty(fullName)) {
      errors.fullName = "Full name is required";
    } else if (fullName.length < 3) {
      errors.fullName = "Minimum length of name should be 3";
    } else if (fullName.length > 25) {
      errors.fullName = "Maximum length of name should be 25";
    }

    if (isEmpty(email)) {
      errors.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      errors.email = "The email is invalid";
    }

    if (isEmpty(mobileNumber)) {
      errors.mobileNumber = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(mobileNumber)) {
      errors.mobileNumber = "The mobile number is invalid";
    }

    if (Object.keys(errors).length > 0) {
      throw new RegError(
        "Validation failed",
        400,
        "VALIDATION_ERROR",
        errors
      );
    }

    /** Input image validation */
    if (faceImages.length != 3) {
      throw new RegError(
        "Validation failed",
        400,
        "IMAGE_ERROR",
        { error: "Exactly 3 images are needed." }
      )
    }

    //check if email already exists?
    let userCount = await users.countDocuments({
      $or: [
        { email: email },
        { mobileNumber: mobileNumber }
      ]
    });

    if (userCount > 0) {
      throw new RegError(
        "Validation failed",
        400,
        "INPUT_ERROR",
        { error: "The email or Mobile Number is already registered." }
      );
    }

    // generating face embedding 
    const formData = new FormData();
    faceImages.forEach((file) => {
      formData.append("files", file);
    });

    const pyres = await fetch(`${process.env.PYTHON_SERVER_URL}/generate`, {
      method: "POST",
      body: formData,
    });

    if (!pyres.ok) {
      throw new RegError(
        "Internal Server Error",
        500,
        "SERVER_ERROR",
        { error: "Face Embeddings didn't get generated." }
      );
    }

    const pydt = await pyres.json();
    if (!pydt.success) {
      throw new RegError(
        "Embedding generation Failed",
        417,
        "FACE_ERROR",
        { error: pydt.error }
      );
    }

    /**check if face is already registered? */
    await chromaClient.heartbeat();

    const collection = await chromaClient.getOrCreateCollection({
      name: process.env.CHROMA_CLIENT_DB,
      embeddingFunction: null
    })

    const result = await collection.query({
      nResults: 1,
      queryEmbeddings: [pydt.embeddings]
    })

    const distance = result.distances[0]
    const THRESHOLD = process.env.FACE_THRESHOLD;

    if (result.ids[0].length > 0 && distance < THRESHOLD)  {
      throw new RegError(
        "Face Already Registered",
        400,
        "FACE_ERROR",
        { error: pydt.error }
      );
    }

    const userId = randomUUID();

    //Register user in mongoDB.
    const user = new users({
      userId,
      fullName,
      email,
      mobileNumber
    });

    await user.save()

    //Register user's face embedding in ChromaDB
    await collection.add({
      ids: [userId],
      embeddings: [pydt.embeddings]   
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        type: error.errorType || "UNKNOWN_ERROR",
        extra: error.extra || null
      },
      { status: error.statusCode || 500 }
    );
  }
}


