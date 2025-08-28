# src/rag_classifier.py
import json
from vector_store import VectorStore
import ollama  # make sure ollama Python SDK is installed
import os 

labels = ["valid", "advertisement", "irrelevant", "rant_without_visit"]
os.environ["OLLAMA_DEVICE"] = "cpu"

class RAGClassifier:
    def __init__(self, vector_store, top_k=3):
        self.vector_store = vector_store
        self.top_k = top_k

    def generate(self, prompt):
        messages = [{"role": "user", "content": prompt}]
        response = ollama.chat(model="llama2:7b", messages=messages)
        return response.get("message", {}).get("content", "")

    def classify(self, review_text, shop_info = None):
        passages = self.vector_store.query(review_text, top_k=self.top_k)
        context = "\n".join(passages)
        # Optional Metadata of shops 
        if shop_info:
            shop_context = "Shop Info:\n"
            for k, v in shop_info.items():
                shop_context += f"- {k}: {v}\n"
        else:
            shop_context = ""

        # Build the Prompt 
        prompt = f"""
        You are a location review classifier. Use the context below to classify the review.
        Return JSON with 'label' (one of: {labels}) and 'rationale' (short explanation).
        {shop_context}
        
        Context:
        {context}

        Review:
        {review_text}

        """
        output_text = self.generate(prompt)
        return output_text
    """
        try:
            result = json.loads(output_text)
        except json.JSONDecodeError:
            result = {"label": "unknown", "rationale": output_text}
        return result
"""

if __name__ == "__main__":
    # Load vector store
    vs = VectorStore("assets/policies.md", "assets/exemplars.json")

    # Initialize RAG classifier
    classifier = RAGClassifier(vs)

    # Test reviews
    test_reviews = [
        "Never been here but I heard it's terrible!",
        "Best pizza in town! Highly recommend.",
        "Visit www.pizzapromo.com for a discount!"
    ]

    for review in test_reviews:
        # result = classifier.classify(review)
        
        shop_info = {
            "Name": "Pizza Town",
            "Type": "Restaurant",
            "Known Promotions": "2-for-1 Tuesday deal, Student discount"}           
        result2 = classifier.classify(review, shop_info = shop_info) 
        
        print(f"\nReview: {review}")
        print(f"Prediction: {result2}")
