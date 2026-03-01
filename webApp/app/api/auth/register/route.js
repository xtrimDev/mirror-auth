import { NextResponse } from 'next/server';
import { randomUUID } from "crypto";
import {client} from "@dbClient"

export async function POST(request) {
  try {
    /** collect all data coming from the frontend */
    const incomingFormData = await request.formData();

    /** collect all other data except faceImages */
    const userData = {};

    for (const [key, value] of incomingFormData.entries()) {
      if (key !== "faceImages") {
        userData[key] = value;
      }
    }

    /** Input validation */
    const fullName = userData['fullName']?.trim();
    const email = userData['email']?.trim();
    const mobileNumber = userData['mobileNumber']?.trim();

    if (fullName == '' || email == '' || mobileNumber == '') {
      throw new Error("Something is missing")
    }

    if (fullName.length < 3) {
      throw new Error("Minimum length of name should be 3");
    }

    if (fullName.length > 25) {
      throw new Error("Maximum length of name should be 25");
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error("The email is invalid");
    }

    const mobileRegex = /^[0-9]{10}$/
    if (!mobileRegex.test(mobileNumber)) {
      throw new Error("The Mobile number is invalid");
    }

    /** validate the faces in Image and Generate the face embedding  */
    const faceImages = incomingFormData.getAll("faceImages");

    if (faceImages.length != 3) {
      throw new Error("Exactly 3 images are needed.");
    }

    // creating form data and making request for embedding generation from python server
    const pythonFormData = new FormData();
    faceImages.forEach((file) => {
      pythonFormData.append("files", file);
    });

    const res = await fetch(`${process.env.PYTHON_SERVER_URL}/register`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!res.ok) {
      throw new Error("Failed to register user");
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    /**Perfroming db actions */
    async function storeEmbedding(data) {
      await client.heartbeat();

      const collection = await client.getOrCreateCollection({
        name: process.env.CHROMA_CLIENT_DB,
        embeddingFunction: null
      });

      const id = randomUUID();

      await collection.add({
        ids: [id],
        embeddings: [data.data],  
        documents: [JSON.stringify(data.userData)]    
      });

      console.log("Stored successfully");
    }

    data['userData'] = userData;
    await storeEmbedding(data)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}


