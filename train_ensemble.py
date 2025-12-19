import pandas as pd
import joblib
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# 1. Load the combined data
df = pd.read_csv('combined-heart-data.csv')
X = df.drop('target', axis=1)
y = df['target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Ensemble Models...")

# Model A: Random Forest (Optimized)
rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, min_samples_leaf=4, random_state=42)
rf_model.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test))

# Model B: Logistic Regression (Clinical Baseline)
lr_model = LogisticRegression(max_iter=1000, random_state=42)
lr_model.fit(X_train, y_train)
lr_acc = accuracy_score(y_test, lr_model.predict(X_test))

# Model C: XGBoost (High Precision)
xgb_model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=3, random_state=42)
xgb_model.fit(X_train, y_train)
xgb_acc = accuracy_score(y_test, xgb_model.predict(X_test))

print(f"RF Accuracy: {rf_acc:.2%}")
print(f"LR Accuracy: {lr_acc:.2%}")
print(f"XGB Accuracy: {xgb_acc:.2%}")

# Save all models
models = {
    'rf': rf_model,
    'lr': lr_model,
    'xgb': xgb_model,
    'feature_names': X.columns.tolist()
}
joblib.dump(models, 'ensemble_models.pkl')
print("\nEnsemble saved to 'ensemble_models.pkl'")
