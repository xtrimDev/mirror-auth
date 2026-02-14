from fastapi import FastAPI, HTTPException, UploadFile
import vectorGenerator

app = FastAPI()

@app.get("/register")
def register_new_user(userData, file: UploadFile) :
    embeddings = vectorGenerator.get_embedding("temp/images.webp")
    print(embeddings)
    return {"message": "hi"}