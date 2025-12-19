import pandas as pd
import joblib
import xgboost as xgb
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# 1. Load the data
df = pd.read_csv('heart-disease.csv')
X = df.drop('target', axis=1)
y = df['target']

# 2. Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Train XGBoost
# We use 'binary:logistic' for a yes/no prediction
print("Training XGBoost model...")
model = xgb.XGBClassifier(
    n_estimators=100,
    learning_rate=0.05,
    max_depth=3,
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)
model.fit(X_train, y_train)

# 4. Evaluate
y_preds = model.predict(X_test)
accuracy = accuracy_score(y_test, y_preds)
print(f"\nXGBoost Accuracy: {accuracy * 100:.2f}%")

# 5. Create Ethical Explainer (SHAP)
# This is like an 'X-Ray' for the model's brain
explainer = shap.Explainer(model)
# We also save the feature names
feature_names = X.columns.tolist()

# 6. Save everything
joblib.dump(model, 'heart_disease_model.pkl')
joblib.dump(explainer, 'shap_explainer.pkl')
joblib.dump(feature_names, 'feature_names.pkl')

print("\nModel and Explainer saved successfully!")
