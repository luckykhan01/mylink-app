"""
SmartBot - AI-ассистент для автоматизированного скрининга кандидатов
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn
import os
from datetime import datetime
import json
from pathlib import Path
import openai
from openai import OpenAI

app = FastAPI(
    title="SmartBot AI Assistant",
    description="AI-ассистент для первичного скрининга кандидатов",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация OpenAI клиента
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("WARNING: OPENAI_API_KEY not found in environment variables")
    
client = OpenAI(api_key=openai_api_key) if openai_api_key else None

# Хранилище сессий (в продакшене лучше использовать Redis или БД)
SESSIONS_FILE = Path("sessions.json")

def load_sessions() -> Dict[str, Any]:
    """Загружает сессии из файла"""
    if SESSIONS_FILE.exists():
        try:
            with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading sessions: {e}")
            return {}
    return {}

def save_sessions(sessions: Dict[str, Any]):
    """Сохраняет сессии в файл"""
    try:
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(sessions, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving sessions: {e}")

sessions_store = load_sessions()

# Системный промпт SmartBot
SYSTEM_PROMPT = """Ты — SmartBot, умный виджет на сайте работодателя. Твоя задача — автоматизировать первичный скрининг кандидатов по конкретной вакансии.

ВХОД:
1) Описание вакансии: <JOB_DESCRIPTION>
2) Резюме кандидата: <CANDIDATE_RESUME>
Оба текста могут быть на русском или английском. Определи язык кандидата по резюме и переведи их в русский язык и отвечай на русском

ТОН КОММУНИКАЦИИ (Tone of Voice):
— Дружелюбно, профессионально и понятно.
— Простые, короткие фразы. Без канцелярита и шаблонов.
— Вежливо и уважительно, без давления, нейтрально.
— Эмпатично при уточнениях: признавай усилия кандидата и избегай категоричности.

ЦЕЛЬ:
Быстро выявить соответствие вакансии и кандидата. Если есть пробелы или несоответствия между вакансией и резюме, задать немного (до 4–8) точных уточняющих вопросов, по одному за раз, без затягивания диалога. После ответов — выдать оценку релевантности в процентах и одно предложение-вывод.

ПРАВИЛА ВЗАИМОДЕЙСТВИЯ:
1) Сперва проанализируй вакансию и резюме. Найди самые критичные критерии (примерно по убыванию важности): ключевые навыки/стек, годы опыта на нужных задачах, локация/релокация, график/формат (офис/гибрид/удалёнка), языки (RU/EN/др.), образование/сертификаты (если явно требуются), правовой статус/разрешение на работу (если указано в вакансии), уровень компенсации (если задан в вакансии).
2) Задавай только необходимые вопросы, которые реально меняют оценку. Также будь внимателен и давай свою оценку преувеличивает ли кандидат по твоему мнению. Можешь просить описать подробнее те моменты, которые кажутся тебе важными для вакансии.
3) Формулируй вопросы максимально конкретно и коротко (1–2 предложения). Где уместно — предлагай варианты ответа (кнопки/чекбоксы) в скобках: [Да/Нет], [Готов к переезду/Не готов], [0–6 мес/6–12 мес/12+ мес], [Город: …].
4) ВАЖНО: Даже если видишь, что кандидат НЕ подходит по критичному критерию (например, не готов к переезду), все равно задай минимум 3-4 важных вопроса. НЕ завершай диалог после первого же блокирующего ответа. Собери полную информацию о кандидате.
5) Избегай чувствительных/дискриминационных тем. Не спрашивай возраст, семейное положение, взгляды, здоровье и т.д.
6) Ты — судья качества. Оцени переносимость навыков на наш целевой стек.
7) Держи каждое сообщение кратким. Пример тона:
   — «Спасибо за отклик! Уточню пару моментов, чтобы понять, подойдёт ли вам вакансия.»
   — «Вижу, что опыт чуть меньше требуемого. Готовы быстро подтянуть навык X на испытательном сроке? [Да/Нет]»
   — «Благодарю за ответ, учту при анализе.»
