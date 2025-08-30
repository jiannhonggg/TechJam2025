# Project Title : Leveraging LLM in Assessing Reviews with RAG

This project presents a novel approach to assessing and classifying user reviews. It aims to identify and categorize reviews that violate platform's policies, such as advertisements, irrelevant content, or rants without visit, while also identifying valid reviews. At its core, this is a machine learning classification problem.

### Introduction 

Traditional machine learning classification models often rely on large, pre-labeled datasets. However, due to the challenge of obtaining a sufficiently large and unfiltered dataset of TikTok reviews, we've came up with a different solution.

Our approach utilizes a Retrieval-Augmented Generation (RAG) system combined with an ensemble of three distinct Large Language Models (LLMs). This ensemble method allows us to leverage the unique strengths of each model to improve the overall classification accuracy. The choice of three models was a deliberate balance between maximizing performance and accommodating the computational limitations of a local machine. 

### Approach 
The project was structured into three main components:

RAG-Based Back-End:
We created a vector store containing policies and examples of policy violations. When a review is submitted, the RAG system retrieves the top k relevant vectors to provide context for the LLM. Additionally, users can inject metadata about the business or shop into the query, giving the model more context to make accurate judgments. This approach improves the reasoning capability of the LLM and enables better classification decisions.

Ensemble Approach:
To enhance reliability, we combine predictions from three differently pretrained LLMs using bootstrapping and majority voting. Bootstrapping is a simple yet powerful technique that allows us to leverage the strengths of all models without adding unnecessary complexity, improving the overall robustness of the classification pipeline. We selected three different models each with thier own strengths. A lighter weight model being something we kept in mind. The choice of model was because of how differnt they were, allowing each model to be unique and specialize in its own way. ( Models used : Llama2:7b, Deepseel r1-7b, gemma3:4b) 

Front-End Integration via API:
Once classifications are made, results and rationales are sent through API calls to the web interface developed with Lynx. This provides users with a smooth, interactive experience to test and evaluate reviews using our system.

### Testing Data 
For the purpose of evaluating our model's effectiveness, we have created a small, manually curated dataset to serve as our gold standard for testing. This dataset consists of around 80 samples per class, for a total of 361 samples across our four categories: rant_without_visits, advertisement, irrelevant, and valid.

This limited sample size is not used to train our models in the traditional sense, as our approach is based on Retrieval-Augmented Generation (RAG) and few-shot prompting. Instead, this dataset serves two key purposes:

Demonstration of Efficacy: The small dataset allows us to run rapid, repeatable tests to demonstrate that our RAG-based ensemble system can accurately classify reviews based on a limited set of examples.

Benchmark for Local Testing: It provides a practical, manageable benchmark for continuous integration and local development, allowing us to quickly verify that changes to the system do not degrade performance.

By using this small, high-quality dataset purely for evaluation, we can validate our innovative approach without the need for a massive, pre-labeled training corpus, proving that our methodology can perform well with minimal data.

### Results and Evaluation 
We evaluated our model using three key metrics : 

    1. Accuracy
    2. Precision 
    3. Recall 
Our system demonstrates strong precision in identifying valid content up to 88% accuracy and performs well across other classes though ambiguous or overlapping reveiws remain challenging. 

### Limitations and Future Works: 
This project has several limitations that can be addressed in future work:
- Due to lack of clear dataset and sufficeint clarrification between some classess. Model might have some overlap in classification for certain classes. 
- Small time frame and window makes it difficult to build a clean lablled dataset from scratch, however it encourage innocative solution and new ideas. 

# Set Up Guide
Follow the instructions below to start up the app.

### Prerequisites
Python: Ensure you have Python installed. The project was developed with Python 3.1.2

Ollama: You need to have Ollama installed and running on your system to manage the language models.

### Installation
Clone the Repository


```bash
git clone https://github.com/your-username/your-project-name.git
cd your-project-name
``` 

Set up virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
``` 

Install dependencies 
```bash
pip install -r requirements.txt
``` 

Set Up Ollama Models
```bash
ollama pull llama2:7b
ollama pull deepseek-r17b
ollama pull gemma:4b
``` 

Usage : To run the application, execute the app.py script 
```bash
python app.py
``` 
### Installation for LynxWebapp
See: [Details](LynxWeb/README.md)

# How to reproduce results : 
Assuming that you have followed the set up guide correctly.
Run the command below on the command line. if testing for performance metrics on how it fare against our dataset. 

```bash
python -m src_TestSet.evaluate
``` 
OR 
Run the application to play with the single classifcation and batch classifcation and view rationale. 