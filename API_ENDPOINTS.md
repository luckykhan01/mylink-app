# MyLink API - Документация эндпоинтов для фронтенда

## Базовый URL
```
http://localhost:8000
```

## Аутентификация

### POST /auth/register
**Регистрация нового пользователя**

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Имя Фамилия",
  "phone": "+7-999-123-45-67", // опционально
  "role": "employer" // или "job_seeker"
}
```

**Ответ:**
```json
{
  "email": "user@example.com",
  "full_name": "Имя Фамилия",
  "phone": "+7-999-123-45-67",
  "role": "employer",
  "id": 1,
  "is_active": true,
  "created_at": "2025-10-18T13:21:13.400664Z",
  "updated_at": null
}
```

### POST /auth/login
**Вход пользователя**

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Имя Фамилия",
    "role": "employer",
    "is_active": true,
    "created_at": "2025-10-18T13:21:13.400664Z"
  }
}
```

## Пользователи

### GET /users
**Получить список пользователей**

**Параметры запроса:**
- `page` (int, default: 1) - номер страницы
- `per_page` (int, default: 10) - количество на странице
- `role` (string, optional) - фильтр по роли: "employer" или "job_seeker"
- `is_active` (boolean, optional) - фильтр по активности

**Ответ:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "employer@example.com",
      "full_name": "Иван Работодатель",
      "phone": "+7-999-123-45-67",
      "role": "employer",
      "is_active": true,
      "created_at": "2025-10-18T13:21:13.400664Z",
      "updated_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1
}
```

### GET /users/{user_id}
**Получить пользователя по ID**

**Ответ:**
```json
{
  "id": 1,
  "email": "employer@example.com",
  "full_name": "Иван Работодатель",
  "phone": "+7-999-123-45-67",
  "role": "employer",
  "is_active": true,
  "created_at": "2025-10-18T13:21:13.400664Z",
  "updated_at": null
}
```

### PUT /users/{user_id}
**Обновить пользователя**

**Тело запроса:**
```json
{
  "email": "newemail@example.com", // опционально
  "full_name": "Новое Имя", // опционально
  "phone": "+7-999-999-99-99", // опционально
  "password": "newpassword", // опционально
  "is_active": true // опционально
}
```

### DELETE /users/{user_id}
**Удалить пользователя**

**Ответ:**
```json
{
  "message": "Пользователь успешно удален"
}
```

## Вакансии

### GET /vacancies
**Получить список вакансий**

**Параметры запроса:**
- `page` (int, default: 1) - номер страницы
- `per_page` (int, default: 10) - количество на странице
- `search` (string, optional) - поиск по тексту
- `company` (string, optional) - фильтр по компании
- `location` (string, optional) - фильтр по локации
- `experience_level` (string, optional) - уровень опыта
- `remote_work` (boolean, optional) - удаленная работа

**Ответ:**
```json
{
  "vacancies": [
    {
      "id": 1,
      "title": "Senior Python Developer",
      "company": "TechCorp",
      "location": "Москва",
      "salary_min": 150000.0,
      "salary_max": 250000.0,
      "currency": "RUB",
      "description": "Ищем опытного Python разработчика",
      "requirements": "Python, FastAPI, PostgreSQL",
      "benefits": null,
      "employment_type": null,
      "experience_level": "senior",
      "remote_work": true,
      "is_active": true,
      "created_at": "2025-10-18T13:21:21.434964Z",
      "updated_at": null,
      "employer_id": 1
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1
}
```

### GET /vacancies/{vacancy_id}
**Получить вакансию по ID**

**Ответ:** аналогичен элементу из списка вакансий

### POST /vacancies
**Создать новую вакансию**

**Параметры запроса:**
- `employer_id` (int) - ID работодателя

**Тело запроса:**
```json
{
  "title": "Senior Python Developer",
  "company": "TechCorp",
  "location": "Москва",
  "salary_min": 150000,
  "salary_max": 250000,
  "currency": "RUB", // опционально, по умолчанию "RUB"
  "description": "Описание вакансии",
  "requirements": "Требования к кандидату",
  "benefits": "Преимущества работы", // опционально
  "employment_type": "full-time", // опционально
  "experience_level": "senior", // опционально
  "remote_work": true, // опционально, по умолчанию false
  "is_active": true // опционально, по умолчанию true
}
```

### PUT /vacancies/{vacancy_id}
**Обновить вакансию**

**Тело запроса:** аналогично созданию, все поля опциональны

### DELETE /vacancies/{vacancy_id}
**Удалить вакансию**

**Ответ:**
```json
{
  "message": "Вакансия успешно удалена"
}
```

### GET /vacancies/companies
**Получить список всех компаний**

**Ответ:**
```json
{
  "companies": ["TechCorp", "AnotherCompany", "StartupInc"]
}
```

### GET /vacancies/locations
**Получить список всех локаций**

**Ответ:**
```json
{
  "locations": ["Москва", "Санкт-Петербург", "Удаленно"]
}
```

## Заявки на работу

### GET /applications
**Получить список заявок на работу**

**Параметры запроса:**
- `page` (int, default: 1) - номер страницы
- `per_page` (int, default: 10) - количество на странице
- `job_seeker_id` (int, optional) - фильтр по соискателю
- `vacancy_id` (int, optional) - фильтр по вакансии
- `status` (string, optional) - фильтр по статусу

**Ответ:**
```json
{
  "applications": [
    {
      "id": 1,
      "cover_letter": "Здравствуйте! Я хочу откликнуться на вашу вакансию.",
      "status": "pending",
      "created_at": "2025-10-18T13:21:29.167984Z",
      "updated_at": null,
      "job_seeker_id": 2,
      "vacancy_id": 1
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1
}
```

### POST /applications
**Создать заявку на работу**

**Параметры запроса:**
- `job_seeker_id` (int) - ID соискателя

**Тело запроса:**
```json
{
  "vacancy_id": 1,
  "cover_letter": "Здравствуйте! Я хочу откликнуться на вашу вакансию." // опционально
}
```

### PUT /applications/{application_id}
**Обновить заявку на работу**

**Тело запроса:**
```json
{
  "cover_letter": "Обновленное сопроводительное письмо", // опционально
  "status": "reviewed" // опционально: "pending", "reviewed", "accepted", "rejected"
}
```

## Общие эндпоинты

### GET /
**Проверка работы API**

**Ответ:**
```json
{
  "message": "Добро пожаловать в MyLink API!",
  "status": "running"
}
```

### GET /health
**Проверка здоровья сервиса**

**Ответ:**
```json
{
  "status": "ok",
  "message": "Backend is healthy"
}
```

### GET /info
**Информация о приложении**

**Ответ:**
```json
{
  "app_name": "MyLink Backend",
  "version": "1.0.0",
  "description": "FastAPI backend for MyLink application - сайт вакансий"
}
```

## Коды ошибок

- `400` - Неверные данные запроса
- `401` - Неавторизован (неверный токен или пароль)
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Примеры использования

### Регистрация работодателя
```javascript
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'employer@example.com',
    password: 'password123',
    full_name: 'Иван Работодатель',
    role: 'employer'
  })
});
```

### Создание вакансии
```javascript
const response = await fetch('http://localhost:8000/vacancies?employer_id=1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Python Developer',
    company: 'TechCorp',
    location: 'Москва',
    salary_min: 100000,
    salary_max: 150000,
    description: 'Описание вакансии',
    requirements: 'Python, FastAPI',
    experience_level: 'middle'
  })
});
```

### Отклик на вакансию
```javascript
const response = await fetch('http://localhost:8000/applications?job_seeker_id=2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    vacancy_id: 1,
    cover_letter: 'Здравствуйте! Я хочу откликнуться на вакансию.'
  })
});
```

## Документация API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

