# SmartBot - AI-ассистент для скрининга кандидатов

SmartBot - это интеллектуальный ассистент для автоматизации первичного скрининга кандидатов. Он анализирует резюме и описание вакансии, задает уточняющие вопросы и выдает процент соответствия.

## 🚀 Возможности

- **Анализ резюме и вакансий**: Автоматический разбор текста резюме (PDF, DOCX, TXT) и описания вакансии
- **Интерактивный диалог**: Задает до 5 уточняющих вопросов кандидату
- **Оценка релевантности**: Выдает процент соответствия (0-100%) и краткое резюме для работодателя
- **Многоязычность**: Автоматически определяет язык и переводит на русский
- **Сохранение сессий**: Хранит историю диалогов для дальнейшего анализа

## 📋 Требования

- Python 3.11+
- OpenAI API ключ

## 🛠 Установка и запуск

### 1. Установка зависимостей

```bash
cd ai-assistent
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Добавьте ваш OpenAI API ключ в `.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Запуск сервиса

```bash
python main.py
```

Сервис запустится на `http://localhost:8001`

### 4. Запуск через Docker

```bash
docker-compose up ai-assistent
```

## 📡 API Endpoints

### `POST /chat/start`

Начинает новый диалог с кандидатом.

**Запрос:**
```json
{
  "vacancy_text": "Python Developer. Требуется опыт 3+ года...",
  "cv_text": "Иван Иванов. Опыт работы: 2 года Python...",
  "session_id": "app_123" // опционально
}
```

**Ответ:**
```json
{
  "session_id": "session_1234567890",
  "bot_reply": "Спасибо за отклик! Вижу, что у вас 2 года опыта. Готовы быстро подтянуть навыки до уровня middle? [Да/Нет]",
  "relevance_percent": 65,
  "reasons": ["Опыт 2 года вместо 3+", "Знает Python"],
  "summary_for_employer": "Кандидат подходит на 65%, требуется уточнение готовности к обучению",
  "dialog_stage": "questioning",
  "is_completed": false
}
```

### `POST /chat/turn`

Продолжает диалог с кандидатом.

**Запрос:**
```json
{
  "session_id": "session_1234567890",
  "message_from_candidate": "Да, готов учиться и развиваться"
}
```

**Ответ:**
```json
{
  "session_id": "session_1234567890",
  "bot_reply": "Отлично! Благодарю за ответ. Я завершил анализ вашей заявки.",
  "relevance_percent": 75,
  "reasons": ["Опыт 2 года", "Готов к обучению", "Знает Python и Django"],
  "summary_for_employer": "Подходит на 75%, готов к обучению и развитию",
  "dialog_stage": "completed",
  "is_completed": true
}
```

### `GET /sessions/{session_id}`

Получает информацию о сессии.

**Ответ:**
```json
{
  "session_id": "session_1234567890",
  "vacancy_text": "...",
  "cv_text": "...",
  "question_count": 2,
  "is_completed": true,
  "relevance_percent": 75,
  "summary": "Подходит на 75%",
  "reasons": ["Опыт 2 года", "Готов к обучению"],
  "created_at": "2025-10-18T10:00:00",
  "updated_at": "2025-10-18T10:05:00",
  "message_count": 5
}
```

### `GET /sessions`

Получает список всех сессий.

### `DELETE /sessions/{session_id}`

Удаляет сессию.

## 🧪 Тестирование

Для тестирования API можно использовать `test_api.py`:

```bash
python test_api.py
```

## 🏗 Архитектура

### Системный промпт

SmartBot использует специально разработанный промпт, который:
- Анализирует критичные критерии (навыки, опыт, локация, языки)
- Задает только важные вопросы (max 5)
- Использует дружелюбный тон коммуникации
- Выдает честную оценку без завышения

### Оценка релевантности

Релевантность рассчитывается по следующим критериям (по убыванию важности):
1. **Ключевые навыки/стек** (40%)
2. **Годы опыта** (25%)
3. **Локация/готовность к переезду** (15%)
4. **График работы** (10%)
5. **Языки** (10%)

### Хранение сессий

Сессии сохраняются в `sessions.json`. В продакшене рекомендуется использовать Redis или PostgreSQL.

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | Значение по умолчанию |
|-----------|----------|----------------------|
| `OPENAI_API_KEY` | API ключ OpenAI | - (обязательно) |
| `AI_ASSISTANT_PORT` | Порт сервиса | 8001 |
| `AI_ASSISTANT_HOST` | Хост сервиса | 0.0.0.0 |
| `OPENAI_MODEL` | Модель OpenAI | gpt-4o-mini |
| `MAX_TOKENS` | Максимум токенов | 800 |
| `TEMPERATURE` | Температура генерации | 0.7 |
| `MAX_QUESTIONS_PER_SESSION` | Макс. вопросов | 5 |

## 📊 Примеры использования

### Python

```python
import requests

# Начало диалога
response = requests.post("http://localhost:8001/chat/start", json={
    "vacancy_text": "Senior Python Developer. 5+ years experience...",
    "cv_text": "John Doe. 6 years Python experience..."
})
data = response.json()
print(f"Relevance: {data['relevance_percent']}%")
print(f"Bot: {data['bot_reply']}")

# Продолжение диалога
if not data['is_completed']:
    response = requests.post("http://localhost:8001/chat/turn", json={
        "session_id": data['session_id'],
        "message_from_candidate": "Yes, I'm ready to relocate"
    })
    data = response.json()
    print(f"Final relevance: {data['relevance_percent']}%")
```

### cURL

```bash
# Начало диалога
curl -X POST http://localhost:8001/chat/start \
  -H "Content-Type: application/json" \
  -d '{
    "vacancy_text": "Python разработчик",
    "cv_text": "Опыт 3 года Python"
  }'

# Продолжение диалога
curl -X POST http://localhost:8001/chat/turn \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_1234567890",
    "message_from_candidate": "Да, готов"
  }'
```

## 🔗 Интеграция с backend

Backend MyLink автоматически подключается к AI-ассистенту через `ai_client.py`. 

Эндпоинты backend:
- `POST /applications/{id}/analyze` - запускает анализ заявки
- `POST /applications/{id}/chat` - отправляет сообщение в чат

## 📝 Логирование

Все запросы логируются в консоль. Сессии сохраняются в `sessions.json`.

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:
1. Проверьте, что `OPENAI_API_KEY` установлен правильно
2. Убедитесь, что порт 8001 свободен
3. Проверьте логи: `docker-compose logs ai-assistent`

## 📄 Лицензия

MIT

