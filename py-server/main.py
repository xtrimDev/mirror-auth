from fastapi import FastAPI, File, UploadFile
from typing import List
from vectorGenerator import get_embedding
import shutil
import uuid
import os
import numpy as np
import uvicorn

app = FastAPI()

@app.post("/register")
async def register_new_user(files: List[UploadFile] = File(...)):
    try :
        # Validation of Formdata
        if len(files) != 3:
            raise ValueError("Number of images are not equal to 3")

        #upload all files to the server
        os.makedirs("upload", exist_ok=True)

        uploadedFiles = []
        for file in files:
            unique_name = f"{uuid.uuid4()}_{file.filename}"
            file_path = os.path.join("upload", unique_name)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            uploadedFiles.append(unique_name)
            await file.close()

        # generate face vectors
        faceVectors = get_embedding(uploadedFiles)

        valid_vectors = [
            np.array(vec)
            for vec in faceVectors
            if vec is not None and len(vec) > 0
        ]

        if not valid_vectors:
            raise ValueError("No valid face embeddings generated")

        shapes = [vec.shape for vec in valid_vectors]
        if len(set(shapes)) != 1:
            raise ValueError(f"Inconsistent embedding shapes: {shapes}")

        avgFaceEmbedding = np.mean(np.stack(valid_vectors), axis=0)

        #remove files after vectors are generated.
        for fp in uploadedFiles:
            os.remove(os.path.join("upload", fp))

        #Return the face embedding
        return {
            "success": True,
            "data": avgFaceEmbedding.tolist()
        }
    except ValueError as e :
        #remove files after vectors are generated.
        for fp in uploadedFiles:
            os.remove(os.path.join("upload", fp))
            
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3003)
