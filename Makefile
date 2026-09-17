.PHONY: help dev-backend dev-frontend test lint format migrate seed docker-up docker-down clean specs-validate converge

help:
	@echo "Available commands:"
	@echo "  make dev-backend    - Start Django development server"
	@echo "  make dev-frontend   - Start Next.js development server"
	@echo "  make migrate        - Apply database migrations"
	@echo "  make seed           - Seed clinical demo users and roles"
	@echo "  make test           - Run backend pytest suite"
	@echo "  make lint           - Run linters on backend and frontend"
	@echo "  make format         - Format code with black and isort"
	@echo "  make specs-validate - Validate Spec Kit specifications & constitution"
	@echo "  make converge       - Run automated SDD convergence quality gate"
	@echo "  make docker-up      - Start all services with Docker Compose"
	@echo "  make docker-down    - Stop Docker Compose services"
	@echo "  make clean          - Clean bytecode, cache, and build files"

dev-backend:
	cd backend && python manage.py runserver 0.0.0.0:8000

dev-frontend:
	cd frontend && npm run dev

migrate:
	cd backend && python manage.py migrate

seed:
	cd backend && python manage.py seed_clinical_users

test:
	cd backend && pytest -v

lint:
	cd backend && flake8 . && black --check . && isort --check-only .
	cd frontend && npm run lint && npm run type-check

format:
	cd backend && isort . && black .

specs-validate:
	python scripts/validate_specs.py

converge:
	python scripts/converge.py

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
