import pandas as pd 
df = pd.read_csv("data/reviews_dataset.csv")
true_labels = df["review_category"].unique()
print(true_labels)

# unique_businesses = df["business_name"].dropna().unique()

# print(f"Found {len(unique_businesses)} unique businesses.")
# print(unique_businesses)
df = df.sample(n=5, random_state=42)
reviews = list(zip(df["text"], df["business_name"]))
print(reviews)