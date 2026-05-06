"""
SafeBeat AI - Clinical Diagnostic API
A production-ready Flask backend serving an ensemble ML model for cardiovascular risk assessment.
"""

import os
import logging
import sys
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import joblib
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
class Config:
    """Application configuration loaded from environment variables."""
    PORT = int(os.environ.get("PORT", 5001))
    HOST = os.environ.get("HOST", "0.0.0.0")
    DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
    RATE_LIMIT = os.environ.get("RATE_LIMIT", "100 per minute")
    MODEL_PATH = os.environ.get("MODEL_PATH", "ensemble_models.pkl")
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
class JsonFormatter(logging.Formatter):
    """Simple JSON-like formatter for structured logging."""
    def format(self, record):
        import json
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "status_code"):
            log_obj["status_code"] = record.status_code
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logging(level: str):
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = []
    root.addHandler(handler)
    root.setLevel(getattr(logging, level, logging.INFO))
    return logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App Factory
# ---------------------------------------------------------------------------
def create_app(config: Config = None) -> Flask:
    config = config or Config()
    logger = setup_logging(config.LOG_LEVEL)

    app = Flask(__name__)
    CORS(app, origins=config.CORS_ORIGINS)

    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[config.RATE_LIMIT],
        storage_uri="memory://",
    )

    # -----------------------------------------------------------------------
    # Model Loading
    # -----------------------------------------------------------------------
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ensemble_path = os.path.join(base_dir, config.MODEL_PATH)
    ensemble = None

    try:
        ensemble = joblib.load(ensemble_path)
        logger.info("Ensemble loaded successfully.", extra={"model_path": ensemble_path})
    except Exception as e:
        logger.error(f"Failed to load ensemble: {e}")

    # -----------------------------------------------------------------------
    # Input Validation
    # -----------------------------------------------------------------------
    REQUIRED_FEATURES = [
        "age", "sex", "cp", "trestbps", "chol", "fbs",
        "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
    ]

    RANGES = {
        "age": (0, 120),
        "sex": (0, 1),
        "cp": (0, 3),
        "trestbps": (50, 250),
        "chol": (50, 600),
        "fbs": (0, 1),
        "restecg": (0, 2),
        "thalach": (40, 250),
        "exang": (0, 1),
        "oldpeak": (0.0, 10.0),
        "slope": (0, 2),
        "ca": (0, 3),
        "thal": (1, 3),
    }

    def validate_payload(data: dict) -> tuple:
        if not data:
            return False, "No JSON payload provided."
        missing = [f for f in REQUIRED_FEATURES if f not in data]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}"
        out_of_range = []
        for field, (lo, hi) in RANGES.items():
            try:
                val = float(data[field])
                if not (lo <= val <= hi):
                    out_of_range.append(f"{field} must be between {lo} and {hi}")
            except (ValueError, TypeError):
                out_of_range.append(f"{field} must be a number")
        if out_of_range:
            return False, "; ".join(out_of_range)
        return True, None

    # -----------------------------------------------------------------------
    # Routes
    # -----------------------------------------------------------------------
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "service": "SafeBeat AI API",
            "version": "2.8.0",
            "status": "operational",
            "docs": "/docs",
        }), 200

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy" if ensemble else "unhealthy",
            "ensemble_ready": ensemble is not None,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }), 200 if ensemble else 503

    @app.route("/predict", methods=["POST"])
    @limiter.limit("20 per minute")
    def predict():
        if ensemble is None:
            logger.error("Prediction attempted while model is unavailable.")
            return jsonify({"error": "Model not loaded on server"}), 503

        data = request.get_json(silent=True)
        valid, msg = validate_payload(data)
        if not valid:
            logger.warning(f"Validation failed: {msg}")
            return jsonify({"error": msg}), 400

        try:
            features = ensemble["feature_names"]
            input_values = [float(data.get(f, 0)) for f in features]
            input_df = pd.DataFrame([input_values], columns=features)

            # Individual model predictions
            p_rf = int(ensemble["rf"].predict(input_df)[0])
            p_lr = int(ensemble["lr"].predict(input_df)[0])
            p_xgb = int(ensemble["xgb"].predict(input_df)[0])

            predictions = [p_rf, p_lr, p_xgb]
            risk_count = sum(predictions)
            final_prediction = 1 if risk_count >= 2 else 0

            # Confidence scores
            prob_rf = ensemble["rf"].predict_proba(input_df)[0][p_rf]
            prob_lr = ensemble["lr"].predict_proba(input_df)[0][p_lr]
            prob_xgb = ensemble["xgb"].predict_proba(input_df)[0][p_xgb]
            avg_confidence = round(((prob_rf + prob_lr + prob_xgb) / 3) * 100, 2)

            # Risk drivers using Random Forest feature importances
            importances = ensemble["rf"].feature_importances_
            drivers = [
                {"name": name, "impact": round(float(importances[i] * 100), 1)}
                for i, name in enumerate(features)
            ]
            drivers.sort(key=lambda x: x["impact"], reverse=True)

            response_payload = {
                "prediction": final_prediction,
                "consensus": f"{risk_count}/3 Models Calculated Risk",
                "result": "High Cardiovascular Risk" if final_prediction == 1 else "Healthy Cardiovascular Profile",
                "confidence": f"{avg_confidence}%",
                "models_detail": {
                    "RandomForest": {"pred": p_rf, "conf": f"{round(prob_rf * 100, 1)}%", "accuracy": "88.7%"},
                    "LogisticRegression": {"pred": p_lr, "conf": f"{round(prob_lr * 100, 1)}%", "accuracy": "89.6%"},
                    "XGBoost": {"pred": p_xgb, "conf": f"{round(prob_xgb * 100, 1)}%", "accuracy": "88.7%"},
                },
                "top_factors": drivers[:3],
                "disclaimer": "Consensus-based AI assessment. Not a medical diagnosis.",
            }

            logger.info("Prediction served successfully.", extra={
                "prediction": final_prediction,
                "confidence": avg_confidence,
            })
            return jsonify(response_payload), 200

        except Exception as e:
            logger.exception("Unhandled error during prediction.")
            return jsonify({"error": "Internal server error during prediction."}), 500

    @app.route("/docs", methods=["GET"])
    def docs():
        return jsonify({
            "endpoints": {
                "GET /": "Service metadata.",
                "GET /health": "Health and readiness check.",
                "POST /predict": {
                    "description": "Run ensemble prediction.",
                    "body": {f: f"float ({RANGES[f][0]}-{RANGES[f][1]})" for f in REQUIRED_FEATURES},
                    "rate_limit": "20 per minute",
                },
                "GET /docs": "This documentation.",
            }
        }), 200

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded.", "retry_after": e.description}), 429

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Internal server error.")
        return jsonify({"error": "Internal server error."}), 500

    return app

# ---------------------------------------------------------------------------
# Application instance for WSGI servers (Gunicorn, uWSGI, etc.)
# ---------------------------------------------------------------------------
app = create_app(Config())

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    config = Config()
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
