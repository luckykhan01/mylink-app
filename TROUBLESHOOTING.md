# 🔍 Диагностика проблем с регистрацией

## Быстрая проверка

### 1. Очистите кэш браузера
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### 2. Проверьте консоль браузера
- Откройте http://localhost:3000/register
- Нажмите F12
- Перейдите на вкладку "Console"
- Попробуйте зарегистрироваться
- Покажите ошибки

### 3. Проверьте Network
- В Developer Tools откройте вкладку "Network"
- Попробуйте зарегистрироваться
- Найдите запрос к `/auth/register`
- Проверьте статус (должен быть 200 OK)
- Проверьте ответ

### 4. Тест API напрямую
Откройте консоль браузера (F12) на http://localhost:3000 и выполните:

```javascript
fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'browsertest@example.com',
    password: 'testpass123',
    full_name: 'Browser Test',
    role: 'job_seeker'
  })
})
.then(r => r.json())
.then(d => console.log('Register:', d))
.then(() => fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'browsertest@example.com',
    password: 'testpass123'
  })
}))
.then(r => r.json())
.then(d => console.log('Login:', d))
.catch(e => console.error('Error:', e))
```

## Что должно работать

✅ Backend на http://localhost:8000  
✅ Frontend на http://localhost:3000  
✅ POST /auth/register возвращает User  
✅ POST /auth/login возвращает access_token  
✅ CORS настроен правильно  
✅ API клиент вызывает register → login  

## Известные проблемы

### Проблема: Кнопка зависает в "Регистрация..."

**Причина:** Браузер кэширует старую версию JavaScript  
**Решение:** Hard refresh (Ctrl+Shift+R)

### Проблема: CORS ошибка

**Причина:** Backend не доступен  
**Решение:** Проверьте `docker-compose ps`

### Проблема: Network error

**Причина:** Backend не отвечает на localhost:8000  
**Решение:** 
```bash
curl http://localhost:8000/
docker-compose restart backend
```

## Логи

```bash
# Backend логи
docker-compose logs backend --tail=20

# Frontend логи  
docker-compose logs frontend --tail=20

# Мониторинг в реальном времени
docker-compose logs -f backend
```

## Тестирование через curl

```bash
# Регистрация
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test User",
    "role": "job_seeker"
  }'

# Вход
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

## Перезапуск

```bash
# Пересобрать и перезапустить
docker-compose down
docker-compose up --build -d

# Только перезапустить
docker-compose restart frontend backend
```


