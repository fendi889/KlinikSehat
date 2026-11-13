# Windows PowerShell. Prasyarat: PHP 8.2+, Composer, PostgreSQL (database klinik_sehat sudah dibuat).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
composer create-project laravel/laravel:^12.0 klinik-api --prefer-dist
Set-Location klinik-api
php artisan install:api --without-migration-prompt --no-interaction
Copy-Item ..\overlay\* . -Recurse -Force
Copy-Item ..\overlay\.env.pgsql .env -Force
Remove-Item .env.pgsql
php artisan key:generate
Write-Host ">> Edit klinik-api\.env: isi DB_PASSWORD, lalu jalankan:"
Write-Host "   php artisan migrate --seed ; php artisan serve"
