# MyLink - Настройка и запуск

## Быстрый старт

### 1. Запуск через Docker (рекомендуется)

```bash
# Запустить все сервисы
docker-compose up --build -d

# Проверить статус
docker-compose ps

# Просмотр логов
docker-compose logs -f backend
```

**Сервисы будут доступны:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs
- AI Assistant: http://localhost:8001
- PostgreSQL: localhost:5433

### 2. Локальная разработка

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Frontend
```bash
cd frontend
pnpm install  # или npm install
pnpm dev      # или npm run dev
```

**Переменные окружения для фронтенда:**
Создайте файл `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Структура проекта

```
mylink-app/
├── backend/          # FastAPI бэкенд
│   ├── main.py      # Основной файл приложения
│   ├── models.py    # Модели базы данных
│   ├── schemas.py   # Pydantic схемы
│   ├── crud.py      # CRUD операции
│   ├── auth.py      # Аутентификация
│   └── database.py  # Настройки БД
├── frontend/        # Next.js фронтенд
│   ├── app/         # App Router (Next.js 13+)
│   ├── components/  # React компоненты
│   └── lib/         # Утилиты и API клиент
├── ai-assistent/    # AI сервис (опционально)
└── docker-compose.yml
```

## API Документация

Полная документация API находится в файле `API_ENDPOINTS.md`

### Основные эндпоинты:

**Аутентификация:**
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход

**Пользователи:**
- `GET /users` - Список пользователей
- `GET /users/{id}` - Пользователь по ID

**Вакансии:**
- `GET /vacancies` - Список вакансий
- `POST /vacancies` - Создать вакансию
- `GET /vacancies/{id}` - Вакансия по ID

**Заявки:**
- `GET /applications` - Список заявок
- `POST /applications` - Создать заявку

## Роли пользователей

### Работодатель (employer)
- Может создавать вакансии
- Просматривать заявки на свои вакансии
- Изменять статус заявок

### Соискатель (job_seeker)
- Может просматривать вакансии
- Откликаться на вакансии
- Просматривать свои заявки

## База данных

**PostgreSQL схема:**
- `users` - пользователи (работодатели и соискатели)
- `vacancies` - вакансии
- `job_applications` - заявки на работу

**Подключение к БД:**
```
Host: localhost
Port: 5433
Database: mylink_vacancies
User: mylink_user
Password: mylink_password
```

## Полезные команды

```bash
# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes (очистить БД)
docker-compose down -v

# Перезапустить определенный сервис
docker-compose restart backend

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Проверка работы API
curl http://localhost:8000/
curl http://localhost:8000/vacancies
```

## Troubleshooting

### Порт уже занят
Если порт 5432 занят:
```bash
lsof -ti:5432 | xargs kill -9
```

### Ошибки с Docker
```bash
# Очистить все
docker-compose down -v
docker system prune -a

# Пересобрать
docker-compose up --build -d
```

### Ошибки с npm/pnpm
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Разработка

### Добавление новых эндпоинтов
1. Добавьте модель в `backend/models.py`
2. Создайте схемы в `backend/schemas.py`
3. Добавьте CRUD в `backend/crud.py`
4. Создайте эндпоинт в `backend/main.py`
5. Обновите `API_ENDPOINTS.md`

### Работа с фронтендом
- Компоненты в `frontend/components/`
- Страницы в `frontend/app/`
- API клиент в `frontend/lib/api.ts`

## Технологический стек

**Backend:**
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Bcrypt (хеширование паролей)
- JWT (аутентификация)

**Frontend:**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI

## Лицензия

MIT


