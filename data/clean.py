import pandas as pd 
df = pd.read_csv("data/reviews.csv")

print(df.columns)

print(df['business_name'].unique()) 
df_downsampled = df.groupby('business_name').head(1).reset_index(drop=True)

df_downsampled.to_csv("cleaned.csv",index = False)