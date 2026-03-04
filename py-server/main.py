from fastapi import FastAPI, File, UploadFile
from typing import List
from vectorGenerator import get_embedding
import shutil
import uuid
import os
import numpy as np
import uvicorn
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

SIMILARITY_THRESHOLD = 0.75

@app.post("/generate")
async def generate(files: List[UploadFile] = File(...)):
    try :
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
        
        #check if all the faces are of same person
        if len(valid_vectors) > 1:
            for i in range(len(valid_vectors)):
                for j in range(i + 1, len(valid_vectors)):
                    sim = cosine_similarity(
                        valid_vectors[i].reshape(1, -1),
                        valid_vectors[j].reshape(1, -1)
                    )[0][0]

                    if sim < SIMILARITY_THRESHOLD:
                        raise ValueError(
                            f"Faces are different (similarity: {sim:.4f})"
                        )

        avgFaceEmbedding = np.mean(np.stack(valid_vectors), axis=0)

        #remove files after vectors are generated.
        for fp in uploadedFiles:
            os.remove(os.path.join("upload", fp))

        #Return the face embedding
        return {
            "success": True,
            "embeddings": avgFaceEmbedding.tolist()
        }
    except ValueError as e :
        #remove files if error
        for fp in uploadedFiles:
            os.remove(os.path.join("upload", fp))
            
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3003)
