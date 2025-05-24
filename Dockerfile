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

# Убираем строгую проверку наличия файлов, создаем пустые файлы если нужно
RUN mkdir -p ./public/images && \
    touch ./public/images/logo.png && \
    touch ./public/images/no-image.svg && \
    echo "Статические файлы готовы (созданы пустые файлы если оригиналы отсутствовали)"

# Запуск приложения
FROM base AS runner
ENV NODE_ENV production

# Создаем директории для статических файлов
RUN mkdir -p /app/public/images/cache

# Копируем необходимые файлы с builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public/images /app/public/images

# Создаем пустые файлы изображений, если они не существуют
RUN if [ ! -f /app/public/images/logo.png ]; then \
      echo "Создаем пустой файл logo.png"; \
      touch /app/public/images/logo.png; \
    fi && \
    if [ ! -f /app/public/images/no-image.svg ]; then \
      echo "Создаем пустой файл no-image.svg"; \
      echo '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ddd"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#555" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>' > /app/public/images/no-image.svg; \
    fi

# Настраиваем права доступа к директории кэша
RUN chmod -R 777 /app/public/images/cache

# Экспортируем порт
EXPOSE 3000

# Создаем скрипт для запуска с предварительной генерацией клиента Prisma
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "Checking environment..."' >> /app/entrypoint.sh && \
    echo 'echo "Создаем необходимые директории и файлы..."' >> /app/entrypoint.sh && \
    echo 'mkdir -p /app/public/images/cache' >> /app/entrypoint.sh && \
    echo 'if [ ! -f /app/public/images/logo.png ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Создаем пустой файл logo.png"' >> /app/entrypoint.sh && \
    echo '  touch /app/public/images/logo.png' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'if [ ! -f /app/public/images/no-image.svg ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Создаем файл no-image.svg"' >> /app/entrypoint.sh && \
    echo '  echo "<svg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"100\" height=\"100\" fill=\"#ddd\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"14\" fill=\"#555\" text-anchor=\"middle\" dominant-baseline=\"middle\">No Image</text></svg>" > /app/public/images/no-image.svg' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'chmod -R 777 /app/public/images/cache' >> /app/entrypoint.sh && \
    echo 'echo "Все статические файлы готовы"' >> /app/entrypoint.sh && \
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
