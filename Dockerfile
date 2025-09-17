FROM node:18 AS assets

WORKDIR /app

COPY memory-palace-builder/package*.json ./
RUN npm install

COPY memory-palace-builder/ ./

RUN npm run build

FROM php:8.2-apache

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql pdo_pgsql zip exif pcntl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY memory-palace-builder/composer.json memory-palace-builder/composer.lock ./
RUN composer install --no-interaction --optimize-autoloader --no-dev

COPY memory-palace-builder/ .

COPY --from=assets /app/public/build ./public/build

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80