.PHONY: help install backend frontend build dev docker-build docker-up docker-down test clean

help:
	@echo "SafeBeat AI - Available Commands"
	@echo "--------------------------------"
	@echo "make install      - Install Python and Node dependencies"
	@echo "make backend      - Run the Flask backend locally"
	@echo "make frontend     - Run the React frontend locally"
	@echo "make dev          - Run backend and frontend (requires tmux or separate terminals)"
	@echo "make docker-build - Build Docker images"
	@echo "make docker-up    - Start services with Docker Compose"
	@echo "make docker-down  - Stop Docker Compose services"
	@echo "make test         - Run tests (placeholder)"
	@echo "make clean        - Remove build artifacts and node_modules"

install:
	pip install -r requirements.txt
	cd frontend && npm install

backend:
	python app.py

frontend:
	cd frontend && npm run dev

dev:
	@echo "Start backend in one terminal: make backend"
	@echo "Start frontend in another: make frontend"

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

test:
	@echo "Add pytest or jest tests here."

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "node_modules" -exec rm -rf {} +
	rm -rf frontend/dist
