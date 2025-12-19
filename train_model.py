import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# 1. Load the data
df = pd.read_csv('heart-disease.csv')

# 2. Prepare Features and Labels
# X = everything except the target
# y = only the target
X = df.drop('target', axis=1)
y = df['target']

# 3. Split into Training (80%) and Test (20%) sets
# random_state=42 ensures we get the same split every time we run it
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

# 4. Initialize and Train the Model
# n_estimators=100 means we are using 100 small decision trees
model = RandomForestClassifier(n_estimators=100, random_state=42)
print("\nTraining the model... (creating 100 decision trees)")
model.fit(X_train, y_train)

# 5. Evaluate the Model
y_preds = model.predict(X_test)
accuracy = accuracy_score(y_test, y_preds)

print(f"\n--- Model Evaluation ---")
print(f"Accuracy Score: {accuracy * 100:.2f}%")
print("\nDetailed Report:")
print(classification_report(y_test, y_preds))

# 6. Save the model for later use in our Web App
joblib.dump(model, 'heart_disease_model.pkl')
print("\nModel saved as 'heart_disease_model.pkl'")
