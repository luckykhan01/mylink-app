# MyLink Application

Полнофункциональное приложение MyLink с микросервисной архитектурой.

## Структура проекта

```
mylink-app/
├── frontend/          # React фронтенд
│   ├── main/         # Основные компоненты
│   └── Dockerfile
├── backend/          # FastAPI бэкенд
│   ├── main.py       # Основное приложение
│   ├── requirements.txt
│   └── Dockerfile
├── ai-assistent/     # AI сервис
│   ├── main.py       # AI приложение
│   ├── requirements.txt
│   └── Dockerfile
└── docker-compose.yml # Конфигурация Docker
```

## Быстрый запуск с Docker

### 1. Запуск всех сервисов

```bash
docker-compose up --build
```

### 2. Запуск в фоновом режиме

```bash
docker-compose up -d --build
```

### 3. Остановка сервисов

```bash
docker-compose down
```

## Доступные сервисы

После запуска будут доступны:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **AI Assistant**: http://localhost:8001

## API Документация

- **Backend Swagger**: http://localhost:8000/docs
- **Backend ReDoc**: http://localhost:8000/redoc
- **AI Assistant Swagger**: http://localhost:8001/docs

## Разработка

### Локальная разработка

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   python main.py
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **AI Assistant**:
   ```bash
   cd ai-assistent
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   python main.py
   ```

### Docker разработка

Все сервисы настроены с hot-reload для удобной разработки.

## Команды Docker

```bash
# Пересборка и запуск
docker-compose up --build

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Очистка volumes
docker-compose down -v
```
