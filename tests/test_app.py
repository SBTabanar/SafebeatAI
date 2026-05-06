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


def test_health(client):
    response = client.get("/health")
    assert response.status_code in (200, 503)
    data = json.loads(response.data)
    assert "status" in data
    assert "ensemble_ready" in data


def test_docs(client):
    response = client.get("/docs")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "endpoints" in data


def test_predict_missing_fields(client):
    response = client.post("/predict", json={})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data


def test_predict_out_of_range(client):
    payload = {
        "age": 150,  # Out of range
        "sex": 1,
        "cp": 0,
        "trestbps": 120,
        "chol": 200,
        "fbs": 0,
        "restecg": 0,
        "thalach": 150,
        "exang": 0,
        "oldpeak": 0.0,
        "slope": 1,
        "ca": 0,
        "thal": 2,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data


def test_predict_valid_payload(client):
    payload = {
        "age": 50,
        "sex": 1,
        "cp": 0,
        "trestbps": 120,
        "chol": 200,
        "fbs": 0,
        "restecg": 0,
        "thalach": 150,
        "exang": 0,
        "oldpeak": 0.0,
        "slope": 1,
        "ca": 0,
        "thal": 2,
    }
    response = client.post("/predict", json=payload)
    # May return 200 or 503 depending on whether ensemble_models.pkl exists
    assert response.status_code in (200, 503)
    if response.status_code == 200:
        data = json.loads(response.data)
        assert "prediction" in data
        assert "confidence" in data
        assert "top_factors" in data
