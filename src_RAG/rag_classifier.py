# src/rag_classifier.py
import json
from src_RAG.vector_store import VectorStore
import ollama  # make sure ollama Python SDK is installed
import os 
from collections import Counter 
import re 
from concurrent.futures import ThreadPoolExecutor, as_completed

def extract_json(text): 
    """Safely extract JSON from any model output."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return {"label": "unknown", "rationale": text}
    return {"label": "unknown", "rationale": text}

labels = ["valid", "advertisement", "irrelevant", "rant_without_visit"]
# os.environ["OLLAMA_DEVICE"] = "cpu"

class RAGEnsembleClassifier:

    def __init__(self, vector_store, models = None, top_k=3):
        self.model = models or ["llama2:7b","deepseek-r1:7b","gemma3:4b"]
        # self.model = models or ["gemma3:4b"]
        self.vector_store = vector_store
        self.top_k = top_k 

    def generate(self, prompt, model_name):
        messages = [{"role": "user", "content": prompt}]
        response = ollama.chat(
            model=model_name, 
            messages=messages, 
            options={
                "num_ctx": 2048,
                "temperature": 0.1,
                "top_p": 0.9
            }
        )
        return response.get("message", {}).get("content", "")

    def classify(self, review_text, shop_info = None, show_rationale = True):
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
        You are a location review classifier. Use the context below to classify the review. Only Classify the [Review]. 
        Return JSON with 'label' (one of: {labels}) and 'rationale' (short explanation). 
        {shop_context}
        
        Context: These are example reviews (for reference only): 
        {context}

        [Review] Review text to calssify:
        {review_text}
        """
        
        # Multithreaded Option : Collect predictions and rationales in parallel 
        results = []
        def worker(model_name):
            output_text = self.generate(prompt, model_name)
            result = extract_json(output_text)
            return {
                "model": model_name,
                "label": result["label"],
                "rationale": result["rationale"]
            }

        # Submit all models to the executor
        with ThreadPoolExecutor() as executor:
            futures = {executor.submit(worker, m): m for m in self.model}
            
            # Collect results in the same order as self.model
            results_dict = {}
            for future in as_completed(futures):
                model_name = futures[future]
                results_dict[model_name] = future.result()

        # Order results according to self.model
        results = [results_dict[m] for m in self.model]

        # Majority voting
        vote_counts = Counter([r["label"] for r in results])
        majority_label = vote_counts.most_common(1)[0][0]

        # Return final label, optionally include rationale and vote breakdown
        if show_rationale:
            return {
                "label": majority_label,
                "votes": vote_counts,
                "model_outputs": results
            }
        else:
            return {"label": majority_label}
        
        # # Single Threaded Option
        # results = []
        # for model_name in self.model:   # run models one by one
        #     output_text = self.generate(prompt, model_name)
        #     result = extract_json(output_text)
        #     results.append({
        #         "model": model_name,
        #         "label": result["label"],
        #         "rationale": result["rationale"]
        #     })

        # Majority voting
        vote_counts = Counter([r["label"] for r in results])
        majority_label = vote_counts.most_common(1)[0][0]

        if show_rationale:
            return {
                "label": majority_label,
                "votes": vote_counts,
                "model_outputs": results
            }
        else:
            return {"label": majority_label}
                    

if __name__ == "__main__":
    # Load vector store
    vs = VectorStore("assets/policies.md", "assets/exemplars.json")

    # Initialize RAG classifier
    classifier = RAGEnsembleClassifier(vs)

    # Test reviews
    test_reviews = [
        "Never been here but I heard it's terrible!",
        # "Best pizza in town! Highly recommend.",
        # "Visit www.pizzapromo.com for a discount!"
    ]

    for review in test_reviews:

        shop_info = {
            "Name": "Pizza Town",
            "Type": "Restaurant",
            "Known Promotions": "2-for-1 Tuesday deal, Student discount"}           
        
        result = classifier.classify(review, shop_info = shop_info) 
        
        print(f"\nReview: {review}")
        print(f"Prediction: {result}")
