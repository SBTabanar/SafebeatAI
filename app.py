"""
SafeBeat AI - Clinical Diagnostic API
A hardened, production-ready Flask backend for cardiovascular risk assessment.
"""

import os
import logging
import sys
import hashlib
import json
import re
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import joblib
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
    META_PATH = os.environ.get("META_PATH", "model_meta.json")
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
    API_KEY = os.environ.get("API_KEY", "")
    SECRET_KEY = os.environ.get("SECRET_KEY", os.urandom(32).hex())
    AUDIT_LOG = os.environ.get("AUDIT_LOG", "true").lower() == "true"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
class JsonFormatter(logging.Formatter):
    """Structured JSON logging for observability."""
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
# Security Utilities
# ---------------------------------------------------------------------------
_SANITIZE_RE = re.compile(r"[^\w\s\-\.\(\)]")

def sanitize_name(name: str, max_len: int = 100) -> str:
    """Remove potentially dangerous characters from patient names."""
    if not isinstance(name, str):
        return "Unknown"
    cleaned = _SANITIZE_RE.sub("", name.strip())
    return cleaned[:max_len] or "Unknown"

def hash_identifier(name: str, timestamp: str) -> str:
    """Create a deterministic hash for audit logging without storing PHI."""
    return hashlib.sha256(f"{name}:{timestamp}".encode()).hexdigest()[:16]

