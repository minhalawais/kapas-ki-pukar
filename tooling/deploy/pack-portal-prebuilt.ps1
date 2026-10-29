param(
  [string]$OutTar = "$env:TEMP\kapas-portal-prebuilt.tgz"
)
$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Portal = Join-Path $Root "apps\puwf-portal"
$Standalone = Join-Path $Portal ".next\standalone"
$Static = Join-Path $Portal ".next\static"
$Public = Join-Path $Portal "public"
$Dockerfile = Join-Path $Portal "Dockerfile.prebuilt"
if (-not (Test-Path (Join-Path $Standalone "apps\puwf-portal\server.js"))) {
  throw "Missing standalone build. Run: pnpm --filter @kapas/puwf-portal build"
}
$Stage = Join-Path $env:TEMP "kapas-portal-prebuilt-stage"
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage | Out-Null
Copy-Item $Dockerfile (Join-Path $Stage "Dockerfile")
Copy-Item $Standalone (Join-Path $Stage "standalone") -Recurse
Copy-Item $Static (Join-Path $Stage "static") -Recurse
Copy-Item $Public (Join-Path $Stage "public") -Recurse
if (Test-Path $OutTar) { Remove-Item $OutTar -Force }
python -c @"
import tarfile, os
stage = r'$Stage'
out = r'$OutTar'
with tarfile.open(out, 'w:gz') as tar:
    for name in ('Dockerfile', 'standalone', 'static', 'public'):
        tar.add(os.path.join(stage, name), arcname=name)
print(out)
"@
Write-Host "Created $OutTar"
