param(
  [string]$BackendPath = ".backend-analysis",
  [int]$BackendPort = 8080,
  [int]$FrontendPort = 4200
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Resolve-BackendPath {
  param([string]$RequestedPath)

  $candidates = @(
    (Join-Path $Root $RequestedPath),
    (Join-Path $Root "arquitetura-api"),
    (Join-Path $Root "..\arquitetura-api"),
    (Join-Path $Root "..\..\arquitetura-api")
  )

  foreach ($candidate in $candidates) {
    $resolved = Resolve-Path -Path $candidate -ErrorAction SilentlyContinue
    if ($resolved -and (Test-Path (Join-Path $resolved.Path "mvnw.cmd"))) {
      return $resolved.Path
    }
  }

  throw "Backend not found. Clone arquitetura-api or pass -BackendPath with the backend folder."
}

function Stop-Port {
  param([int]$Port)

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  $processIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -and $_ -ne 0 })

  foreach ($processId in $processIds) {
    try {
      $process = Get-Process -Id $processId -ErrorAction Stop
      Write-Host "Stopping $($process.ProcessName) ($processId) on port $Port..."
      Stop-Process -Id $processId -Force -ErrorAction Stop
    } catch {
      Write-Warning "Could not stop process ${processId} on port ${Port}: $($_.Exception.Message)"
    }
  }
}

function Resolve-MavenCommand {
  param([string]$BackendDir)

  $globalMaven = Get-Command "mvn.cmd" -ErrorAction SilentlyContinue
  if ($globalMaven) {
    return $globalMaven.Source
  }

  return (Join-Path $BackendDir "mvnw.cmd")
}

$backendDir = Resolve-BackendPath -RequestedPath $BackendPath

Stop-Port -Port $BackendPort
Stop-Port -Port $FrontendPort

$backendOut = Join-Path $Root "backend.out.log"
$backendErr = Join-Path $Root "backend.err.log"
$frontendOut = Join-Path $Root "ng-serve.out.log"
$frontendErr = Join-Path $Root "ng-serve.err.log"
$mavenCommand = Resolve-MavenCommand -BackendDir $backendDir

Write-Host "Starting backend on port $BackendPort..."
Start-Process -FilePath $mavenCommand `
  -ArgumentList @("spring-boot:run", "-Dspring-boot.run.arguments=--server.port=$BackendPort") `
  -WorkingDirectory $backendDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput $backendOut `
  -RedirectStandardError $backendErr

Write-Host "Starting frontend on port $FrontendPort..."
Start-Process -FilePath "npm.cmd" `
  -ArgumentList @("run", "start", "--", "--host", "127.0.0.1", "--port", "$FrontendPort") `
  -WorkingDirectory $Root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $frontendOut `
  -RedirectStandardError $frontendErr

Write-Host ""
Write-Host "Frontend: http://127.0.0.1:$FrontendPort/#/dashboard"
Write-Host "Backend:  http://localhost:$BackendPort/folders"
Write-Host ""
Write-Host "Logs:"
Write-Host "  Backend:  $backendOut"
Write-Host "  Frontend: $frontendOut"
