import os
import uuid
import json
import pickle
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from pathlib import Path

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in environment (.env)")

client = OpenAI(api_key=OPENAI_API_KEY)
app = FastAPI(title="AI Assistant (CV↔Vacancy)", version="0.1.0")

# Система embeddings для семантического поиска
EMBEDDINGS_CACHE_FILE = Path("embeddings_cache.pkl")
SIMILARITY_THRESHOLD = 0.8  # Порог схожести для синонимов

class EmbeddingsManager:
    def __init__(self):
        self.cache = self._load_cache()
        self.embedding_model = "text-embedding-3-small"
    
    def _load_cache(self) -> Dict[str, np.ndarray]:
        """Загружает кэш embeddings"""
        if EMBEDDINGS_CACHE_FILE.exists():
            try:
                with open(EMBEDDINGS_CACHE_FILE, 'rb') as f:
                    return pickle.load(f)
            except:
                return {}
        return {}
    
    def _save_cache(self):
        """Сохраняет кэш embeddings"""
        with open(EMBEDDINGS_CACHE_FILE, 'wb') as f:
            pickle.dump(self.cache, f)
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Получает embedding для текста"""
        if text in self.cache:
            return self.cache[text]
        
        try:
            response = client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            embedding = np.array(response.data[0].embedding)
            self.cache[text] = embedding
            self._save_cache()
            return embedding
        except Exception as e:
            print(f"Error getting embedding for '{text}': {e}")
            return np.zeros(1536)  # Размер embedding для text-embedding-3-small
    
    def are_similar(self, text1: str, text2: str) -> bool:
        """Проверяет, являются ли два текста семантически похожими"""
        if not text1 or not text2:
            return False
        
        # Нормализация
        text1 = text1.strip().lower()
        text2 = text2.strip().lower()
        
        # Точное совпадение
        if text1 == text2:
            return True
        
        # Семантическое сравнение
        emb1 = self.get_embedding(text1)
        emb2 = self.get_embedding(text2)
        
        similarity = cosine_similarity([emb1], [emb2])[0][0]
        return similarity >= SIMILARITY_THRESHOLD
    
    def find_best_match(self, target: str, candidates: List[str]) -> Optional[str]:
        """Находит лучший семантический матч среди кандидатов"""
        if not target or not candidates:
            return None
        
        target_emb = self.get_embedding(target.strip().lower())
        best_match = None
        best_similarity = 0
        
        for candidate in candidates:
            if not candidate:
                continue
                
            candidate_emb = self.get_embedding(candidate.strip().lower())
            similarity = cosine_similarity([target_emb], [candidate_emb])[0][0]
            
            if similarity > best_similarity and similarity >= SIMILARITY_THRESHOLD:
                best_similarity = similarity
                best_match = candidate
        
        return best_match

# Глобальный менеджер embeddings
embeddings_manager = EmbeddingsManager()

# --- CORS для фронта/бэка (добавь сюда свои домены) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS: Dict[str, Dict[str, Any]] = {}

class Candidate(BaseModel):
    full_name: Optional[str] = None
    city: Optional[str] = None
    experience_years: Optional[float] = Field(None, ge=0)
    position: Optional[str] = None
    education: Optional[str] = None
    languages: List[str] = Field(default_factory=list)
    salary_expectation: Optional[int] = Field(None, ge=0)
    employment_type: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    seniority: Optional[str] = None
    source_text: Optional[str] = None

class Vacancy(BaseModel):
    title: Optional[str] = None
    city: Optional[str] = None
    min_experience_years: Optional[float] = Field(None, ge=0)
    required_position: Optional[str] = None
    education_required: Optional[str] = None
    languages_required: List[str] = Field(default_factory=list)
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    employment_type: Optional[str] = None
    must_have_skills: List[str] = Field(default_factory=list)
    nice_to_have_skills: List[str] = Field(default_factory=list)
    seniority: Optional[str] = None
    source_text: Optional[str] = None

    @field_validator("salary_max")
    @classmethod
    def check_salary(cls, v, info):
        if v is not None and info.data.get("salary_min") is not None and v < info.data["salary_min"]:
            raise ValueError("salary_max must be >= salary_min")
        return v

class ParseRequest(BaseModel):
    text: str
    kind: str  # "cv" | "vacancy"

class AnalyzeRequest(BaseModel):
    cv: Optional[Candidate] = None
    vacancy: Optional[Vacancy] = None
    cv_text: Optional[str] = None
    vacancy_text: Optional[str] = None
    session_id: Optional[str] = None

class AnalyzeResult(BaseModel):
    session_id: str
    relevance_percent: int
    reasons: List[str]
    mismatches: Dict[str, Dict[str, Any]]
    followup_questions: List[str]
    candidate: Candidate
    vacancy: Vacancy
    summary_for_employer: str

class ChatTurn(BaseModel):
    session_id: str
    message_from_candidate: str

class ChatResult(BaseModel):
    session_id: str
    bot_replies: List[str]
    relevance_percent: int
    reasons: List[str]
    summary_for_employer: str

def _structured_extract(schema_name: str, schema: Dict[str, Any], prompt: str) -> Dict[str, Any]:
    # Улучшенный системный промпт
    system_prompt = f"""Ты - эксперт по анализу резюме и вакансий. Твоя задача - точно извлечь структурированную информацию из текста.

