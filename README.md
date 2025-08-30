# Project Title : Leveraging LLM in Assessing Reviews with RAG

This project presents a novel approach to assessing and classifying TikTok user reviews. It aims to identify and categorize reviews that violate the platform's policies, such as advertisements, irrelevant content, or rants without visit, while also identifying valid reviews. At its core, this is a machine learning classification problem.

### Introduction 

Traditional machine learning classification models often rely on large, pre-labeled datasets. However, due to the challenge of obtaining a sufficiently large and unfiltered dataset of TikTok reviews, we've came up with a different solution.

Our approach utilizes a Retrieval-Augmented Generation (RAG) system combined with an ensemble of three distinct Large Language Models (LLMs). This ensemble method allows us to leverage the unique strengths of each model to improve the overall classification accuracy. The choice of three models was a deliberate balance between maximizing performance and accommodating the computational limitations of a local machine. 

< Insert Picture of our architecture >  

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

### Limitations and Future Works: 
This project has several limitations that can be addressed in future work:
- Short time frame etx 

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