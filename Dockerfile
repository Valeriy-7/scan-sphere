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
    gcompat

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

# Запуск приложения
FROM base AS runner
ENV NODE_ENV production

# Копируем необходимые файлы с builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/package.json ./package.json

# Экспортируем порт
EXPOSE 3000

# Создаем скрипт для запуска с предварительной генерацией клиента Prisma
RUN echo '#!/bin/sh\necho "Generating Prisma client..."\nnpx prisma generate\n\nif [ "$RUN_MIGRATIONS" = "true" ]; then\n  echo "Running database migrations..."\n  npx prisma migrate deploy\nfi\n\necho "Starting server..."\nnode server.js' > start.sh && \
    chmod +x start.sh

# Запускаем приложение через скрипт
CMD ["./start.sh"]
