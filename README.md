
![SafeBeat AI](https://img.shields.io/badge/SafeBeat%20AI-Clinical%20Diagnostics-2563eb?style=for-the-badge&logo=heart-pulse&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Node 20+](https://img.shields.io/badge/node-20+-339933.svg?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?style=flat-square&logo=docker&logoColor=white)](docker-compose.yml)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF.svg?style=flat-square&logo=github-actions&logoColor=white)](.github/workflows/ci.yml)

</div>

<h1 align="center">SafeBeat AI - Clinical Diagnostic Portal</h1>

<img width="2557" height="1282" alt="Safebeat Screenshot" src="https://github.com/user-attachments/assets/384e6921-5d9f-414e-90ce-e6e33cc5e2a1" />

<p align="center">
  <strong>A production-ready, open-source cardiovascular decision support system.</strong><br>
  Built with an ensemble ML pipeline, explainable AI, and a modern React frontend.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

---

## Overview

**SafeBeat AI** is a professional-grade cardiovascular risk assessment platform. It utilizes a multi-model machine learning ensemble to provide high-accuracy risk assessments based on clinical patient biomarkers.

Developed by **SBTabanar**, this platform is designed for clinical transparency, architectural resilience, and ethical AI explainability.

### Key Features

- **Ensemble Consensus Engine:** Majority-vote logic between **Random Forest**, **Logistic Regression**, and **XGBoost** models.
- **Model Transparency:** Individual confidence levels and benchmark accuracies displayed in real-time.
- **Explainable AI (XAI):** Mathematical attribution of biomarkers showing the specific percentage weight each factor had on the final result.
- **Interactive Clinical Walkthrough:** Step-by-step guided tour of the diagnostic stations.
- **Patient Profile Management:** Session-based history tracking with local storage persistence.
- **Executive Clinical Dossier:** Automated PDF report generation (jsPDF) with structured clinical sections.
- **Real-Time 'What-If' Analysis:** Live-update toggle allowing clinicians to adjust biomarkers and see the risk map update instantly.
- **Production-Ready:** Dockerized, rate-limited, structured logging, CI/CD, and health checks.
- 


<img width="2547" height="1266" alt="Safebeat Comparison" src="https://github.com/user-attachments/assets/cbdc54e5-7fc0-4232-ad15-fdf706c14be4" />

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Recharts, jsPDF, Lucide Icons, Axios |
| **Backend** | Python 3.11, Flask, Flask-CORS, Flask-Limiter, Gunicorn |
| **ML / Data** | Scikit-Learn, XGBoost, Pandas, NumPy, Joblib |
| **DevOps** | Docker, Docker Compose, GitHub Actions, Nginx |

---

## Quick Start

The fastest way to get started is with **Docker Compose**.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/SBTabanar/SafebeatAI.git
cd SafebeatAI

# Start the stack
docker-compose up --build

# Access the application
open http://localhost:5173
```

The backend API will be available at `http://localhost:5001` and the frontend at `http://localhost:5173`.

### Stop the Stack

```bash
docker-compose down
```

---

## Local Development

If you prefer to run the services directly on your machine:

### Prerequisites

- Python 3.11+
- Node.js 20+

### 1. Backend

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
python app.py
```

The API will be available at `http://localhost:5001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

### Environment Variables

Copy `.env.example` to `.env` and customize as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Backend port |
| `HOST` | `0.0.0.0` | Backend host |
| `FLASK_DEBUG` | `false` | Enable Flask debug mode |
| `LOG_LEVEL` | `INFO` | Logging level |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `RATE_LIMIT` | `100 per minute` | API rate limit |
| `MODEL_PATH` | `ensemble_models.pkl` | Path to the ensemble model |
| `VITE_API_URL` | `http://localhost:5001` | Frontend API target |

---

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React Client  │──────▶│   Nginx (Proxy)  │──────▶│  Flask Backend  │
│   (Vite Build)  │      │   (Frontend)     │      │  (Gunicorn)     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │                           │
                                │                           ▼
                                │                  ┌─────────────────┐
                                │                  │ Ensemble Model  │
                                │                  │ - RandomForest  │
                                │                  │ - LogisticReg   │
                                │                  │ - XGBoost       │
                                │                  └─────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Backend API     │
                         │  /health         │
                         │  /predict        │
                         └──────────────────┘
```

### Request Flow

1. The user interacts with the React frontend served by Nginx.
2. API requests are proxied to the Flask backend.
3. The backend validates input, runs the ensemble prediction, and returns structured results.
4. The frontend renders the consensus, confidence meter, model breakdown, and risk drivers.

---

## API Documentation

### Base URL

- Local: `http://localhost:5001`
- Docker: `http://localhost:5001` (or `/api` via Nginx proxy)

### Endpoints

#### `GET /`

Service metadata.

**Response:**
```json
{
  "service": "SafeBeat AI API",
  "version": "2.8.0",
  "status": "operational",
  "docs": "/docs"
}
```

#### `GET /health`

Health and readiness check.

**Response:**
```json
{
  "status": "healthy",
  "ensemble_ready": true,
  "timestamp": "2025-01-01T00:00:00Z"
}
```

#### `POST /predict`

Run ensemble prediction.

**Rate Limit:** 20 requests per minute.

**Request Body:**
```json
{
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
  "thal": 2
}
```

**Response:**
```json
{
  "prediction": 0,
  "consensus": "0/3 Models Calculated Risk",
  "result": "Healthy Cardiovascular Profile",
  "confidence": "85.42%",
  "models_detail": { ... },
  "top_factors": [ ... ],
  "disclaimer": "Consensus-based AI assessment. Not a medical diagnosis."
}
```

#### `GET /docs`

Auto-generated API documentation.

---

## Dataset & Model Performance

The system is powered by a consolidated and cleaned dataset of **573 Clinical Records**, merging data from the UCI Heart Disease dataset and a secondary clinical source.

**Key Technical Achievement:**
Identified and resolved a critical label-swap and feature alignment issue in the combined dataset, resulting in a significant accuracy boost from ~86% to **~94%** for the master model.

| Metric | Value |
|--------|-------|
| **Master Model Accuracy** | 94.78% |
| **Logistic Regression** | 89.6% |
| **Random Forest** | 88.7% |
| **XGBoost** | 88.7% |

**Top Predictors:** Major Vessels (CA), Thalassemia (THAL), ST Depression (Oldpeak).


<img width="804" height="1117" alt="Safebeat Report Screenshot" src="https://github.com/user-attachments/assets/2783ec7c-6184-4b19-a180-ed4c011edd17" />

---

## Deployment

### Docker (Recommended)

```bash
docker-compose up -d --build
```

### Railway / Render / Heroku

The backend includes a `Procfile` for Heroku-style deployments:

```
web: gunicorn --bind 0.0.0.0:5001 app:app
```

For container-based platforms, use the provided `Dockerfile`.

### Security Checklist for Production

- [ ] Set `CORS_ORIGINS` to your actual domain(s), not `*`.
- [ ] Run behind HTTPS with a valid SSL certificate.
- [ ] Use a reverse proxy (Nginx, Traefik, Caddy).
- [ ] Keep dependencies updated (`pip install --upgrade`, `npm update`).
- [ ] Monitor logs and enable alerting.
- [ ] Review [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Project Structure

```
SafebeatAI/
├── .github/
│   ├── workflows/ci.yml          # GitHub Actions CI
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   └── pull_request_template.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main React application
│   │   ├── App.css               # Custom styling
│   │   └── ...
│   ├── Dockerfile                # Frontend Docker image
│   ├── nginx.conf                # Nginx SPA config
│   ├── package.json
│   └── vite.config.js
├── app.py                        # Flask backend application
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Backend Docker image
├── docker-compose.yml            # Full-stack orchestration
├── Makefile                      # Common development commands
├── .env.example                  # Environment variable template
├── ensemble_models.pkl           # Serialized ML ensemble
├── combined-heart-data.csv       # Training dataset
├── LICENSE                       # MIT License
├── CONTRIBUTING.md               # Contribution guidelines
├── CODE_OF_CONDUCT.md            # Community standards
├── SECURITY.md                   # Security policy
└── README.md                     # You are here!
```

---

## Contributing

We love your input! We want to make contributing to SafeBeat AI as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a Pull Request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Disclaimer

This application is a software prototype developed for educational and research purposes. It is **not** a certified medical device and should **not** be used for actual clinical diagnosis. Always consult a board-certified physician for medical advice.

---

<p align="center">
  Built with ❤️ by <strong>SBTabanar</strong>
</p>
