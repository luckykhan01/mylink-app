from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from models import Vacancy
from schemas import VacancyCreate, VacancyUpdate

def get_vacancy(db: Session, vacancy_id: int) -> Optional[Vacancy]:
    return db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()

def get_vacancies(
    db: Session, 
    skip: int = 0, 
    limit: int = 10,
    search: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    remote_work: Optional[bool] = None,
    is_active: bool = True
) -> tuple[List[Vacancy], int]:
    query = db.query(Vacancy)
    
    # Фильтр по активности
    if is_active is not None:
        query = query.filter(Vacancy.is_active == is_active)
    
    # Поиск по тексту
    if search:
        search_filter = or_(
            Vacancy.title.ilike(f"%{search}%"),
            Vacancy.description.ilike(f"%{search}%"),
            Vacancy.requirements.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Фильтр по компании
    if company:
        query = query.filter(Vacancy.company.ilike(f"%{company}%"))
    
    # Фильтр по локации
    if location:
        query = query.filter(Vacancy.location.ilike(f"%{location}%"))
    
    # Фильтр по уровню опыта
    if experience_level:
        query = query.filter(Vacancy.experience_level == experience_level)
    
    # Фильтр по удаленной работе
    if remote_work is not None:
        query = query.filter(Vacancy.remote_work == remote_work)
    
    # Получаем общее количество
    total = query.count()
    
    # Применяем пагинацию
    vacancies = query.offset(skip).limit(limit).all()
    
    return vacancies, total

def create_vacancy(db: Session, vacancy: VacancyCreate) -> Vacancy:
    db_vacancy = Vacancy(**vacancy.dict())
    db.add(db_vacancy)
    db.commit()
    db.refresh(db_vacancy)
    return db_vacancy

def update_vacancy(db: Session, vacancy_id: int, vacancy: VacancyUpdate) -> Optional[Vacancy]:
    db_vacancy = get_vacancy(db, vacancy_id)
    if not db_vacancy:
        return None
    
    update_data = vacancy.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vacancy, field, value)
    
    db.commit()
    db.refresh(db_vacancy)
    return db_vacancy

def delete_vacancy(db: Session, vacancy_id: int) -> bool:
    db_vacancy = get_vacancy(db, vacancy_id)
    if not db_vacancy:
        return False
    
    db.delete(db_vacancy)
    db.commit()
    return True

def get_companies(db: Session) -> List[str]:
    """Получить список всех компаний"""
    companies = db.query(Vacancy.company).distinct().all()
    return [company[0] for company in companies if company[0]]

def get_locations(db: Session) -> List[str]:
    """Получить список всех локаций"""
    locations = db.query(Vacancy.location).distinct().all()
    return [location[0] for location in locations if location[0]]