8) ЗАВЕРШЕНИЕ ДИАЛОГА: После всех вопросов (или когда собрал достаточно информации), отправь вежливое прощальное сообщение: "Спасибо за отклик! Мы свяжемся с вами в ближайшее время." Затем в том же ответе добавь [RESULT] с оценкой.

ЛОГИКА ОЦЕНКИ:
— Вычисли процент соответствия (0–100) эвристически, учитывая вес критериев из п.1. Если данных мало, попроси 1–3 уточнения и только затем выдай оценку.
— Не завышай оценку при критичных несоответствиях (локация, ключевой стек, обязательный язык).
— Если информация неоднозначна, трактуй как «неизвестно» и задавай 1 прицельный вопрос.

ФОРМАТ РАБОТЫ:
A) Кандидату показываешь только короткие, уважительные вопросы и мини-реплики.
B) Для работодателя, по завершении (после 4–8 уточнений) выдай итог в следующем формате:

[RESULT]
match_percent: <целое_число_0..100>
summary_one_liner: "<одно краткое предложение на языке работодателя (по умолчанию RU): Пример — 'Подходит на 90%, требуется уточнение по опыту бэкенда.' или 'Не подходит: не готов к переезду.'>"
rejection_tags: "<список тегов через запятую из следующих: relocation (проблемы с локацией/переездом), exp_gap (недостаточный опыт), salary_mismatch (несовпадение по зарплате), schedule_conflict (несовпадение графика/формата работы), skill_mismatch (несовпадение навыков), language_barrier (проблемы с языками), education_gap (несовпадение образования). Выбери ТОЛЬКО релевантные теги на основе несоответствий. Если кандидат подходит хорошо (>70%), оставь пустым.>"
reasons: ["причина 1", "причина 2", ...]

