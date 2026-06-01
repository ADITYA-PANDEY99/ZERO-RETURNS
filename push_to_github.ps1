# ZeroReturn — Auto GitHub Push Script
# ===================================
$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   ZeroReturn Auto GitHub Publisher" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Ask for the Github repository URL securely
$repoUrl = Read-Host -Prompt "Please enter your GitHub Repository URL (e.g. https://github.com/username/zeroreturns.git)"

if (-not $repoUrl) {
    Write-Host "Repository URL is required. Exiting..." -ForegroundColor Red
    Exit
}

try {
    # Check if remote already exists, remove if it does
    $existingRemotes = git remote
    if ($existingRemotes -contains "origin") {
        git remote remove origin
    }

    Write-Host "Linking repository to: $repoUrl..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    git branch -M main

    Write-Host "Pushing code to GitHub... (A browser pop-up may appear for secure authentication)" -ForegroundColor Yellow
    git push -u origin main

    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host " 🎉 SUCCESS! Your project is now on GitHub!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
}
catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
}
