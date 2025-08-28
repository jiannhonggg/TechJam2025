# TechJam2025 


Choosing Sample Size for our Validation Dataset. 
1. Able to reflect the different classes [valid, advertisement, irrelevant, rant_without_vsit]
2. Large enough to make our performance metrics meaningful (precision, recall, F1-score)
3. Is small enough to manually validate or showcase 

Sample size rule of thumb, Classification Task. 
Disered Confidence Level ( 95% ) 
Expeceted proportion of positive labels
Acceptable error margin (e)

n = Z^2 * p * (1-p) / e^2 

Esstimated about 70-75 Samples per class is statistically reasonable. 
Try to source for equal number of reviews per class. 
If not enough we can use stratified sampling across classes to cover all violation types. 
Total 280 Reviews


For Presentation itself 
- Diverse Examples 
- Reviews that are borderline (ambiguous) Demonstrate RAG reasoning. 
- Highlight Misclassified Reveiws to discuss Limitations 