ВАЖНЫЕ ПРИНЦИПЫ:
1. Будь максимально точным и внимательным к деталям
2. Если информация отсутствует, используй null или пустые значения
3. Для массивов (навыки, языки) извлекай все упомянутые элементы
4. Для чисел (опыт, зарплата) извлекай точные значения
5. Нормализуй данные (например, "full-time" → "фуллтайм")
6. Учитывай контекст и синонимы

ПРАВИЛА ИЗВЛЕЧЕНИЯ:
- Опыт работы: извлекай в годах (float), например 2.5 лет
- Зарплата: извлекай в числовом формате без валюты
- Навыки: извлекай все упомянутые технологии и инструменты
- Языки: извлекай все упомянутые языки с уровнем (если указан)
- Тип занятости: нормализуй к стандартным формам (фуллтайм, парттайм, фриланс, контракт)

Верни результат строго в формате JSON согласно схеме."""

    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_schema", "json_schema": {"name": schema_name, "schema": schema}},
        temperature=0.1,  # Низкая температура для более точного извлечения
    )
    import json
    return json.loads(resp.choices[0].message.content)

def extract_candidate(text: str) -> Candidate:
    schema = {
        "type": "object",
        "properties": {
            "full_name": {"type": "string"},
            "city": {"type": "string"},
            "experience_years": {"type": "number"},
            "position": {"type": "string"},
            "education": {"type": "string"},
            "languages": {"type": "array", "items": {"type": "string"}},
            "salary_expectation": {"type": "integer"},
            "employment_type": {"type": "string"},
            "skills": {"type": "array", "items": {"type": "string"}},
            "seniority": {"type": "string"}
        },
        "required": [],
        "additionalProperties": False
    }
    prompt = f"""Проанализируй резюме кандидата и извлеки структурированную информацию.

ТЕКСТ РЕЗЮМЕ:
{text}

ИНСТРУКЦИИ ПО ИЗВЛЕЧЕНИЮ:
1. Полное имя: извлеки ФИО если указано
2. Город: извлеки город проживания/работы
3. Опыт работы: количество лет опыта (float, например 2.5)
4. Позиция: должность/специальность
5. Образование: уровень образования, вуз, специальность
6. Языки: все упомянутые языки с уровнем (например, "английский B2")
7. Зарплата: ожидаемая зарплата в числовом формате
8. Тип занятости: фуллтайм/парттайм/фриланс/контракт/стажировка
9. Навыки: все технологии, инструменты, фреймворки
10. Уровень: junior/middle/senior/lead

