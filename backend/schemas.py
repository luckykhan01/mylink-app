from pydantic import BaseModel, EmailStr
from typing import Optional, List
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

class JobApplicationCreate(JobApplicationBase):
    vacancy_id: int

class JobApplicationUpdate(BaseModel):
    cover_letter: Optional[str] = None
    status: Optional[str] = None

class JobApplicationResponse(JobApplicationBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    job_seeker_id: int
    vacancy_id: int

    class Config:
        from_attributes = True
