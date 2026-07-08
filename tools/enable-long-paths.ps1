# Run this script as Administrator to enable Windows Long Paths
# This is required for React Native Android builds on Windows
# because deeply nested node_modules paths exceed the 260-char limit.

Write-Host "Enabling Windows Long Paths support..." -ForegroundColor Cyan

$regPath = "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem"
$regName = "LongPathsEnabled"

try {
    $current = (Get-ItemProperty -Path $regPath -Name $regName -ErrorAction SilentlyContinue).$regName
    if ($current -eq 1) {
        Write-Host "Long Paths already enabled!" -ForegroundColor Green
    } else {
        New-ItemProperty -Path $regPath -Name $regName -Value 1 -PropertyType DWORD -Force | Out-Null
        Write-Host "Long Paths enabled successfully!" -ForegroundColor Green
        Write-Host "Please RESTART your computer for the change to take effect." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure you are running this script as Administrator." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Also configuring Git to support long paths..." -ForegroundColor Cyan
git config --global core.longpaths true
Write-Host "Git long paths configured." -ForegroundColor Green
