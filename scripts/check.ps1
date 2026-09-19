<#
Menjalankan semua pengecekan kualitas kode.
  .\scripts\check.ps1                  # backend + frontend
  .\scripts\check.ps1 -Only backend    # atau: frontend
#>
param(
    [ValidateSet('all', 'backend', 'frontend')]
    [string]$Only = 'all'
)

$root = Split-Path -Parent $PSScriptRoot

function Fail {
    param([string]$Message)
    Write-Host "FAILED: $Message" -ForegroundColor Red
    exit 1
}

function Step {
    param([string]$Title, [scriptblock]$Command)
    Write-Host "==> $Title" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) { Fail $Title }
}

if ($Only -eq 'all' -or $Only -eq 'backend') {
    Push-Location (Join-Path $root 'backend')
    try {
        Write-Host '==> gofmt' -ForegroundColor Cyan
        $unformatted = gofmt -l .
        if ($unformatted) {
            Write-Host ($unformatted -join "`n")
            Fail 'gofmt found unformatted files (fix with: gofmt -w .)'
        }
        Step 'go vet'  { go vet ./... }
        Step 'go test' { go test ./... }
    }
    finally { Pop-Location }
}

if ($Only -eq 'all' -or $Only -eq 'frontend') {
    Push-Location (Join-Path $root 'frontend')
    try {
        Step 'tsc'   { npx tsc --noEmit }
        Step 'lint'  { npm run lint }
        Step 'test'  { npm test }
        Step 'build' { npm run build }
    }
    finally { Pop-Location }
}

Write-Host 'All checks passed.' -ForegroundColor Green
