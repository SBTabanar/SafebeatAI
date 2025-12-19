import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# 1. Load the data
df = pd.read_csv('heart-disease.csv')
X = df.drop('target', axis=1)
y = df['target']

# 2. Split into Training and Test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Define the "Hyperparameter Grid" 
# These are different 'knobs' we can turn on the Random Forest
param_grid = {
    'n_estimators': [50, 100, 200],      # Number of trees
    'max_depth': [None, 10, 20, 30],     # How deep each tree can go
    'min_samples_split': [2, 5, 10],     # Min samples required to split a node
    'min_samples_leaf': [1, 2, 4],       # Min samples required at a leaf node
    'bootstrap': [True, False]           # Method for sampling data
}

print("Starting Grid Search... (this tries many combinations)")

# 4. Initialize the Grid Search
# cv=5 means 5-fold cross-validation
grid_search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_grid=param_grid,
    cv=5, 
    n_jobs=-1, 
    verbose=1,
    scoring='accuracy'
)

# 5. Fit the model
grid_search.fit(X_train, y_train)

# 6. Get the best parameters and the best model
best_model = grid_search.best_estimator_
print(f"\nBest Parameters Found: {grid_search.best_params_}")

# 7. Evaluate the best model
y_preds = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_preds)

print(f"\n--- Improved Model Evaluation ---")
print(f"New Accuracy Score: {accuracy * 100:.2f}%")
print("\nDetailed Report:")
print(classification_report(y_test, y_preds))

# 8. Save the improved model
joblib.dump(best_model, 'heart_disease_model.pkl')
print("\nImproved model saved as 'heart_disease_model.pkl'")

# 9. Feature Importance - See what matters most
importances = pd.DataFrame({
    'feature': X.columns,
    'importance': best_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n--- Top 5 Most Important Factors ---")
print(importances.head(5))
