# Windows Android builds need Ninja 1.12+ for long CMake paths.
$ErrorActionPreference = 'Stop'
$toolsDir = $PSScriptRoot
$zip = Join-Path $toolsDir 'ninja-win.zip'
Invoke-WebRequest -Uri 'https://github.com/ninja-build/ninja/releases/download/v1.12.1/ninja-win.zip' -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $toolsDir -Force
Remove-Item $zip
& (Join-Path $toolsDir 'ninja.exe') --version
