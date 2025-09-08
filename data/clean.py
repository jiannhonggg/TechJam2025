import pandas as pd 
df = pd.read_csv("data/reviews_dataset.csv")
true_labels = df["review_category"].unique()
print(true_labels)
