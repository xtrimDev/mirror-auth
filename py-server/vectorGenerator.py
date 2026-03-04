from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
import torch
import os

# Face detector + aligner
mtcnn = MTCNN(image_size=160, margin=0)

# FaceNet model
model = InceptionResnetV1(pretrained='vggface2').eval()

def get_embedding(uploadedFiles):
    face_embeddings = []

    for fp in uploadedFiles:
        img = Image.open(os.path.join("upload", fp)).convert("RGB")


        #check if more than one face?
        boxes, _ = mtcnn.detect(img)

        if boxes is None:
            raise ValueError("Face Not Found in image")

        if len(boxes) > 1:
            raise ValueError("Multiple faces detected in image")

        #if only one face detected
        face = mtcnn(img)
        if face is not None:
            with torch.no_grad():
                embedding = model(face.unsqueeze(0)) 

            face_embeddings.append(embedding.squeeze(0)) 
        else :
            raise ValueError("Face Not Found in image") 

        face_embeddings.append(None)

    return face_embeddings;
        