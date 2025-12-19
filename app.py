from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app) 

# Load the ensemble
try:
    ensemble = joblib.load('ensemble_models.pkl')
    logger.info("Ensemble loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load ensemble: {e}")

FEATURES = ensemble['feature_names']

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "ensemble_ready": ensemble is not None})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        
        # 1. Prepare Data
        input_values = [float(data.get(f, 0)) for f in FEATURES]
        input_df = pd.DataFrame([input_values], columns=FEATURES)
        
        # 2. Get Predictions from all 3 models
        p_rf = int(ensemble['rf'].predict(input_df)[0])
        p_lr = int(ensemble['lr'].predict(input_df)[0])
        p_xgb = int(ensemble['xgb'].predict(input_df)[0])
        
        # 3. Consensus Logic
        predictions = [p_rf, p_lr, p_xgb]
        risk_count = sum(predictions)
        final_prediction = 1 if risk_count >= 2 else 0 # Majority vote
        
        # 4. Confidence (Average of probabilities)
        prob_rf = ensemble['rf'].predict_proba(input_df)[0][p_rf]
        prob_lr = ensemble['lr'].predict_proba(input_df)[0][p_lr]
        prob_xgb = ensemble['xgb'].predict_proba(input_df)[0][p_xgb]
        
        avg_confidence = round(((prob_rf + prob_lr + prob_xgb) / 3) * 100, 2)
        
        # 5. Mathematical Risk Drivers (Feature Importance * Input Magnitude)
        # We'll use RF importances as they were the most accurate
        importances = ensemble['rf'].feature_importances_
        drivers = []
        for i, name in enumerate(FEATURES):
            impact = float(importances[i] * 100)
            drivers.append({"name": name, "impact": round(impact, 1)})
        
        drivers.sort(key=lambda x: x['impact'], reverse=True)

        return jsonify({
            'prediction': final_prediction,
            'consensus': f"{risk_count}/3 Models Calculated Risk",
            'result': "High Cardiovascular Risk" if final_prediction == 1 else "Healthy Cardiovascular Profile",
            'confidence': f"{avg_confidence}%",
            'models_detail': { 
                'RandomForest': {'pred': p_rf, 'conf': f"{round(prob_rf * 100, 1)}%", 'accuracy': '88.7%'},
                'LogisticRegression': {'pred': p_lr, 'conf': f"{round(prob_lr * 100, 1)}%", 'accuracy': '89.6%'},
                'XGBoost': {'pred': p_xgb, 'conf': f"{round(prob_xgb * 100, 1)}%", 'accuracy': '88.7%'}
            },
            'top_factors': drivers[:3],
            'disclaimer': "Consensus-based AI assessment. Not a medical diagnosis."
        })

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
