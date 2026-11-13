# Menerapkan pembaruan kode (overlay) ke proyek Laravel yang sudah ada, lalu migrasi. Windows PowerShell.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path .\klinik-api)) { Write-Host "Folder klinik-api belum ada. Jalankan setup.ps1 dulu."; exit 1 }
Copy-Item .\overlay\* .\klinik-api\ -Recurse -Force
Remove-Item .\klinik-api\.env.pgsql -ErrorAction SilentlyContinue   # .env Anda tidak ditimpa
Set-Location .\klinik-api
php artisan migrate
php artisan db:seed --class=RoomSeeder
php artisan config:clear; php artisan route:clear; php artisan cache:clear
Write-Host "Selesai. Jalankan: php artisan serve"