Если какая-то информация не указана, используй null."""
    data = _structured_extract("candidate_schema", schema, prompt)
    return Candidate(**data, source_text=text)

def extract_vacancy(text: str) -> Vacancy:
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "city": {"type": "string"},
            "min_experience_years": {"type": "number"},
            "required_position": {"type": "string"},
            "education_required": {"type": "string"},
            "languages_required": {"type": "array", "items": {"type": "string"}},
            "salary_min": {"type": "integer"},
            "salary_max": {"type": "integer"},
            "employment_type": {"type": "string"},
            "must_have_skills": {"type": "array", "items": {"type": "string"}},
            "nice_to_have_skills": {"type": "array", "items": {"type": "string"}},
            "seniority": {"type": "string"}
        },
        "required": [],
        "additionalProperties": False
    }
    prompt = f"""Проанализируй описание вакансии и извлеки структурированную информацию.

ТЕКСТ ВАКАНСИИ:
{text}

ИНСТРУКЦИИ ПО ИЗВЛЕЧЕНИЮ:
1. Название: заголовок вакансии
2. Город: город работы
3. Минимальный опыт: минимальные требования к опыту в годах (float)
4. Требуемая позиция: должность/специальность
5. Образование: требования к образованию
6. Языки: требуемые языки с уровнем
7. Зарплата: диапазон зарплаты (min и max в числовом формате)
8. Тип занятости: фуллтайм/парттайм/фриланс/контракт/стажировка
9. Обязательные навыки: ключевые технологии и инструменты
10. Желательные навыки: дополнительные навыки (nice to have)
11. Уровень: junior/middle/senior/lead

