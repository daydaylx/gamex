# Makefile for Intimacy Tool Development

.PHONY: help install test lint format clean run

# Default target
help:
	@echo "Available targets:"
	@echo "  install      - Install all dependencies"
	@echo "  test         - Run all tests"
	@echo "  test-cov     - Run tests with coverage"
	@echo "  lint         - Run all linters"
	@echo "  format       - Format code (black, isort)"
	@echo "  security     - Run security scans"
	@echo "  clean        - Clean build artifacts"
	@echo "  run          - Run development server"
	@echo "  run-mobile   - Run mobile app in dev mode"

# Installation
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt -r requirements-dev.txt

# Testing
test:
	@echo "Running backend tests..."
	cd backend && pytest

test-cov:
	@echo "Running tests with coverage..."
	cd backend && pytest --cov=app --cov-report=html --cov-report=term-missing

test-watch:
	@echo "Running tests in watch mode..."
	cd backend && pytest-watch

# Linting
lint:
	@echo "Running flake8..."
	cd backend && flake8 app/ tests/
	@echo "Running mypy..."
	cd backend && mypy app/

lint-fix:
	@echo "Auto-fixing linting issues..."
	cd backend && isort app/ tests/
	cd backend && black app/ tests/

# Formatting
format:
	@echo "Formatting code..."
	cd backend && black app/ tests/
	cd backend && isort app/ tests/

# Security
security:
	@echo "Running bandit security scan..."
	cd backend && bandit -r app/ -ll -i
	@echo "Checking dependencies for vulnerabilities..."
	cd backend && safety check

# Cleaning
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete
	find . -type f -name "coverage.xml" -delete
	@echo "Clean complete!"

# Running
run:
	@echo "Starting development server..."
	cd backend && python -m app

run-mobile:
	@echo "Building and running mobile app..."
	cd apps/mobile && npx cap sync android && npx cap run android

# CI Simulation (local)
ci:
	@echo "Running CI checks locally..."
	@make lint
	@make test-cov
	@make security
	@echo "All CI checks passed!"

# Pre-commit checks
pre-commit:
	@echo "Running pre-commit checks..."
	@make format
	@make lint
	@make test
	@echo "Pre-commit checks complete!"
