from fastapi import FastAPI, File, UploadFile
from typing import List
import vectorGenerator
import shutil
import uuid
import os
import numpy as np

app = FastAPI()

@app.post("/register")
async def register_new_user(files: List[UploadFile] = File(...)):
    try :
        os.makedirs("upload", exist_ok=True)

        uploadedFiles = []
        faceVectors = []
        for file in files:
            unique_name = f"{uuid.uuid4()}_{file.filename}"
            file_path = os.path.join("upload", unique_name)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            uploadedFiles.append(unique_name)
            await file.close()

        faceVectors = vectorGenerator.get_embedding(uploadedFiles);
        for fp in uploadedFiles:
            os.remove(os.path.join("upload", fp))

        avgFaceEmbedding = np.mean(faceVectors, axis=0)
        print(avgFaceEmbedding)
        return {"faceVector" : avgFaceEmbedding}
    except :
        print("Something else went wrong")

