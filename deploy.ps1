# deploy.ps1
# Automates the build and deployment of Docker images to DockerHub

$DockerUsername = "cutezerg"
$BackendImage = "$DockerUsername/tutoronline-backend"
$FrontendImage = "$DockerUsername/tutoronline-frontend"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting TutorOnline Docker Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Build Backend
Write-Host "`n[1/4] Building Backend Image..." -ForegroundColor Yellow
docker build -t "$BackendImage:latest" ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed." -ForegroundColor Red
    exit 1
}

# 2. Build Frontend
$ProdApiUrl = "http://135.106.130.91/api"
$ProdLiveKitUrl = "wss://tutoronline-rb4lztss.livekit.cloud"

Write-Host "`n[2/4] Building Frontend Image for Production..." -ForegroundColor Yellow
docker build --build-arg NEXT_PUBLIC_API_URL=$ProdApiUrl --build-arg NEXT_PUBLIC_LIVEKIT_URL=$ProdLiveKitUrl -t "$FrontendImage:latest" ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed." -ForegroundColor Red
    exit 1
}

# 3. Push Backend
Write-Host "`n[3/4] Pushing Backend Image to DockerHub..." -ForegroundColor Yellow
docker push "$BackendImage:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend push failed. Make sure you are logged in via 'docker login'." -ForegroundColor Red
    exit 1
}

# 4. Push Frontend
Write-Host "`n[4/4] Pushing Frontend Image to DockerHub..." -ForegroundColor Yellow
docker push "$FrontendImage:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend push failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " Deployment to DockerHub Successful!     " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "`nOn your remote server, run:"
Write-Host "docker-compose pull" -ForegroundColor Cyan
Write-Host "docker-compose up -d" -ForegroundColor Cyan