ПЕРВЫЙ ШАГ:
— Прочитай <JOB_DESCRIPTION> и <CANDIDATE_RESUME>.
— Сформулируй 1 первый самый важный уточняющий вопрос.
— Жди ответа кандидата.
— Задай минимум 2-3 важных вопроса, даже если первый ответ показывает несоответствие.
— После 4-8 вопросов: отправь вежливое сообщение "Спасибо за отклик! Мы свяжемся с вами в ближайшее время." и добавь [RESULT] с оценкой в ТОМ ЖЕ сообщении."""


# ===== МОДЕЛИ ДАННЫХ =====

class ChatStartRequest(BaseModel):
    """Запрос на начало диалога с кандидатом"""
    vacancy_text: str = Field(..., description="Описание вакансии")
    cv_text: Optional[str] = Field(None, description="Текст резюме кандидата (если есть)")
    session_id: Optional[str] = Field(None, description="ID сессии (если нужно продолжить)")

class ChatTurnRequest(BaseModel):
    """Запрос на продолжение диалога"""
    session_id: str = Field(..., description="ID сессии")
    message_from_candidate: str = Field(..., description="Сообщение от кандидата")

class ChatResponse(BaseModel):
    """Ответ AI-ассистента"""
    session_id: str
    bot_reply: str
    relevance_percent: int
    reasons: List[str]
    summary_for_employer: str
    dialog_stage: str  # "questioning", "completed"
    is_completed: bool
    rejection_tags: List[str] = []  # Теги причин отклонения
    detailed_analysis: Optional[str] = None  # Детальный анализ (только при завершении)
    suggest_alternative_vacancy: bool = False  # Предложить альтернативную вакансию
    alternative_vacancy_reason: Optional[str] = None  # Причина предложения


# ===== УТИЛИТЫ =====

def extract_result_from_message(message: str) -> Optional[Dict[str, Any]]:
    """
    Извлекает [RESULT] из сообщения AI
    Формат:
    [RESULT]
    match_percent: 85
    summary_one_liner: "Подходит на 85%, есть опыт"
    reasons: ["опыт 3 года", "знает Python"]
    """
    if "[RESULT]" not in message:
        return None
    
    try:
        result_section = message.split("[RESULT]")[1].strip()
        lines = result_section.split("\n")
        
        result = {
            "match_percent": 0,
            "summary_one_liner": "",
            "reasons": [],
            "rejection_tags": []
        }
        
        for line in lines:
            line = line.strip()
            if line.startswith("match_percent:"):
                try:
                    result["match_percent"] = int(line.split(":", 1)[1].strip())
                except:
                    result["match_percent"] = 50
            elif line.startswith("summary_one_liner:"):
                result["summary_one_liner"] = line.split(":", 1)[1].strip().strip('"')
            elif line.startswith("rejection_tags:"):
                # Парсим теги отклонения
                tags_str = line.split(":", 1)[1].strip().strip('"')
                if tags_str:
                    # Разделяем по запятым и очищаем
                    tags = [t.strip() for t in tags_str.split(",")]
                    result["rejection_tags"] = [t for t in tags if t]
            elif line.startswith("reasons:"):
                # Парсим список причин
                reasons_str = line.split(":", 1)[1].strip()
                # Убираем квадратные скобки и парсим
                if reasons_str.startswith("[") and reasons_str.endswith("]"):
                    reasons_str = reasons_str[1:-1]
                    # Разделяем по запятым и очищаем
                    reasons = [r.strip().strip('"').strip("'") for r in reasons_str.split(",")]
                    result["reasons"] = [r for r in reasons if r]
        
        return result
    except Exception as e:
        print(f"Error parsing [RESULT]: {e}")
        return None

def call_openai(messages: List[Dict[str, str]], max_tokens: int = 500) -> str:
    """Вызов OpenAI API"""
    if not client:
        # Fallback если нет ключа
        return "Спасибо за ответ! Расскажите еще что-нибудь о себе."
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Используем более дешевую модель
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")


# ===== ЭНДПОИНТЫ =====

@app.get("/")
async def root():
    return {
        "service": "SmartBot AI Assistant",
        "version": "1.0.0",
        "status": "running",
        "openai_configured": client is not None
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "openai_configured": client is not None
    }

@app.post("/chat/start", response_model=ChatResponse)
async def start_chat(request: ChatStartRequest):
    """
    Начинает новый диалог с кандидатом
    
    1. Анализирует вакансию и резюме
    2. Формирует первый вопрос или сразу выдает результат
    3. Возвращает session_id для продолжения диалога
    """
    # Генерируем ID сессии
    session_id = request.session_id or f"session_{datetime.utcnow().timestamp()}"
    
    # Формируем начальный контекст
    initial_message = f"""<JOB_DESCRIPTION>
{request.vacancy_text}
</JOB_DESCRIPTION>

<CANDIDATE_RESUME>
{request.cv_text or "Резюме не предоставлено. Нужно узнать информацию о кандидате."}
</CANDIDATE_RESUME>