# ---------------------------------------------------------------------------
# App Factory
# ---------------------------------------------------------------------------
def create_app(config: Config = None) -> Flask:
    config = config or Config()
    logger = setup_logging(config.LOG_LEVEL)

    app = Flask(__name__)
    app.secret_key = config.SECRET_KEY
    CORS(app, origins=config.CORS_ORIGINS)

    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[config.RATE_LIMIT],
        storage_uri="memory://",
    )

    # -----------------------------------------------------------------------
    # Auth Middleware
    # -----------------------------------------------------------------------
    @app.before_request
    def require_api_key():
        if not config.API_KEY:
            return None
        if request.method == "OPTIONS":
            return None
        # Public endpoints
        if request.endpoint in ("index", "health", "docs"):
            return None
        provided = request.headers.get("X-API-Key", "")
        if not provided:
            return jsonify({"error": "Missing X-API-Key header"}), 401
        if not secrets.compare_digest(provided, config.API_KEY):
            return jsonify({"error": "Invalid API key"}), 403

    # -----------------------------------------------------------------------
    # Model & Metadata Loading
    # -----------------------------------------------------------------------
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ensemble_path = os.path.join(base_dir, config.MODEL_PATH)
    meta_path = os.path.join(base_dir, config.META_PATH)
    ensemble = None
    meta = {}

    try:
        ensemble = joblib.load(ensemble_path)
        logger.info("Ensemble loaded successfully.", extra={"model_path": ensemble_path})
    except Exception as e:
        logger.error(f"Failed to load ensemble: {e}")

    try:
        with open(meta_path, "r") as f:
            meta = json.load(f)
        logger.info("Model metadata loaded.", extra={"version": meta.get("model_version")})
    except Exception as e:
        logger.warning(f"Failed to load model metadata: {e}")

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

    REFERENCE_RANGES = {
        "age": "0-120",
        "sex": "0-1",
        "cp": "0-3",
        "trestbps": "90-140",
        "chol": "125-200",
        "fbs": "0-1",
        "restecg": "0-2",
        "thalach": "60-200",
        "exang": "0-1",
        "oldpeak": "0.0-6.0",
        "slope": "0-2",
        "ca": "0-3",
        "thal": "1-3",
    }

    def validate_payload(data: dict) -> tuple:
        if not data:
            return False, "No JSON payload provided.", None
        missing = [f for f in REQUIRED_FEATURES if f not in data]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}", None
        out_of_range = []
        for field, (lo, hi) in RANGES.items():
            try:
                val = float(data[field])
                if not (lo <= val <= hi):
                    out_of_range.append(f"{field} must be between {lo} and {hi}")
            except (ValueError, TypeError):
                out_of_range.append(f"{field} must be a number")
        if out_of_range:
            return False, "; ".join(out_of_range), None
        return True, None, data

    # -----------------------------------------------------------------------
    # Routes
    # -----------------------------------------------------------------------
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "service": "SafeBeat AI API",
            "version": meta.get("model_version", "unknown"),
            "status": "operational",
            "docs": "/docs",
            "api_version": "v1",
        }), 200

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy" if ensemble else "unhealthy",
            "ensemble_ready": ensemble is not None,
            "model_version": meta.get("model_version"),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }), 200 if ensemble else 503

    @app.route("/api/health", methods=["GET"])
    def api_health():
        return health()

    @app.route("/api/v1/predict", methods=["POST"])
    @limiter.limit("20 per minute")
    def predict_v1():
        return _predict_internal()

    # Backward compatibility
    @app.route("/predict", methods=["POST"])
    @limiter.limit("20 per minute")
    def predict_legacy():
        return _predict_internal()

    def _predict_internal():
        if ensemble is None:
            logger.error("Prediction attempted while model is unavailable.")
            return jsonify({"error": "Model not loaded on server"}), 503

        data = request.get_json(silent=True)
        valid, msg, _ = validate_payload(data)
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

            # Risk drivers
            importances = ensemble["rf"].feature_importances_
            drivers = [
                {"name": name, "impact": round(float(importances[i] * 100), 1)}
                for i, name in enumerate(features)
            ]
            drivers.sort(key=lambda x: x["impact"], reverse=True)

            # Model metadata
            models_meta = meta.get("models", {})
            response_payload = {
                "prediction": final_prediction,
                "consensus": f"{risk_count}/3 Models Calculated Risk",
                "result": "High Cardiovascular Risk" if final_prediction == 1 else "Healthy Cardiovascular Profile",
                "confidence": f"{avg_confidence}%",
                "models_detail": {
                    "RandomForest": {
                        "pred": p_rf,
                        "conf": f"{round(prob_rf * 100, 1)}%",
                        "accuracy": models_meta.get("RandomForest", {}).get("accuracy", "N/A"),
                    },
                    "LogisticRegression": {
                        "pred": p_lr,
                        "conf": f"{round(prob_lr * 100, 1)}%",
                        "accuracy": models_meta.get("LogisticRegression", {}).get("accuracy", "N/A"),
                    },
                    "XGBoost": {
                        "pred": p_xgb,
                        "conf": f"{round(prob_xgb * 100, 1)}%",
                        "accuracy": models_meta.get("XGBoost", {}).get("accuracy", "N/A"),
                    },
                },
                "top_factors": drivers[:3],
                "reference_ranges": REFERENCE_RANGES,
                "bias_warning": meta.get("demographic_bias_warning", ""),
                "model_version": meta.get("model_version", "unknown"),
                "disclaimer": "Consensus-based AI assessment. Not a medical diagnosis.",
            }

            # Audit logging
            if config.AUDIT_LOG:
                patient_name = sanitize_name(data.get("patientName", "Unknown"))
                audit_id = hash_identifier(patient_name, datetime.utcnow().isoformat())
                logger.info("Prediction served.", extra={
                    "audit_id": audit_id,
                    "prediction": final_prediction,
                    "confidence": avg_confidence,
                    "model_version": meta.get("model_version"),
                })

            return jsonify(response_payload), 200

        except Exception as e:
            logger.exception("Unhandled error during prediction.")
            return jsonify({"error": "Internal server error during prediction."}), 500

    @app.route("/api/v1/batch", methods=["POST"])
    @limiter.limit("10 per minute")
    def batch_predict():
        if ensemble is None:
            return jsonify({"error": "Model not loaded on server"}), 503

        body = request.get_json(silent=True)
        if not body or not isinstance(body, list):
            return jsonify({"error": "Request body must be a JSON array of patient records."}), 400

        results = []
        for idx, row in enumerate(body):
            valid, msg, _ = validate_payload(row)
            if not valid:
                results.append({"row": idx, "error": msg, "prediction": None})
                continue
            try:
                features = ensemble["feature_names"]
                vals = [float(row.get(f, 0)) for f in features]
                df = pd.DataFrame([vals], columns=features)
                preds = [int(ensemble[m].predict(df)[0]) for m in ["rf", "lr", "xgb"]]
                risk = sum(preds)
                final = 1 if risk >= 2 else 0
                probs = [ensemble[m].predict_proba(df)[0][preds[i]] for i, m in enumerate(["rf", "lr", "xgb"])]
                conf = round(sum(probs) / 3 * 100, 2)
                results.append({
                    "row": idx,
                    "prediction": final,
                    "result": "High Cardiovascular Risk" if final == 1 else "Healthy Cardiovascular Profile",
                    "confidence": f"{conf}%",
                    "error": None,
                })
            except Exception as e:
                results.append({"row": idx, "error": str(e), "prediction": None})

        return jsonify({"results": results, "model_version": meta.get("model_version", "unknown")}), 200

    @app.route("/docs", methods=["GET"])
    def docs():
        return jsonify({
            "endpoints": {
                "GET /": "Service metadata.",
                "GET /health": "Health and readiness check.",
                "POST /api/v1/predict": {
                    "description": "Run ensemble prediction.",
                    "body": {f: f"float ({RANGES[f][0]}-{RANGES[f][1]})" for f in REQUIRED_FEATURES},
                    "rate_limit": "20 per minute",
                    "headers": {"X-API-Key": "Required if API_KEY env var is set"},
                },
                "POST /api/v1/batch": {
                    "description": "Batch prediction for multiple records.",
                    "body": "Array of patient objects",
                    "rate_limit": "10 per minute",
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
# Application instance for WSGI servers
# ---------------------------------------------------------------------------
import secrets
app = create_app(Config())

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    config = Config()
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
