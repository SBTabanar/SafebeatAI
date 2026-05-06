# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.8.0] - 2025-05-06

### Added
- Production-ready containerization with Docker and Docker Compose.
- Backend input validation with clear error messages and range checking.
- API rate limiting (20 requests per minute on `/predict`).
- Structured JSON logging for better observability.
- `/docs` endpoint for auto-generated API documentation.
- `/health` endpoint now returns 503 when the model is unavailable.
- Environment-based configuration via `.env` files.
- CI/CD pipeline with GitHub Actions for Python, Node, and Docker builds.
- Open-source governance files: `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- GitHub issue and pull request templates.
- `Makefile` for common development tasks.
- `CHANGELOG.md` to track project evolution.

### Changed
- Refactored Flask app into a factory pattern for better testability.
- Updated `requirements.txt` with pinned minimum versions.
- Improved frontend `vite.config.js` with dev proxy and SPA routing support.
- Updated `README.md` with badges, architecture diagrams, and deployment guides.
- Enhanced `docker-compose.yml` with health checks and restart policies.

### Removed
- Hardcoded Railway host from frontend preview config.
- Legacy `http errors.log` file from repository.

## [2.0.0] - 2025-01-15

### Added
- Multi-model ensemble (Random Forest, Logistic Regression, XGBoost).
- Explainable AI feature importance breakdown.
- PDF report generation with jsPDF.
- Interactive tutorial system.
- Dark mode support.
- Patient history with local storage persistence.

### Fixed
- Critical label-swap and feature alignment issue in combined dataset.
- Accuracy improved from ~86% to ~94.78%.

## [1.0.0] - 2024-11-01

### Added
- Initial release of SafeBeat AI.
- Single-model Random Forest prediction endpoint.
- React frontend with basic form inputs and result display.
