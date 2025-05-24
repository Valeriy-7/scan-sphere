# OpenParsersFERAV

## Описание

Приложение для отслеживания позиций товаров в поисковой выдаче.

## Установка и запуск через Docker

### Предварительные требования

- Docker
- Docker Compose
- База данных PostgreSQL (внешний сервер)

### Подготовка к запуску

1. Создайте файл `.env` в корне проекта со следующим содержимым:

```
# URL для подключения к вашей PostgreSQL базе данных
DATABASE_URL="postgresql://username:password@host:5432/dbname"
```

Замените `username`, `password`, `host` и `dbname` на ваши реальные данные для подключения к БД.

2. Подготовьте директории для хранения изображений:

```bash
mkdir -p public/images/cache
```

### Сборка и запуск

1. Отредактируйте файл `stack.env` с необходимыми настройками:

```
# Укажите версию тега образа
TAG=v1.0.0
# Порт приложения на хосте (на сервере доступен на 3004)
APP_PORT=3000
# Окружение (production, staging, development)
NODE_ENV=production
# URL базы данных, например PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/dbname
# Выполнять ли миграции при запуске (true/false)
RUN_MIGRATIONS=false
```

2. Соберите Docker-образ:

```bash
docker-compose build
```

3. Запустите приложение:

```bash
docker-compose up -d
```

Приложение будет доступно по адресу: http://localhost:3004

### Проверка состояния

Для проверки работоспособности приложения и подключения к БД:

```bash
curl http://localhost:3004/api/health
```

### Остановка приложения

```bash
docker-compose down
```

## Развертывание на сервере

1. Клонируйте репозиторий на ваш сервер:

```bash
git clone https://github.com/yourname/openparsersferav.git
cd openparsersferav
```

2. Отредактируйте файл `stack.env` с настройками подключения к БД

3. Запустите приложение:

```bash
docker-compose up -d
```

## Обновление приложения

```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## Решение проблемы с libssl в Docker

Если вы столкнулись с ошибкой:
```
Error [PrismaClientInitializationError]: Unable to require(`/app/src/generated/prisma/libquery_engine-linux-musl.so.node`).
The Prisma engines do not seem to be compatible with your system. 
Details: Error loading shared library libssl.so.1.1: No such file or directory
```

В версии v1.1.0 Docker-образа внесены следующие изменения:

1. В `Dockerfile` вместо устаревших библиотек glibc используется пакет `gcompat`, что обеспечивает совместимость с Alpine Linux 3.17+ и OpenSSL 3.0
2. Упрощен процесс установки зависимостей, так как Prisma 5.9.0 уже имеет встроенную поддержку OpenSSL 3.0
3. Добавлена генерация Prisma клиента перед запуском в контейнере
4. Добавлена поддержка автоматического запуска миграций БД (опционально)

При обновлении проекта достаточно выполнить:
```
docker-compose down
docker-compose build
docker-compose up -d
```

## Резервное копирование данных

Данные хранятся во внешней базе данных, поэтому резервное копирование необходимо выполнять на стороне базы данных.

## Контакты

Для вопросов и предложений: your.email@example.com

# OpenParsersFeraV - Парсер позиций товаров Wildberries

Приложение для анализа позиций товаров в поисковой выдаче Wildberries. Позволяет отслеживать позиции своих товаров и товаров конкурентов в разных городах и визуализировать результаты.

## Возможности

- Поиск товаров по артикулам на Wildberries
- Анализ позиций товаров в разных городах
- Сравнение с товарами конкурентов
- Визуализация данных в виде графиков и таблиц
- Отслеживание истории изменения позиций

## Технологии

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

## Установка и запуск

1. Клонировать репозиторий:

```bash
git clone https://github.com/yourusername/openparsersferav.git
cd openparsersferav
```

2. Установить зависимости:

```bash
npm install
```

3. Запустить сервер разработки:

```bash
npm run dev
```

4. Открыть в браузере:

```
http://localhost:3000
```

## API

Приложение использует следующие API:

- `/api/parser` - Парсинг данных с Wildberries
- `/api/history` - Работа с историей поисков

## Структура проекта

- `/src/app` - Основной код приложения
  - `/components` - Компоненты React
  - `/api` - API маршруты
- `/public` - Статические файлы

## TODO

- [ ] Добавить авторизацию
- [ ] Интегрировать с PostgreSQL для хранения истории
- [ ] Добавить экспорт данных в Excel
- [ ] Реализовать анализ ключевых слов

# scan-sphere