Если какая-то информация не указана, используй null."""
    data = _structured_extract("vacancy_schema", schema, prompt)
    return Vacancy(**data, source_text=text)

def _semantic_normalize(text: str) -> str:
    """Семантическая нормализация с использованием embeddings"""
    if not text:
        return ""
    
    # Базовая нормализация
    normalized = text.strip().lower()
    
    # Стандартные формы для нормализации
    standard_forms = {
        # Типы занятости
        "employment": {
            "фуллтайм": ["full-time", "full time", "полная занятость", "полный рабочий день", "fulltime"],
            "парттайм": ["part-time", "part time", "частичная занятость", "неполный рабочий день", "parttime"],
            "контракт": ["contract", "договор", "контрактная работа"],
            "фриланс": ["freelance", "удаленная работа", "remote", "удаленка", "удаленно"],
            "стажировка": ["internship", "стажер", "стажировка", "intern"]
        },
        # Позиции
        "position": {
            "backend": ["back-end", "бэкенд", "бэк-энд", "backend developer", "backend разработчик"],
            "frontend": ["front-end", "фронтенд", "фронт-энд", "frontend developer", "frontend разработчик"],
            "fullstack": ["full-stack", "фуллстек", "full stack", "fullstack developer"],
            "devops": ["dev ops", "dev-ops", "системный администратор", "сисадмин"],
            "data scientist": ["data science", "дата саентист", "аналитик данных"],
            "mobile": ["мобильная разработка", "mobile developer", "ios", "android"],
            "qa": ["quality assurance", "тестировщик", "qa engineer", "тестирование"]
        }
    }
    
    # Попытка найти семантический матч
    for category, forms in standard_forms.items():
        for standard_form, variants in forms.items():
            if embeddings_manager.are_similar(normalized, standard_form):
                return standard_form
            for variant in variants:
                if embeddings_manager.are_similar(normalized, variant):
                    return standard_form
    
    return normalized

def _norm(s: Optional[str]) -> str:
    """Простая нормализация для обратной совместимости"""
    return (s or "").strip().lower()

def score_and_mismatches(c: Candidate, v: Vacancy) -> Tuple[int, Dict[str, Dict[str, Any]], List[str]]:
    weights = {"city":0.15,"experience":0.2,"position":0.15,"education":0.1,"languages":0.15,"salary":0.1,"employment_type":0.05,"skills":0.1}
    score = 0.0; mismatches: Dict[str, Dict[str, Any]] = {}; reasons: List[str] = []

    if v.city and c.city:
        if embeddings_manager.are_similar(c.city, v.city): score+=weights["city"]
        else:
            mismatches["city"]={"expected":v.city,"actual":c.city}
            reasons.append(f"Город отличается: вакансия — {v.city}, кандидат — {c.city}.")

    if v.min_experience_years is not None and c.experience_years is not None:
        if c.experience_years >= v.min_experience_years: score+=weights["experience"]
        else:
            mismatches["experience"]={"expected_min_years":v.min_experience_years,"actual_years":c.experience_years}
            reasons.append(f"Опыт меньше требуемого: нужно от {v.min_experience_years} лет, у кандидата {c.experience_years}.")

    if v.required_position and c.position:
        if embeddings_manager.are_similar(v.required_position, c.position): score+=weights["position"]
        else:
            mismatches["position"]={"expected":v.required_position,"actual":c.position}
            reasons.append(f"Должность отличается: требуется {v.required_position}, указано {c.position}.")

    if v.education_required and c.education:
        if _norm(v.education_required) in _norm(c.education): score+=weights["education"]
        else:
            mismatches["education"]={"expected":v.education_required,"actual":c.education}
            reasons.append(f"Образование не совпадает: требуется {v.education_required}, у кандидата {c.education}.")

    if v.languages_required:
        cand = {_norm(x) for x in c.languages}
        req = {_norm(x) for x in v.languages_required}
        if req.issubset(cand): score+=weights["languages"]
        else:
            missing = list(req - cand)
            mismatches["languages"]={"missing":missing,"candidate":list(cand)}
            reasons.append(f"Не хватает языков: {', '.join(missing)}.")

    if c.salary_expectation is not None and (v.salary_min is not None or v.salary_max is not None):
        fits=True
        if v.salary_max is not None and c.salary_expectation>v.salary_max: fits=False
        if v.salary_min is not None and c.salary_expectation<v.salary_min: fits=False
        if fits: score+=weights["salary"]
        else:
            mismatches["salary"]={"vacancy_range":[v.salary_min,v.salary_max],"candidate":c.salary_expectation}
            reasons.append("Ожидания по зарплате выходят за пределы диапазона вакансии.")

    if v.employment_type and c.employment_type:
        if embeddings_manager.are_similar(v.employment_type, c.employment_type): score+=weights["employment_type"]
        else:
            mismatches["employment_type"]={"expected":v.employment_type,"actual":c.employment_type}
            reasons.append(f"Формат занятости: требуется {v.employment_type}, у кандидата {c.employment_type}.")

    if v.must_have_skills:
        missing_skills = []
        for required_skill in v.must_have_skills:
            # Ищем семантический матч среди навыков кандидата
            found_match = False
            for candidate_skill in c.skills:
                if embeddings_manager.are_similar(required_skill, candidate_skill):
                    found_match = True
                    break
            
            if not found_match:
                missing_skills.append(required_skill)
        
        if not missing_skills: score+=weights["skills"]
        else:
            mismatches["skills"]={"missing":missing_skills}
            reasons.append(f"Не хватает ключевых навыков: {', '.join(missing_skills)}.")

    return int(round(score*100)), mismatches, reasons

def make_followups(mismatches: Dict[str, Dict[str, Any]]) -> List[str]:
    context = "\n".join([f"{k}: {v}" for k,v in mismatches.items()]) if mismatches else "нет расхождений"
    
    system_prompt = """Ты — опытный HR-специалист и рекрутер. Твоя задача - сформулировать уточняющие вопросы кандидату.

ПРИНЦИПЫ РАБОТЫ:
1. Будь дружелюбным и профессиональным
2. Задавай конкретные вопросы по расхождениям
3. Не дави на кандидата, а помогай раскрыть потенциал
4. Учитывай контекст и возможности развития
5. Максимум 5 вопросов, по одному на каждое расхождение

СТИЛЬ ВОПРОСОВ:
- Конструктивные и поддерживающие
- Направленные на понимание ситуации
- Дающие кандидату возможность объяснить
- Помогающие оценить потенциал развития"""

    user_msg = f"""Проанализируй расхождения между резюме кандидата и требованиями вакансии и сформулируй уточняющие вопросы.

РАСХОЖДЕНИЯ:
{context}

Сформулируй 3-5 уточняющих вопросов, которые помогут:
1. Понять причины расхождений
2. Оценить потенциал кандидата
3. Выяснить возможности развития
4. Принять обоснованное решение

