import json
import os

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

load_dotenv()

COLLECTION_NAME = "veggie_products"
JSONL_FILE = 'app/data/products_for_rag.jsonl'
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", COLLECTION_NAME)

if not QDRANT_URL:
    raise ValueError("Không tìm thấy QDRANT_URL")
if not QDRANT_API_KEY:
    raise ValueError("Không tìm thấy QDRANT_API_KEY")

model = SentenceTransformer("all-MiniLM-L6-v2")
client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
)

def ingest_data():
    if client.collection_exists(COLLECTION_NAME):
        print(f"Xoá collection cũ: {COLLECTION_NAME}")
        client.delete_collection(COLLECTION_NAME)

    print(f"Tạo collection mới: {COLLECTION_NAME}")
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    points = []
    print(f"Bắt đầu xử lý Embedding từ file: {JSONL_FILE}...")
   
    with open(JSONL_FILE, "r", encoding='utf-8') as f:
        for i, line in enumerate(f):
            data = json.loads(line)
            vector = model.encode(data['content']).tolist()
            points.append(
                PointStruct(
                    id=i, 
                    vector=vector,
                    payload={
                        "doc_id": data["doc_id"],
                        "content": data["content"],
                        "metadata": data["metadata"],
                    },
                )
            )
    if points:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"Đã nạp thành công {len(points)} sản phẩm vào Qdrant!")
    else:
        print("Không có dữ liệu để nạp. Quý kiểm tra file JSONL nhé!")

if __name__ == "__main__":
    ingest_data()

    
