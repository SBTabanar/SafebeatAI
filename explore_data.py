import pandas as pd

# Load the dataset
df = pd.read_csv('heart-disease.csv')

# Show the first 5 rows
print("--- First 5 Rows ---")
print(df.head())

# Get summary information
print("\n--- Data Info ---")
print(df.info())

# Check for missing values
print("\n--- Missing Values ---")
print(df.isna().sum())

# Check the distribution of our 'target' (1 = disease, 0 = no disease)
print("\n--- Target Distribution ---")
print(df['target'].value_counts())
