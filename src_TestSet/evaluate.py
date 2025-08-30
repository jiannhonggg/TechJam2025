import pandas as pd 
from src_RAG.rag_classifier import RAGEnsembleClassifier
from src_RAG.vector_store import VectorStore
from sklearn.metrics import accuracy_score

df = pd.read_csv("data/reviews_dataset.csv")

# Get a random sample of 50 rows from the DataFrame
df = df.sample(n=50, random_state=42)

texts = df["text"].tolist()
true_labels = df["review_category"].tolist()

# Run Inferences 
vs = VectorStore("assets/policies.md", "assets/exemplars.json")
classifier = RAGEnsembleClassifier(vs)

# SINGLE INFERENCE
# result = classifier.classify("This place is pretty nice, i would reccomend") 
# print(f"Label : {result['label']}")

# Use classify_batch for multiple inferences
predicted_results = classifier.classify_batch(texts, show_rationale=False, sleep=0.1)

# Extract predicted labels
predicted_labels = [result["label"] for result in predicted_results]

# Print the results for comparison
print("Reviews Classified:")
print("-" * 25)
for i in range(len(texts)):
    print(f"Review {i+1}: {texts[i]}")
    print(f"  Actual:    {true_labels[i]}")
    print(f"  Predicted: {predicted_labels[i]}\n")

# Calculate and print accuracy
accuracy = accuracy_score(true_labels, predicted_labels)
print("-" * 25)
print(f"Accuracy on the first 50 rows: {accuracy:.2f}")