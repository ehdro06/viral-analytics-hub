<#
.SYNOPSIS
    Stops the ViralLink dev services started by dev-up.ps1.

.DESCRIPTION
    Kills whatever is listening on the app ports (8080/8081/8082/3001), which closes their windows.
    Postgres and Redis are left running by default (their data lives in Docker volumes, so leaving
    them up just makes the next dev-up.ps1 faster). Pass -Full to stop those too.

.USAGE
    powershell -File scripts\dev-down.ps1 [-Full]
#>

param(
    [switch]$Full
)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$ports = @(
    @{ Port = 8080; Name = 'user' }
    @{ Port = 8081; Name = 'redirect' }
    @{ Port = 8082; Name = 'analytics' }
    @{ Port = 3001; Name = 'frontend' }
)

foreach ($entry in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $entry.Port -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) {
        Write-Host "$($entry.Name): nothing listening on port $($entry.Port)"
        continue
    }
    $procIds = $conns.OwningProcess | Select-Object -Unique
    foreach ($procId in $procIds) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "$($entry.Name): stopping PID $procId ($($proc.ProcessName)) on port $($entry.Port)"
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}

if ($Full) {
    Write-Host "`nStopping Postgres + Redis (data is preserved in their Docker volumes)..."
    docker compose -f (Join-Path $root 'docker-compose.yml') stop
} else {
    Write-Host "`nPostgres + Redis left running. Pass -Full to stop those too."
}
