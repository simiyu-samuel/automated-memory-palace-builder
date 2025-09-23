#!/bin/sh

set -e

php artisan migrate
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"