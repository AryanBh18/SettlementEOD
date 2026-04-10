# EOD Settlement System - Start Script
# Run from the project root: .\start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EOD Settlement System - Starting Up" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Backend ---
$backendPath = Join-Path $root "backend"

# Copy .env if missing
if (-not (Test-Path "$backendPath\.env")) {
    if (Test-Path "$backendPath\.env.example") {
        Copy-Item "$backendPath\.env.example" "$backendPath\.env"
        Write-Host "[SETUP] Created backend\.env from .env.example" -ForegroundColor Yellow
        Write-Host "        Edit backend\.env to set your DATABASE_URL before continuing." -ForegroundColor Yellow
    }
}

# Create generated_files directory if missing
$genDir = Join-Path $backendPath "generated_files"
if (-not (Test-Path $genDir)) {
    New-Item -ItemType Directory -Path $genDir | Out-Null
    Write-Host "[SETUP] Created backend\generated_files\" -ForegroundColor Green
}

Write-Host "[1/2] Starting Backend  --> http://localhost:8000" -ForegroundColor Green
Write-Host "      API Docs          --> http://localhost:8000/docs" -ForegroundColor DarkGray
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$backendPath'; `$host.UI.RawUI.WindowTitle = 'EOD Backend'; uvicorn app.main:app --reload"

Start-Sleep -Seconds 2

# --- Frontend ---
$frontendPath = Join-Path $root "frontend"

Write-Host "[2/2] Starting Frontend --> http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$frontendPath'; `$host.UI.RawUI.WindowTitle = 'EOD Frontend'; npm run dev"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Both services are starting in new windows" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend  : http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs : http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend : http://localhost:5173" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
