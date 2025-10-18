# AI Assistant API - Инструкция по тестированию

## Как запустить и протестировать API без фронтенда

### 1. Запуск сервера

```bash
cd ai-assistent
source .venv/bin/activate  # или .venv/bin/python
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Тестирование через curl

#### Парсинг резюме:
```bash
curl -X POST http://localhost:8000/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"Алматы, Backend 2 года, FastAPI, англ B2, 600000 KZT, фуллтайм", "kind":"cv"}'
```

#### Парсинг вакансии:
```bash
curl -X POST http://localhost:8000/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"Ищем Backend в Алматы, 3+ года, Python/FastAPI, фуллтайм, 500-700 тыс.", "kind":"vacancy"}'
```

#### Анализ соответствия:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"cv_text":"Алматы, Backend 2 года, FastAPI, англ B2, 600000 KZT, фуллтайм", "vacancy_text":"Ищем Backend в Алматы, 3+ года, Python/FastAPI, фуллтайм, 500-700 тыс."}'
```

#### Чат с кандидатом:
```bash
curl -X POST http://localhost:8000/chat/turn \
  -H "Content-Type: application/json" \
  -d '{"session_id":"YOUR_SESSION_ID", "message_from_candidate":"У меня есть опыт работы с Python"}'
```

### 3. Автоматическое тестирование

Запустите скрипт для полного тестирования всех endpoints:

```bash
python test_api.py
```

### 4. Swagger UI

Откройте в браузере: http://localhost:8000/docs

### 5. Доступные endpoints

- `POST /parse` - Парсинг резюме или вакансии
- `POST /analyze` - Анализ соответствия кандидата и вакансии
- `POST /chat/turn` - Чат с кандидатом
- `GET /sessions/{session_id}` - Информация о сессии
- `GET /docs` - Swagger UI документация

### 6. Система семантического поиска с Embeddings

API использует OpenAI text-embedding-3-small для семантического сопоставления:

#### 🧠 Как это работает:
- **Embeddings**: Векторные представления текста для понимания смысла
- **Семантическое сопоставление**: Система понимает синонимы и похожие понятия
- **Динамические синонимы**: Не нужно хардкодить все варианты
- **Кэширование**: Embeddings сохраняются для быстрого доступа

#### 📊 Примеры семантического сопоставления:

**Типы занятости:**
- `full-time` ↔ `фуллтайм` ↔ `полная занятость` ↔ `полный рабочий день`
- `part-time` ↔ `парттайм` ↔ `частичная занятость` ↔ `неполный рабочий день`
- `freelance` ↔ `фриланс` ↔ `удаленная работа` ↔ `remote`

**Позиции:**
- `Backend Developer` ↔ `Backend` ↔ `бэкенд` ↔ `backend разработчик`
- `Frontend Developer` ↔ `Frontend` ↔ `фронтенд` ↔ `frontend разработчик`
- `Full Stack` ↔ `Fullstack` ↔ `фуллстек` ↔ `full stack developer`

**Города:**
- `Almaty` ↔ `Алматы` ↔ `Алма-Ата`
- `Moscow` ↔ `Москва` ↔ `МСК`
- `Nur-Sultan` ↔ `Астана` ↔ `Astana`

**Навыки:**
- `Python` ↔ `python` ↔ `питон` ↔ `py`
- `JavaScript` ↔ `JS` ↔ `джаваскрипт`
- `FastAPI` ↔ `Fast API` ↔ `fast-api`

#### ⚙️ Технические детали:
- **Модель**: OpenAI text-embedding-3-small
- **Порог схожести**: 0.8 (настраивается)
- **Кэш**: Автоматическое сохранение embeddings
- **Производительность**: Быстрое сопоставление с кэшированием

### 7. Примеры ответов

#### Парсинг резюме возвращает:
```json
{
  "candidate": {
    "city": "Алматы",
    "experience_years": 2.0,
    "position": "Backend",
    "skills": ["FastAPI"],
    "salary_expectation": 600000,
    "employment_type": "фуллтайм"
  }
}
```

#### Анализ возвращает:
```json
{
  "relevance_percent": 45,
  "reasons": ["Опыт меньше требуемого", "Не хватает навыков"],
  "followup_questions": ["Можете рассказать о вашем опыте?"],
  "session_id": "uuid-here"
}
```
