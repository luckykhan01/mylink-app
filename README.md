# 🚀 MyLink - Платформа поиска работы с AI

Полнофункциональная платформа для поиска работы с интеграцией AI-бота для анализа откликов.

## ✨ Возможности

- **Два типа пользователей**: Работодатели и соискатели
- **Система вакансий**: Создание, просмотр, фильтрация
- **Система заявок**: Отклики на вакансии с сопроводительными письмами
- **JWT аутентификация**: Безопасная авторизация
- **AI интеграция**: Чат-бот для анализа откликов
- **Docker**: Полная контейнеризация всех сервисов

## 🏗️ Архитектура

```
mylink-app/
├── backend/          # FastAPI сервер
├── frontend/         # Next.js приложение
├── ai-assistent/     # AI сервис
└── docker-compose.yml
```

## 🚀 Быстрый запуск

### 1. Клонирование и запуск

```bash
# Клонируйте репозиторий
git clone <your-repo>
cd mylink-app

# Запустите все сервисы
docker-compose up --build -d

# Проверьте статус
docker-compose ps
```

### 2. Доступ к сервисам

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **AI Assistant**: http://localhost:8001
- **PostgreSQL**: localhost:5433

## 📊 Тестовые данные

После запуска в системе уже есть тестовые данные:

### Пользователи:
- **Работодатель**: `test@example.com` / `testpass123`
- **Соискатель**: `seeker@example.com` / `jobpass123`

### Вакансии:
- Senior Python Developer (TechCorp, Москва)
- Frontend Developer (MyLink Company, СПб)

### Заявки:
- Отклики на обе вакансии

## 🔧 Локальная разработка

### Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend (Next.js)
```bash
cd frontend
pnpm install
pnpm dev
```

**Создайте файл `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🗄️ База данных

**PostgreSQL подключение:**
```
Host: localhost
Port: 5433
Database: mylink_vacancies
User: mylink_user
Password: mylink_password
```

**Схема:**
- `users` - пользователи (работодатели/соискатели)
- `vacancies` - вакансии
- `job_applications` - заявки на работу

## 🔐 API Документация

Полная документация API: [API_ENDPOINTS.md](./API_ENDPOINTS.md)

### Основные эндпоинты:

**Аутентификация:**
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход

**Вакансии:**
- `GET /vacancies` - Список вакансий
- `POST /vacancies` - Создать вакансию
- `GET /vacancies/{id}` - Вакансия по ID

**Заявки:**
- `GET /applications` - Список заявок
- `POST /applications` - Создать заявку

## 👥 Роли пользователей

### Работодатель (employer)
- ✅ Создание вакансий
- ✅ Просмотр заявок на свои вакансии
- ✅ Изменение статуса заявок

### Соискатель (job_seeker)
- ✅ Просмотр вакансий
- ✅ Отклики на вакансии
- ✅ Просмотр своих заявок

## 🛠️ Технологический стек

**Backend:**
- FastAPI + Python 3.11
- PostgreSQL + SQLAlchemy
- JWT аутентификация
- Bcrypt хеширование паролей

**Frontend:**
- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- Radix UI компоненты

**DevOps:**
- Docker + Docker Compose
- Multi-stage builds
- Production-ready образы

## 📝 Полезные команды

```bash
# Остановить все сервисы
docker-compose down

# Остановить и очистить БД
docker-compose down -v

# Перезапустить сервис
docker-compose restart backend

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Проверка API
curl http://localhost:8000/
curl http://localhost:8000/vacancies
```

## 🧪 Тестирование API

```bash
# Регистрация работодателя
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","full_name":"Test User","role":"employer"}'

# Вход в систему
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Создание вакансии (с токеном)
curl -X POST "http://localhost:8000/vacancies?employer_id=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Developer","company":"Test Corp","location":"Moscow","description":"Test job"}'
```

## 🐛 Troubleshooting

### Порт занят
```bash
# Очистить порт 5432
lsof -ti:5432 | xargs kill -9
```

### Docker проблемы
```bash
# Полная очистка
docker-compose down -v
docker system prune -a
docker-compose up --build -d
```

### Frontend проблемы
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📈 Мониторинг

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Логи в реальном времени
docker-compose logs -f
```

## 🔄 CI/CD

Проект готов для развертывания в production:

1. **Переменные окружения** настроены через Docker Compose
2. **Multi-stage builds** оптимизируют размер образов
3. **Standalone режим** Next.js для production
4. **Health checks** для мониторинга

## 📄 Лицензия

MIT License

---

**Готово к использованию!** 🎉

Все сервисы интегрированы и работают. Frontend подключен к Backend, база данных настроена, API полностью функционален.