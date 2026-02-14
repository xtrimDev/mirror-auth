from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
import torch

# Face detector + aligner
mtcnn = MTCNN(image_size=160, margin=0)

# FaceNet model
model = InceptionResnetV1(pretrained='vggface2').eval()

def get_embedding(img_path):
    img = Image.open(img_path).convert("RGB")

    face = mtcnn(img)
    if face is None:
        return None

    with torch.no_grad():
        embedding = model(face.unsqueeze(0))  # [1, 512]

    return embedding.squeeze(0)  # [512]
