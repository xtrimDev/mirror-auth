import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const incomingFormData = await request.formData();

    const faceImages = incomingFormData.getAll("faceImages");

    // Create new FormData to send to Python
    const pythonFormData = new FormData();

    faceImages.forEach((file) => {
      pythonFormData.append("files", file); 
    });

    const req = await fetch(`${process.env.PYTHON_SERVER_URL}/register`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!req.ok) {
      return NextResponse.json(
        { success: false, error: "Python server failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data received successfully",
        imagesReceived: faceImages.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process form data",
      },
      { status: 400 }
    );
  }
}


