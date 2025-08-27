import json 
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class VectorStore: 
    def __init__(self, policies_path, exemplars_path, embedding_model="all-MiniLM-L6-v2"):
        self.policies_path = policies_path
        self.exemplars_path = exemplars_path
        self.embedding_model_name = embedding_model
        self.model = SentenceTransformer(embedding_model)
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
        embeddings = self.model.encode(self.passages, convert_to_numpy=True, normalize_embeddings=True)
        dim = embeddings.shape[1]
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