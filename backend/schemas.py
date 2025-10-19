from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import UserRole

class VacancyBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "RUB"
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    remote_work: bool = False
    is_active: bool = True

class VacancyCreate(VacancyBase):
    pass

class VacancyUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    remote_work: Optional[bool] = None
    is_active: Optional[bool] = None

class VacancyResponse(VacancyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    employer_id: int

    class Config:
        from_attributes = True

class VacancyListResponse(BaseModel):
    vacancies: list[VacancyResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

# ===== СХЕМЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ =====

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

# ===== СХЕМЫ ДЛЯ ЗАЯВОК НА РАБОТУ =====

class JobApplicationBase(BaseModel):
    cover_letter: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_content: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    vacancy_id: int

class JobApplicationUpdate(BaseModel):
    cover_letter: Optional[str] = None
    status: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_path: Optional[str] = None
    resume_content: Optional[str] = None

class JobApplicationResponse(JobApplicationBase):
    id: int
    status: str
    resume_path: Optional[str] = None
    rejection_tags: Optional[str] = None  # Теги причин отклонения (CSV)
    created_at: datetime
    updated_at: Optional[datetime] = None
    job_seeker_id: int
    vacancy_id: int

    class Config:
        from_attributes = True

# ===== СХЕМЫ ДЛЯ AI-АНАЛИЗА =====

class AIAnalysisRequest(BaseModel):
    cv_text: Optional[str] = None
    vacancy_text: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    session_id: str
    relevance_percent: int
    reasons: List[str]
    summary_for_employer: str
    bot_reply: Optional[str] = None  # Новый API - один вопрос
    dialog_stage: Optional[str] = None
    is_completed: Optional[bool] = False
    # Старые поля для обратной совместимости
    mismatches: Optional[Dict[str, Any]] = None
    followup_questions: Optional[List[str]] = None

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str

class ChatMessageResponse(BaseModel):
    session_id: str
    bot_reply: str  # Новый API - один ответ
    relevance_percent: int
    reasons: List[str]
    rejection_tags: List[str] = []  # Теги причин отклонения
    summary_for_employer: str
    dialog_stage: Optional[str] = None
    is_completed: Optional[bool] = False
    suggest_alternative_vacancy: Optional[bool] = False  # Предложить альтернативную вакансию
    alternative_vacancy_reason: Optional[str] = None  # Причина предложения
    # Старое поле для обратной совместимости
    bot_replies: Optional[List[str]] = None


# ===== СХЕМЫ ДЛЯ ЧАТА РАБОТОДАТЕЛЬ-КАНДИДАТ =====

class EmployerCandidateMessageCreate(BaseModel):
    content: str
    application_id: int

class EmployerCandidateMessageResponse(BaseModel):
    id: int
    content: str
    sender_type: str
    sender_id: int
    application_id: int
    created_at: datetime
    is_read: bool
    sender_name: Optional[str] = None  # Имя отправителя

    class Config:
        from_attributes = True


# ===== СХЕМЫ ДЛЯ ДЕЙСТВИЙ С ЗАЯВКАМИ =====

class ApplicationActionRequest(BaseModel):
    """Запрос на принятие/отклонение заявки"""
    action: str  # "accept" or "reject"
    message: Optional[str] = None  # Сообщение при принятии
