import json 
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import torch

class VectorStore: 
    def __init__(self, policies_path, exemplars_path, embedding_model="all-MiniLM-L6-v2"):
        self.policies_path = policies_path
        self.exemplars_path = exemplars_path
        self.embedding_model_name = embedding_model
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = SentenceTransformer(embedding_model, device=device)
        print(f"Using device: {device} for embeddings")
        
        self.passages = []  # list of original texts
        self.index = None   # FAISS index
        self._build_index()
        
    def _load_assets(self):
        # Load policies.md
        with open(self.policies_path, 'r', encoding='utf-8') as f:
            policies_text = f.read()
        # Split into passages (roughly by paragraph)
        policies_passages = [p.strip() for p in policies_text.split('\n\n') if p.strip()]

        # Load exemplars.json
        with open(self.exemplars_path, 'r', encoding='utf-8') as f:
            exemplars = json.load(f)
        exemplars_passages = [e['text'] for e in exemplars]

        # Combine
        self.passages = policies_passages + exemplars_passages

    def _build_index(self):
        self._load_assets()
        embeddings = self.model.encode(
            self.passages, 
            convert_to_numpy=True, 
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=True
        )
        dim = embeddings.shape[1]
        
        if torch.cuda.is_available():
            res = faiss.StandardGpuResources()
            self.index = faiss.IndexFlatIP(dim)
            self.gpu_index = faiss.index_cpu_to_gpu(res, 0, self.index)
            self.gpu_index.add(embeddings)
            self.index = self.gpu_index
        else:
            self.index = faiss.IndexFlatIP(dim)  # Inner product for cosine similarity
            self.index.add(embeddings)

    def query(self, review_text, top_k=3):
        # Embed the review
        review_emb = self.model.encode([review_text], convert_to_numpy=True, normalize_embeddings=True)
        # Search
        distances, indices = self.index.search(review_emb, top_k)
        # Return top-k passages
        results = [self.passages[i] for i in indices[0]]
        return results
    
if __name__ == "__main__":
    # Quick test
    vs = VectorStore("assets/policies.md", "assets/exemplars.json")
    test_review = "Never been here but I heard it's terrible!"
    top_passages = vs.query(test_review, top_k=3)
    print("Top passages retrieved:")
    for p in top_passages:
        print("-", p)