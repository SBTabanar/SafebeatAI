"""
Basic tests for the SafeBeat AI Flask backend.
Run with: pytest tests/
"""

import json
import pytest
from app import create_app, Config


class TestConfig(Config):
    """Test configuration with in-memory rate limiting."""
    TESTING = True
    RATE_LIMIT = "1000 per minute"
    MODEL_PATH = "ensemble_models.pkl"
    META_PATH = "model_meta.json"
    SECRET_KEY = "test-secret"
    API_KEY = ""


@pytest.fixture
def client():
    app = create_app(TestConfig())
    with app.test_client() as client:
        yield client


def test_index(client):
    response = client.get("/")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["service"] == "SafeBeat AI API"
    assert "version" in data
    assert data["api_version"] == "v1"


def test_health(client):
    response = client.get("/health")
    assert response.status_code in (200, 503)
    data = json.loads(response.data)
    assert "status" in data
    assert "ensemble_ready" in data
    assert "model_version" in data


def test_docs(client):
    response = client.get("/docs")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "endpoints" in data


def test_predict_missing_fields(client):
    response = client.post("/api/v1/predict", json={})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data


def test_predict_out_of_range(client):
    payload = {
        "age": 150,
        "sex": 1, "cp": 0, "trestbps": 120, "chol": 200, "fbs": 0,
        "restecg": 0, "thalach": 150, "exang": 0, "oldpeak": 0.0,
        "slope": 1, "ca": 0, "thal": 2,
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data


def test_predict_valid_payload(client):
    payload = {
        "age": 50, "sex": 1, "cp": 0, "trestbps": 120, "chol": 200, "fbs": 0,
        "restecg": 0, "thalach": 150, "exang": 0, "oldpeak": 0.0,
        "slope": 1, "ca": 0, "thal": 2,
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code in (200, 503)
    if response.status_code == 200:
        data = json.loads(response.data)
        assert "prediction" in data
        assert "confidence" in data
        assert "top_factors" in data
        assert "model_version" in data
        assert "bias_warning" in data


def test_batch_predict(client):
    payload = [
        {"age": 50, "sex": 1, "cp": 0, "trestbps": 120, "chol": 200, "fbs": 0, "restecg": 0, "thalach": 150, "exang": 0, "oldpeak": 0.0, "slope": 1, "ca": 0, "thal": 2},
        {"age": 25, "sex": 0, "cp": 0, "trestbps": 110, "chol": 170, "fbs": 0, "restecg": 0, "thalach": 180, "exang": 0, "oldpeak": 0.0, "slope": 1, "ca": 0, "thal": 2},
    ]
    response = client.post("/api/v1/batch", json=payload)
    assert response.status_code in (200, 503)
    if response.status_code == 200:
        data = json.loads(response.data)
        assert "results" in data
        assert len(data["results"]) == 2


def test_batch_predict_with_invalid_row(client):
    payload = [
        {"age": 50, "sex": 1, "cp": 0, "trestbps": 120, "chol": 200, "fbs": 0, "restecg": 0, "thalach": 150, "exang": 0, "oldpeak": 0.0, "slope": 1, "ca": 0, "thal": 2},
        {"age": 999, "sex": 1, "cp": 0, "trestbps": 120, "chol": 200, "fbs": 0, "restecg": 0, "thalach": 150, "exang": 0, "oldpeak": 0.0, "slope": 1, "ca": 0, "thal": 2},
    ]
    response = client.post("/api/v1/batch", json=payload)
    assert response.status_code in (200, 503)
    if response.status_code == 200:
        data = json.loads(response.data)
        assert data["results"][1]["error"] is not None


def test_api_key_protection():
    config = TestConfig()
    config.API_KEY = "test-api-key"
    app = create_app(config)
    with app.test_client() as client:
        response = client.post("/api/v1/predict", json={})
        assert response.status_code == 401

        response = client.post("/api/v1/predict", json={}, headers={"X-API-Key": "wrong"})
        assert response.status_code == 403

        response = client.post("/api/v1/predict", json={}, headers={"X-API-Key": "test-api-key"})
        assert response.status_code in (400, 503)
