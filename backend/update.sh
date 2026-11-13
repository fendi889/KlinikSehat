#!/usr/bin/env bash
# Menerapkan pembaruan kode (overlay) ke proyek Laravel yang sudah ada, lalu migrasi.
set -e
cd "$(dirname "$0")"
[ -d klinik-api ] || { echo "Folder klinik-api belum ada. Jalankan setup.sh dulu."; exit 1; }
cp -r overlay/. klinik-api/ && rm -f klinik-api/.env.pgsql
cd klinik-api
php artisan migrate
php artisan db:seed --class=RoomSeeder
php artisan config:clear && php artisan route:clear && php artisan cache:clear
echo "Selesai. Jalankan: php artisan serve"
