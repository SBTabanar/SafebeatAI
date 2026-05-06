# Backend Dockerfile
# Single-stage build for reliability with minimal bloat

FROM python:3.11-slim

WORKDIR /app

# Install build + runtime dependencies, then remove build tools to keep image small
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove gcc \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r safebeat && useradd -r -g safebeat safebeat

# Copy only necessary application files
COPY --chown=safebeat:safebeat \
    app.py \
    ensemble_models.pkl \
    feature_names.pkl \
    train_ensemble.py \
    combined-heart-data.csv \
    heart-disease.csv \
    new-heart-data.csv \
    ./

USER safebeat

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')" || exit 1

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--threads", "4", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
