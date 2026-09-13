# Setup script for Windows PowerShell
Write-Host "=== BPY-CSE-2666 Clinical Decision Support System Setup ===" -ForegroundColor Cyan

# 1. Environment file
if (-not (Test-Path "backend\.env")) {
    Write-Host "Copying .env.example to backend\.env..." -ForegroundColor Yellow
    Copy-Item ".env.example" "backend\.env"
}

# 2. Virtual environment
if (-not (Test-Path "backend\venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv backend\venv
}

# 3. Dependencies
Write-Host "Installing backend development dependencies..." -ForegroundColor Yellow
& "backend\venv\Scripts\pip.exe" install -r backend\requirements\development.txt

# 4. Migrations
Write-Host "Applying database migrations..." -ForegroundColor Yellow
& "backend\venv\Scripts\python.exe" backend\manage.py migrate

# 5. Seed Users
Write-Host "Seeding initial clinical demo users..." -ForegroundColor Yellow
& "backend\venv\Scripts\python.exe" backend\manage.py seed_clinical_users

# 6. Frontend
if (Test-Path "frontend\package.json") {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "=== Setup Complete! Run scripts\run_dev.ps1 to start services ===" -ForegroundColor Green
