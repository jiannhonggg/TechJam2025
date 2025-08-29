from flask import Flask, request, jsonify
from src_RAG.rag_classifier import RAGEnsembleClassifier
from src_RAG.vector_store import VectorStore
from pyngrok import ngrok

app =Flask(__name__)

@app.route("/", methods=["GET"])
def home() : 
    return "Hi, my name is review classifier chan"

# Initialize RAG classifier
vs = VectorStore("assets/policies.md", "assets/exemplars.json")
classifier = RAGEnsembleClassifier(vs)

@app.route("/predict", methods=['POST'])
def predict(): 
    data = request.json
    text = data.get("text", "")
    
    #Call our model 
    result = classifier.classify(text) 
    return jsonify(result)

        
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)

