import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# 1. Load Original Data
df_old = pd.read_csv('heart-disease.csv')

# 2. Load and Prepare New Data
df_new = pd.read_csv('new-heart-data.csv')

# Mapping columns: New Name -> Old Name
column_mapping = {
    'Age': 'age',
    'Sex': 'sex',
    'Chest pain type': 'cp',
    'BP': 'trestbps',
    'Cholesterol': 'chol',
    'FBS over 120': 'fbs',
    'EKG results': 'restecg',
    'Max HR': 'thalach',
    'Exercise angina': 'exang',
    'ST depression': 'oldpeak',
    'Slope of ST': 'slope',
    'Number of vessels fluro': 'ca',
    'Thallium': 'thal',
    'Heart Disease': 'target'
}
df_new = df_new.rename(columns=column_mapping)

# Fix Labels and Align Features
# 1. Target: New has Presence=1, Absence=0. Old has 1=Healthy, 0=Disease.
# We want 1=Disease (Risk) across both.
df_new['target'] = df_new['target'].map({'Presence': 1, 'Absence': 0})
df_old['target'] = df_old['target'].map({0: 1, 1: 0}) # Flip old labels

# 2. CP: New is 1-4, Old is 0-3
df_new['cp'] = df_new['cp'] - 1

# 3. Slope: New is 1-3, Old is 0-2
df_new['slope'] = df_new['slope'] - 1

# 4. Thal: New is 3,6,7. Old is 1,2,3.
# Mapping based on distribution and clinical standards:
# 6 (Fixed) -> 1, 3 (Normal) -> 2, 7 (Reversable) -> 3
thal_map = {6: 1, 3: 2, 7: 3}
df_new['thal'] = df_new['thal'].map(thal_map).fillna(2) # Default to 2 (Normal)

# 3. Combine them!
df_combined = pd.concat([df_old, df_new], ignore_index=True)
print(f"Combined Dataset Size: {df_combined.shape}")

# 4. Retrain with the larger dataset
X = df_combined.drop('target', axis=1)
y = df_combined['target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Use the best settings we found earlier
param_grid = {
    'n_estimators': [50, 100],
    'max_depth': [None, 10, 20],
    'min_samples_leaf': [1, 2, 4],
    'bootstrap': [True, False]
}

grid_search = GridSearchCV(RandomForestClassifier(random_state=42), param_grid, cv=5, n_jobs=-1)
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_
y_preds = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_preds)

print(f"\n--- Combined Model Results ---")
print(f"New Total Samples: {len(df_combined)}")
print(f"Final Accuracy Score: {accuracy * 100:.2f}%")

# 5. Save the updated "Master" model
joblib.dump(best_model, 'heart_disease_model.pkl')
df_combined.to_csv('combined-heart-data.csv', index=False)
print("\nUpdated model and combined dataset saved!")
