# src/rag_classifier.py
import json
from src_RAG.vector_store import VectorStore
# from vector_store import VectorStore
import ollama  # make sure ollama Python SDK is installed
import os 
from collections import Counter 
import re 
from concurrent.futures import ThreadPoolExecutor, as_completed
import time 

def extract_json(text): 
    """Safely extract JSON from any model output."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return {"label": "unknown", "rationale": text}
    return {"label": "unknown", "rationale": text}

labels = ["Valid", "Advertisement", "Irrelevant Content", "Rant Without Visit"]
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
    
    def pre_filter(self, review_text):
        """
        Simple Textual pre-filter for obvious cases. 
        Expandable and scalable over time. 
        Skips retrieval and inference -> huge speedup. 
        """
        text = review_text.lower()
        if "www." in text or "http" in text or "use code" in text:
            return "Advertisement"
        if "never been" in text or "haven't visited" in text:
            return "Rant Without Visit"
        return None


    def classify(self, review_text, shop_info = None, show_rationale = True):
        
        # Step 0: pre-filter
        pre_label = self.pre_filter(review_text)
        if pre_label:
            return {
                "label": pre_label,
                "votes": {pre_label: len(self.model)},
                "model_outputs": [
                    {"model": m, "label": pre_label, "rationale": "Detected by pre-filter"}
                    for m in self.model
                ]
            }

        # Step 1 : retrieve top-k passages from vector store 
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
        Return JSON ONLY with 
        - 'label' (one of: {labels}), do NOT invent any other label.
        - 'rationale' (short explanation). 
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

    def classify_batch(self, reviews, shop_info=None, show_rationale=False, sleep=0.0):
        """
        Classify a list of reviews with optional shop-specific metadata.

        Args:
            reviews (list): Either:
                - list of str (review_texts) → uses one global shop_info dict
                - list of (review_text, business_name) → lookup per shop
            shop_info (dict, optional): Full metadata dict, e.g. from metadata.py
            show_rationale (bool): Whether to include rationale and vote breakdown.
            sleep (float): Optional delay between reviews (seconds).

        Returns:
            list[dict]: List of classification outputs.
        """

        tasks = []

        # Case 1: reviews is list of strings
        if all(isinstance(r, str) for r in reviews):
            for review in reviews:
                tasks.append((review, shop_info or {}))  # just pass global shop_info dict

        # Case 2: reviews is list of (review_text, business_name)
        elif all(isinstance(r, tuple) and len(r) == 2 for r in reviews):
            for review_text, business_name in reviews:
                metadata = {}
                if shop_info:  # lookup if dict provided
                    metadata = shop_info.get(business_name, {})
                tasks.append((review_text, metadata))
        else:
            raise ValueError("Reviews must be list of strings OR list of (review_text, business_name) tuples")

        # Run in parallel
        with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
            futures = {
                executor.submit(self.classify, review_text, metadata, show_rationale): (review_text, metadata)
                for review_text, metadata in tasks
            }

        ordered_results = []

        for future in futures:
            try:
                result = future.result()
                ordered_results.append(result)
            except Exception as e:
                print(f"[Error] Classification failed: {e}")
                ordered_results.append({"label": "error", "error": str(e)})

        return ordered_results

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

        # --- Measure Inference Time ---
        start_time = time.time()
        
        result = classifier.classify(review, shop_info = shop_info) 

        # --- Measure Inference Time --- 
        end_time = time.time() 
        total_time = end_time - start_time
        
        print(f"\nReview: {review}")
        print(f"Prediction: {result}")

        print(f"\n--- Inference Timing ---")
        print(f"Total time taken: {total_time:.4f} seconds")
