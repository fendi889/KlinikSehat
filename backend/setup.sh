#!/usr/bin/env bash
# Membuat proyek Laravel 12 lalu menimpa dengan kode KlinikSehat (overlay).
# Prasyarat: PHP 8.2+, Composer, PostgreSQL (database klinik_sehat sudah dibuat di pgAdmin 4).
set -e
cd "$(dirname "$0")"
composer create-project laravel/laravel:^12.0 klinik-api --prefer-dist
cd klinik-api
php artisan install:api --without-migration-prompt --no-interaction   # memasang Laravel Sanctum
cp -r ../overlay/. .
cp .env.pgsql .env && rm .env.pgsql
php artisan key:generate
echo ">> Edit klinik-api/.env: isi DB_PASSWORD, lalu jalankan:"
echo "   php artisan migrate --seed && php artisan serve"
