<#
.SYNOPSIS
    Starts the whole ViralLink dev stack: Postgres + Redis (Docker), the three Spring services,
    and the Next.js frontend.

.DESCRIPTION
    Idempotent: if something is already listening on a service's port, that service is left alone.
    Each Spring/Next process gets its own PowerShell window (so you can watch its logs live and
    close just that one), and everything is also mirrored to logs\*.log via Start-Transcript.

.USAGE
    powershell -File scripts\dev-up.ps1
    (or just  .\scripts\dev-up.ps1   from a PowerShell prompt already in the repo)

    Stop everything again with scripts\dev-down.ps1
#>

# ---- helpers ---------------------------------------------------------------

function Test-PortInUse([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return [bool]$conn
}

function New-RandomBase64([int]$Bytes) {
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return [Convert]::ToBase64String($buffer)
}

function New-RandomHex([int]$Bytes) {
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return -join ($buffer | ForEach-Object { $_.ToString("x2") })
}

function Wait-ContainerHealthy([string]$Name, [int]$TimeoutSec = 60) {
    Write-Host "  waiting for $Name..." -NoNewline
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $status = docker inspect --format='{{.State.Health.Status}}' $Name 2>$null
        if ($status -eq "healthy") { Write-Host " healthy" -ForegroundColor Green; return $true }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
    Write-Host " timed out (continuing anyway)" -ForegroundColor Yellow
    return $false
}

function Wait-HttpOk([string]$Name, [string]$Url, [int]$TimeoutSec = 120) {
    Write-Host "  waiting for $Name ($Url)..." -NoNewline
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                Write-Host " up" -ForegroundColor Green
                return $true
            }
        } catch [System.Net.WebException] {
            # Windows PowerShell 5.1's Invoke-WebRequest throws on any non-2xx status instead of
            # returning it. A 4xx/5xx still proves something is listening and answering HTTP (e.g. a
            # health endpoint that unexpectedly requires auth) - that counts as "up" here too; only a
            # connection failure (no response at all) means the service genuinely is not ready yet.
            if ($_.Exception.Response) {
                Write-Host " up ($([int]$_.Exception.Response.StatusCode))" -ForegroundColor Green
                return $true
            }
        } catch { }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    Write-Host " timed out - check its log window" -ForegroundColor Yellow
    return $false
}

# Launches a long-running command in its own visible window, titled and transcribed to a log file.
function Start-DevWindow([string]$Title, [string]$WorkingDir, [string]$Command, [string]$LogFile) {
    $inner = "`$host.UI.RawUI.WindowTitle = '$Title'; " +
             "Start-Transcript -Path '$LogFile' -Append | Out-Null; " +
             "Set-Location '$WorkingDir'; " +
             $Command
    Start-Process powershell.exe -ArgumentList @('-NoExit', '-NoProfile', '-Command', $inner) -WorkingDirectory $WorkingDir | Out-Null
}

# ---- paths ------------------------------------------------------------------

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$userDir = Join-Path $root 'user'
$redirectDir = Join-Path $root 'redirect'
$analyticsDir = Join-Path $root 'analytics'
$frontendDir = Join-Path $root 'viral-analytics-hub'

Write-Host "ViralLink dev environment" -ForegroundColor Cyan
Write-Host "repo: $root`n"

# ---- 1. env files -------------------------------------------------------------

$envPath = Join-Path $root '.env'
if (-not (Test-Path $envPath)) {
    Write-Host "No .env found - generating one from .env.example with fresh random secrets." -ForegroundColor Yellow
    $content = Get-Content (Join-Path $root '.env.example') -Raw
    $content = $content -replace '(?m)^JWT_SECRET=$', "JWT_SECRET=$(New-RandomBase64 32)"
    $content = $content -replace '(?m)^HASHIDS_SALT=$', "HASHIDS_SALT=$(New-RandomHex 16)"
    Set-Content -Path $envPath -Value $content -NoNewline -Encoding utf8
    Write-Host "Created .env. Google/GitHub sign-in will not work until you fill in the OAuth values there.`n" -ForegroundColor Yellow
} else {
    Write-Host ".env already exists - leaving it alone.`n"
}

$frontendEnvPath = Join-Path $frontendDir '.env.local'
if (-not (Test-Path $frontendEnvPath)) {
    Copy-Item (Join-Path $frontendDir '.env.example') $frontendEnvPath
    Write-Host "Created viral-analytics-hub\.env.local from its example (local defaults).`n"
}

# ---- 2. Docker: Postgres + Redis --------------------------------------------

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker doesn't seem to be running. Start Docker Desktop and re-run this script." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Postgres + Redis..."
docker compose -f (Join-Path $root 'docker-compose.yml') up -d
Wait-ContainerHealthy 'virallink-postgres' | Out-Null
Wait-ContainerHealthy 'virallink-redis' | Out-Null
Write-Host ""

# ---- 3. Spring services -------------------------------------------------------

$services = @(
    @{ Name = 'user';      Dir = $userDir;      Port = 8080; Health = 'http://localhost:8080/actuator/health' }
    @{ Name = 'redirect';  Dir = $redirectDir;   Port = 8081; Health = 'http://localhost:8081/actuator/health' }
    @{ Name = 'analytics'; Dir = $analyticsDir;  Port = 8082; Health = 'http://localhost:8082/actuator/health' }
)

foreach ($svc in $services) {
    if (Test-PortInUse $svc.Port) {
        Write-Host "$($svc.Name): already running on port $($svc.Port), leaving it alone."
        continue
    }
    Write-Host "Starting $($svc.Name) (new window, log: logs\$($svc.Name).log)..."
    $log = Join-Path $logDir "$($svc.Name).log"
    Start-DevWindow -Title "virallink-$($svc.Name)" -WorkingDir $svc.Dir -Command '.\gradlew.bat bootRun' -LogFile $log
}

Write-Host ""
foreach ($svc in $services) {
    Wait-HttpOk $svc.Name $svc.Health 150 | Out-Null
}
Write-Host ""

# ---- 4. Frontend --------------------------------------------------------------

if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Write-Host "Installing frontend dependencies (first run only)..."
    Push-Location $frontendDir
    pnpm install
    Pop-Location
}

if (Test-PortInUse 3001) {
    Write-Host "frontend: already running on port 3001, leaving it alone."
} else {
    Write-Host "Starting frontend (new window, log: logs\frontend.log)..."
    $log = Join-Path $logDir 'frontend.log'
    Start-DevWindow -Title 'virallink-frontend' -WorkingDir $frontendDir -Command 'pnpm dev -p 3001' -LogFile $log
}
Write-Host ""
$frontendUp = Wait-HttpOk 'frontend' 'http://localhost:3001' 90

# ---- 5. summary -----------------------------------------------------------------

Write-Host ""
Write-Host "================ ViralLink dev environment ================" -ForegroundColor Cyan
Write-Host " Postgres           localhost:5433"
Write-Host " Redis              localhost:6379"
Write-Host " User service       http://localhost:8080   (logs\user.log)"
Write-Host " Redirect service   http://localhost:8081   (logs\redirect.log)"
Write-Host " Analytics service  http://localhost:8082   (logs\analytics.log)"
Write-Host " Frontend           http://localhost:3001   (logs\frontend.log)"
Write-Host "============================================================="
Write-Host "Each service runs in its own window - close a window (or Ctrl+C in it) to stop just that one."
Write-Host "Run scripts\dev-down.ps1 to stop everything at once (Postgres/Redis are left running; pass -Full to stop those too)."

if ($frontendUp) {
    Start-Process 'http://localhost:3001'
}
