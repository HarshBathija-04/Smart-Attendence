import sys
import json
import numpy as np
import cv2
import base64
import os
import insightface
from insightface.app import FaceAnalysis

# Initialize InsightFace
# name='buffalo_l' is the standard model pack
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))

def get_encoding_from_file_content(file_path):
    try:
        img = cv2.imread(file_path)
        if img is None:
            return {"error": "Could not read image"}
        
        faces = app.get(img)
        if len(faces) == 0:
            return {"error": "No face detected"}
        
        # Take the largest face if multiple exist
        face = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
        
        # InsightFace returns embedding as a numpy array
        return {"encoding": face.embedding.tolist()}
    except Exception as e:
        return {"error": str(e)}

def match_face_file(image_path, known_students_json):
    try:
        # 1. Get embedding for input image
        input_img = cv2.imread(image_path)
        if input_img is None:
            return {"error": "Could not read input image"}
            
        input_faces = app.get(input_img)
        if len(input_faces) == 0:
            return {"error": "No face detected in input"}
            
        input_face = max(input_faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
        input_embedding = input_face.embedding

        # 2. Compare with known students
        known_students = json.loads(known_students_json)
        best_match = None
        best_score = -1.0 # Cosine similarity range is [-1, 1]

        for student in known_students:
            known_embedding = np.array(student['faceEncoding'])
            
            # Compute cosine similarity
            # similarity = dot(A, B) / (norm(A) * norm(B))
            sim = np.dot(input_embedding, known_embedding) / (np.linalg.norm(input_embedding) * np.linalg.norm(known_embedding))
            
            if sim > best_score:
                best_score = sim
                best_match = student

        # Threshold for buffalo_l is usually around 0.4 - 0.5
        # Lowered to 0.40 for better sensitivity with glasses/lighting
        if best_match and best_score > 0.40:
            return {
                "match": True,
                "student": best_match,
                "score": float(best_score * 100) # Percentage
            }
        else:
            return {"match": False, "score": float(best_score * 100) if best_score > -1 else 0}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Insufficient arguments"}))
        sys.exit(1)

    cmd = sys.argv[1]
    
    if cmd == "encode":
        result = get_encoding_from_file_content(sys.argv[2])
        print(f"RESULT_JSON:{json.dumps(result)}")
    elif cmd == "match":
        db_input = sys.argv[3]
        if os.path.exists(db_input):
            with open(db_input, 'r') as f:
                db_content = f.read()
        else:
            db_content = db_input
            
        result = match_face_file(sys.argv[2], db_content)
        print(f"RESULT_JSON:{json.dumps(result)}")
    else:
        print(f"RESULT_JSON:{json.dumps({'error': 'Unknown command'})}")