Проанализируй вакансию и резюме. Если информации достаточно для оценки, сразу выдай [RESULT]. Если нужны уточнения, задай ОДИН самый важный вопрос."""
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": initial_message}
    ]
    
    # Вызываем OpenAI
    ai_response = call_openai(messages, max_tokens=800)
    
    # Проверяем, есть ли [RESULT] в ответе
    result_data = extract_result_from_message(ai_response)
    
    if result_data:
        # Диалог завершен, есть оценка
        is_completed = True
        dialog_stage = "completed"
        # Удаляем [RESULT] секцию из ответа для кандидата
        bot_reply = ai_response.split("[RESULT]")[0].strip()
        if not bot_reply:
            bot_reply = "Спасибо! Я завершил анализ вашей заявки."
        
        relevance_percent = result_data["match_percent"]
        summary = result_data["summary_one_liner"]
        reasons = result_data["reasons"]
    else:
        # Диалог продолжается, нужны уточнения
        is_completed = False
        dialog_stage = "questioning"
        bot_reply = ai_response.strip()
        relevance_percent = 50  # Предварительная оценка
        summary = "Идет уточнение деталей"
        reasons = ["Требуется дополнительная информация"]
    
    # Сохраняем сессию
    messages.append({"role": "assistant", "content": ai_response})
    sessions_store[session_id] = {
        "session_id": session_id,
        "vacancy_text": request.vacancy_text,
        "cv_text": request.cv_text,
        "messages": messages,
        "question_count": 0,
        "is_completed": is_completed,
        "relevance_percent": relevance_percent,
        "summary": summary,
        "reasons": reasons,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    save_sessions(sessions_store)
    
    return ChatResponse(
        session_id=session_id,
        bot_reply=bot_reply,
        relevance_percent=relevance_percent,
        reasons=reasons,
        summary_for_employer=summary,
        dialog_stage=dialog_stage,
        is_completed=is_completed
    )

@app.post("/chat/turn", response_model=ChatResponse)
async def chat_turn(request: ChatTurnRequest):
    """
    Продолжает диалог с кандидатом
    
    1. Получает ответ кандидата
    2. Анализирует и задает следующий вопрос или завершает диалог
    3. Обновляет оценку релевантности
    """
    # Проверяем существование сессии
    if request.session_id not in sessions_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions_store[request.session_id]
    
    # Проверяем, не завершен ли уже диалог
    if session.get("is_completed", False):
        return ChatResponse(
            session_id=request.session_id,
            bot_reply="Спасибо! Анализ уже завершен.",
            relevance_percent=session["relevance_percent"],
            reasons=session["reasons"],
            summary_for_employer=session["summary"],
            dialog_stage="completed",
            is_completed=True
        )
    
    # Добавляем сообщение кандидата
    session["messages"].append({
        "role": "user",
        "content": request.message_from_candidate
    })
    session["question_count"] = session.get("question_count", 0) + 1
    
    # Проверяем, не достигли ли лимита вопросов
    if session["question_count"] >= 8:
        # Принудительно завершаем диалог
        force_completion_msg = "Кандидат ответил на все вопросы. Теперь ОБЯЗАТЕЛЬНО выдай [RESULT] с финальной оценкой."
        session["messages"].append({
            "role": "system",
            "content": force_completion_msg
        })
    
    # Вызываем OpenAI
    ai_response = call_openai(session["messages"], max_tokens=800)
    
    # Проверяем, есть ли [RESULT] в ответе
    result_data = extract_result_from_message(ai_response)
    print(f"🔍 [DEBUG] session_id={request.session_id}, question_count={session['question_count']}, result_data={result_data is not None}")
    
    rejection_tags = []
    
    if result_data or session["question_count"] >= 8:
        # Диалог завершен
        is_completed = True
        dialog_stage = "completed"
        
        if result_data:
            relevance_percent = result_data["match_percent"]
            summary = result_data["summary_one_liner"]
            reasons = result_data["reasons"]
            rejection_tags = result_data.get("rejection_tags", [])
            bot_reply = ai_response.split("[RESULT]")[0].strip()
            if not bot_reply:
                bot_reply = "Спасибо за ответы! Я завершил анализ."
            print(f"✅ [RESULT] found: {relevance_percent}% - {summary}, tags: {rejection_tags}")
        else:
            # Принудительное завершение без [RESULT]
            relevance_percent = 60
            summary = "Кандидат ответил на вопросы, требуется дополнительная оценка"
            reasons = ["Диалог завершен по лимиту вопросов"]
            rejection_tags = []
            bot_reply = "Спасибо за развернутые ответы! Я передам информацию работодателю."
            print(f"⚠️ Forced completion without [RESULT], using default: {relevance_percent}%")
        
        session["is_completed"] = True
    else:
        # Диалог продолжается
        is_completed = False
        dialog_stage = "questioning"
        bot_reply = ai_response.strip()
        relevance_percent = session.get("relevance_percent", 50)
        summary = session.get("summary", "Идет уточнение деталей")
        reasons = session.get("reasons", ["Требуется дополнительная информация"])
    
    # Определяем, нужно ли предложить альтернативную вакансию
    suggest_alternative = False
    alternative_reason = None
    if is_completed and relevance_percent < 50:
        # Если соответствие низкое, предлагаем альтернативу
        suggest_alternative = True
        alternative_reason = f"Соответствие текущей вакансии составляет {relevance_percent}%. Возможно, у компании есть более подходящие позиции."
        print(f"💡 Low match ({relevance_percent}%), suggesting alternative vacancy")
    
    # Генерируем детальный анализ при завершении диалога
    detailed_analysis = ""
    if is_completed:
        print("📊 Generating detailed analysis...")
        detailed_prompt = f"""На основе диалога с кандидатом, создай детальный анализ в формате:

