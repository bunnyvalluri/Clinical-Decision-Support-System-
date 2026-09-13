# Run development servers on Windows
Write-Host "Starting Django Backend on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

Write-Host "Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services started! Frontend: http://localhost:3000 | Backend API: http://localhost:8000/api/v1/" -ForegroundColor Green