Верни результат в формате JSON: {{"questions": ["вопрос1", "вопрос2", ...]}}"""

    schema = {"type":"object","properties":{"questions":{"type":"array","items":{"type":"string"}}},"required":["questions"],"additionalProperties":False}
    import json
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role":"system","content":system_prompt},{"role":"user","content":user_msg}],
        response_format={"type":"json_schema","json_schema":{"name":"followups","schema":schema}},
        temperature=0.3
    )
    data = json.loads(resp.choices[0].message.content)
    return data.get("questions", [])[:5]

def employer_summary(c: Candidate, v: Vacancy, relevance: int, reasons: List[str]) -> str:
    base = [
        f"Релевантность: {relevance}%.",
        f"Кандидат: {c.full_name or '—'}, позиция: {c.position or '—'}, город: {c.city or '—'}.",
        f"Опыт: {c.experience_years if c.experience_years is not None else '—'} лет; образование: {c.education or '—'}."
    ]
    base.append("Причины несоответствий: " + "; ".join(reasons) if reasons else "Существенных несоответствий не выявлено.")
    return " ".join(base)

@app.post("/parse")
def parse_endpoint(req: ParseRequest):
    if req.kind not in ("cv","vacancy"):
        raise HTTPException(400, "kind must be 'cv' or 'vacancy'")
    return {"candidate": extract_candidate(req.text).dict()} if req.kind=="cv" else {"vacancy": extract_vacancy(req.text).dict()}

@app.post("/analyze", response_model=AnalyzeResult)
def analyze(req: AnalyzeRequest):
    candidate = req.cv or (extract_candidate(req.cv_text) if req.cv_text else None)
    vacancy   = req.vacancy or (extract_vacancy(req.vacancy_text) if req.vacancy_text else None)
    if not candidate or not vacancy:
        raise HTTPException(400, "Provide (cv or cv_text) AND (vacancy or vacancy_text)")
    relevance, mismatches, reasons = score_and_mismatches(candidate, vacancy)
    questions = make_followups(mismatches)
    summary = employer_summary(candidate, vacancy, relevance, reasons)

    session_id = req.session_id or str(uuid.uuid4())
    SESSIONS.setdefault(session_id, {"created_at": datetime.utcnow().isoformat(), "candidate": candidate.dict(), "vacancy": vacancy.dict(), "chat":[]})
    SESSIONS[session_id]["last_analysis"] = {"relevance":relevance,"mismatches":mismatches,"reasons":reasons,"summary":summary,"questions":questions}

    return AnalyzeResult(
        session_id=session_id,
        relevance_percent=relevance,
        reasons=reasons,
        mismatches=mismatches,
        followup_questions=questions,
        candidate=candidate,
        vacancy=vacancy,
        summary_for_employer=summary
    )

@app.post("/chat/turn", response_model=ChatResult)
def chat_turn(turn: ChatTurn):
    sess = SESSIONS.get(turn.session_id)
    if not sess: raise HTTPException(404, "session_id not found")
    sess["chat"].append({"role":"candidate","text":turn.message_from_candidate,"ts":datetime.utcnow().isoformat()})
    c = Candidate(**sess["candidate"]); v = Vacancy(**sess["vacancy"])
    relevance, mismatches, reasons = score_and_mismatches(c, v)
    questions = make_followups(mismatches)
    summary = employer_summary(c, v, relevance, reasons)
    bot_replies = questions[:2] if questions else ["Спасибо! Уточнений больше нет."]
    for q in bot_replies:
        sess["chat"].append({"role":"bot","text":q,"ts":datetime.utcnow().isoformat()})
    sess["last_analysis"] = {"relevance":relevance,"mismatches":mismatches,"reasons":reasons,"summary":summary,"questions":questions}
    return ChatResult(session_id=turn.session_id, bot_replies=bot_replies, relevance_percent=relevance, reasons=reasons, summary_for_employer=summary)

@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    sess = SESSIONS.get(session_id)
    if not sess: raise HTTPException(404, "session not found")
    return sess
