import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd 
from src_RAG.rag_classifier import RAGEnsembleClassifier
from src_RAG.vector_store import VectorStore
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

df = pd.read_csv("data/reviews_dataset.csv")

# Get a random sample of 50 reviews for evaluation
# df = df.sample(n=50, random_state=42)

texts = df["text"].tolist()
true_labels = df["review_category"].tolist()

# Run Inferences 
vs = VectorStore("assets/policies.md", "assets/exemplars.json")
classifier = RAGEnsembleClassifier(vs)

# Use classify_batch for multiple inferences
predicted_results = classifier.classify_batch(texts, show_rationale=False, sleep=0.1)

# Extract predicted labels
predicted_labels = [result["label"] for result in predicted_results]

# Filter out 'unknown' predictions for a more accurate report
filtered_true_labels = []
filtered_predicted_labels = []
for i in range(len(predicted_labels)):
    if predicted_labels[i] != 'unknown':
        filtered_predicted_labels.append(predicted_labels[i])
        filtered_true_labels.append(true_labels[i])

# --- Model Performance Metrics ---
print("\n--- Model Performance Metrics ---")

# Get all unique labels to ensure a complete report
labels_to_evaluate = sorted(list(set(filtered_true_labels + filtered_predicted_labels)))

# Calculate metrics
accuracy = accuracy_score(filtered_true_labels, filtered_predicted_labels)
precision, recall, f1_score, _ = precision_recall_fscore_support(
    filtered_true_labels,
    filtered_predicted_labels,
    labels=labels_to_evaluate,
    zero_division=0,
    average=None # Set to None for per-class metrics
)

# Print the report
print(f"Overall Accuracy: {accuracy:.4f}\n")
print(f"{'Category':<20} {'Precision':<15} {'Recall':<15} {'F1-Score':<15}")
print("-" * 65)

for i, label in enumerate(labels_to_evaluate):
    print(f"{label:<20} {precision[i]:<15.4f} {recall[i]:<15.4f} {f1_score[i]:<15.4f}")

# # --- Individual Review Check ---
# print("\n--- Individual Review Check ---")
# for i in range(len(texts)):
#     print(f"Review {i+1}: {texts[i]}")
#     print(f"  Actual:    {true_labels[i]}")
#     print(f"  Predicted: {predicted_labels[i]}\n")

