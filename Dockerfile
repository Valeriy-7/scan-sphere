FROM node:20-alpine AS base

# Устанавливаем зависимости необходимые для Puppeteer и Prisma
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    openssl \
    gcompat \
    wget

# Устанавливаем переменные окружения для Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Устанавливаем рабочую директорию
WORKDIR /app

# Установка зависимостей
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Сборка приложения
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Предварительная проверка наличия статических файлов
RUN if [ ! -f ./public/images/logo.png ]; then echo "ОШИБКА: Файл logo.png отсутствует"; exit 1; fi && \
    if [ ! -f ./public/images/no-image.svg ]; then echo "ОШИБКА: Файл no-image.svg отсутствует"; exit 1; fi && \
    echo "Все статические файлы найдены!"

# Запуск приложения
FROM base AS runner
ENV NODE_ENV production

# Создаем директории для статических файлов
RUN mkdir -p /app/public/images/cache

# Копируем необходимые файлы с builder
COPY --from=builder /app/public/images/logo.png /app/public/images/logo.png
COPY --from=builder /app/public/images/no-image.svg /app/public/images/no-image.svg
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public/images /app/public/images

# Настраиваем права доступа к директории кэша
RUN chmod -R 777 /app/public/images/cache

# Экспортируем порт
EXPOSE 3000

# Создаем скрипт для запуска с предварительной генерацией клиента Prisma
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "Checking environment..."' >> /app/entrypoint.sh && \
    echo 'echo "Проверка наличия статических файлов..."' >> /app/entrypoint.sh && \
    echo 'if [ ! -f /app/public/images/logo.png ]; then echo "ОШИБКА: Файл logo.png отсутствует"; exit 1; fi' >> /app/entrypoint.sh && \
    echo 'if [ ! -f /app/public/images/no-image.svg ]; then echo "ОШИБКА: Файл no-image.svg отсутствует"; exit 1; fi' >> /app/entrypoint.sh && \
    echo 'echo "Все статические файлы найдены!"' >> /app/entrypoint.sh && \
    echo 'echo "Generating Prisma client..."' >> /app/entrypoint.sh && \
    echo 'npx prisma generate' >> /app/entrypoint.sh && \
    echo 'if [ "$RUN_MIGRATIONS" = "true" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Running database migrations..."' >> /app/entrypoint.sh && \
    echo '  npx prisma migrate deploy' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'echo "Starting server..."' >> /app/entrypoint.sh && \
    echo 'exec node server.js' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Запускаем приложение через скрипт
CMD ["/app/entrypoint.sh"]
