#!/usr/bin/env bash
set -e

echo "=== BPY-CSE-2666 Clinical Decision Support System Setup ==="

# 1. Environment file
if [ ! -f "backend/.env" ]; then
    echo "Copying .env.example to backend/.env..."
    cp .env.example backend/.env
fi

# 2. Python environment
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# 3. Dependencies
echo "Installing backend development dependencies..."
backend/venv/bin/pip install -r backend/requirements/development.txt

# 4. Migrations
echo "Applying database migrations..."
backend/venv/bin/python backend/manage.py migrate

# 5. Seed Users
echo "Seeding initial clinical demo users..."
backend/venv/bin/python backend/manage.py seed_clinical_users

# 6. Frontend
if [ -f "frontend/package.json" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "=== Setup Complete! Run ./scripts/run_dev.sh to start services ==="
