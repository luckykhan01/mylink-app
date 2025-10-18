from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

    class Config:
        from_attributes = True

class VacancyListResponse(BaseModel):
    vacancies: list[VacancyResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