**СИЛЬНЫЕ СТОРОНЫ:**
- [перечисли 3-5 сильных сторон кандидата с примерами из ответов]

**ОБЛАСТИ ДЛЯ РАЗВИТИЯ:**
- [перечисли 2-3 области, где кандидат может улучшиться]

**СООТВЕТСТВИЕ ВАКАНСИИ:**
- Ключевые навыки: [анализ соответствия требуемым навыкам]
- Опыт работы: [оценка релевантного опыта]
- Мотивация: [оценка заинтересованности кандидата]

**РЕКОМЕНДАЦИИ:**
[2-3 конкретные рекомендации для работодателя]

**ОБЩАЯ ОЦЕНКА:** {relevance_percent}%

Вакансия: {session.get('vacancy_text', '')[:500]}
Резюме: {session.get('cv_text', '')[:500]}
Ответы кандидата: {' '.join([m['content'] for m in session['messages'] if m['role'] == 'user'][:5])}
"""
        
        try:
            detailed_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Ты HR-аналитик, создающий детальные отчеты о кандидатах."},
                    {"role": "user", "content": detailed_prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            detailed_analysis = detailed_response.choices[0].message.content.strip()
            print(f"✅ Detailed analysis generated: {len(detailed_analysis)} chars")
        except Exception as e:
            print(f"❌ Error generating detailed analysis: {e}")
            detailed_analysis = f"**КРАТКИЙ АНАЛИЗ:** {summary}\n\n**РЕЛЕВАНТНОСТЬ:** {relevance_percent}%\n\n**ПРИЧИНЫ:** {', '.join(reasons)}"
    
    # Обновляем сессию
    session["messages"].append({"role": "assistant", "content": ai_response})
    session["relevance_percent"] = relevance_percent
    session["summary"] = summary
    session["reasons"] = reasons
    session["rejection_tags"] = rejection_tags
    session["detailed_analysis"] = detailed_analysis
    session["updated_at"] = datetime.utcnow().isoformat()
    save_sessions(sessions_store)
    
    return ChatResponse(
        session_id=request.session_id,
        bot_reply=bot_reply,
        relevance_percent=relevance_percent,
        reasons=reasons,
        rejection_tags=rejection_tags,
        summary_for_employer=summary,
        dialog_stage=dialog_stage,
        is_completed=is_completed,
        detailed_analysis=detailed_analysis if is_completed else None,
        suggest_alternative_vacancy=suggest_alternative,
        alternative_vacancy_reason=alternative_reason
    )

@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Получить информацию о сессии"""
    if session_id not in sessions_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions_store[session_id]
    return {
        "session_id": session_id,
        "vacancy_text": session.get("vacancy_text", ""),
        "cv_text": session.get("cv_text", ""),
        "question_count": session.get("question_count", 0),
        "is_completed": session.get("is_completed", False),
        "relevance_percent": session.get("relevance_percent", 0),
        "summary": session.get("summary", ""),
        "reasons": session.get("reasons", []),
        "created_at": session.get("created_at"),
        "updated_at": session.get("updated_at"),
        "message_count": len(session.get("messages", []))
    }

@app.get("/sessions")
async def list_sessions():
    """Получить список всех сессий"""
    return {
        "sessions": [
            {
                "session_id": sid,
                "is_completed": session.get("is_completed", False),
                "relevance_percent": session.get("relevance_percent", 0),
                "question_count": session.get("question_count", 0),
                "created_at": session.get("created_at"),
                "updated_at": session.get("updated_at")
            }
            for sid, session in sessions_store.items()
        ],
        "total": len(sessions_store)
    }

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Удалить сессию"""
    if session_id not in sessions_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions_store[session_id]
    save_sessions(sessions_store)
    
    return {"message": "Session deleted successfully"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )

