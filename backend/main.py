from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import get_db, engine
from models import Base
from schemas import VacancyCreate, VacancyUpdate, VacancyResponse, VacancyListResponse
from crud import (
    get_vacancy, get_vacancies, create_vacancy, 
    update_vacancy, delete_vacancy, get_companies, get_locations
)

# Создаем экземпляр FastAPI приложения
app = FastAPI(
    title="MyLink API",
    description="API сервер для приложения MyLink - сайт вакансий",
    version="1.0.0"
)

# Создаем таблицы в базе данных
Base.metadata.create_all(bind=engine)

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене лучше указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Базовый маршрут
@app.get("/")
async def root():
    return {"message": "Добро пожаловать в MyLink API!", "status": "running"}

# Маршрут для проверки здоровья сервера
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Сервер работает корректно"}

# Маршрут для получения информации о API
@app.get("/info")
async def api_info():
    return {
        "name": "MyLink API",
        "version": "1.0.0",
        "description": "API сервер для приложения MyLink",
        "endpoints": [
            {"path": "/", "method": "GET", "description": "Главная страница"},
            {"path": "/health", "method": "GET", "description": "Проверка здоровья сервера"},
            {"path": "/info", "method": "GET", "description": "Информация об API"},
            {"path": "/docs", "method": "GET", "description": "Swagger документация"},
            {"path": "/redoc", "method": "GET", "description": "ReDoc документация"}
        ]
    }

# Пример маршрута с параметрами
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    return {"user_id": user_id, "name": f"Пользователь {user_id}"}

# Пример POST маршрута
@app.post("/users")
async def create_user(user_data: dict):
    return {"message": "Пользователь создан", "data": user_data}

# ===== ЭНДПОИНТЫ ДЛЯ ВАКАНСИЙ =====

@app.get("/vacancies", response_model=VacancyListResponse)
async def get_vacancies_list(
    page: int = Query(1, ge=1, description="Номер страницы"),
    per_page: int = Query(10, ge=1, le=100, description="Количество вакансий на странице"),
    search: Optional[str] = Query(None, description="Поиск по тексту"),
    company: Optional[str] = Query(None, description="Фильтр по компании"),
    location: Optional[str] = Query(None, description="Фильтр по локации"),
    experience_level: Optional[str] = Query(None, description="Уровень опыта"),
    remote_work: Optional[bool] = Query(None, description="Удаленная работа"),
    db: Session = Depends(get_db)
):
    """Получить список вакансий с фильтрацией и пагинацией"""
    skip = (page - 1) * per_page
    vacancies, total = get_vacancies(
        db=db,
        skip=skip,
        limit=per_page,
        search=search,
        company=company,
        location=location,
        experience_level=experience_level,
        remote_work=remote_work
    )
    
    total_pages = (total + per_page - 1) // per_page
    
    return VacancyListResponse(
        vacancies=vacancies,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@app.get("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def get_vacancy_by_id(vacancy_id: int, db: Session = Depends(get_db)):
    """Получить вакансию по ID"""
    vacancy = get_vacancy(db, vacancy_id)
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    return vacancy

@app.post("/vacancies", response_model=VacancyResponse)
async def create_vacancy_endpoint(vacancy: VacancyCreate, db: Session = Depends(get_db)):
    """Создать новую вакансию"""
    return create_vacancy(db, vacancy)

@app.put("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def update_vacancy_endpoint(
    vacancy_id: int, 
    vacancy: VacancyUpdate, 
    db: Session = Depends(get_db)
):
    """Обновить вакансию"""
    updated_vacancy = update_vacancy(db, vacancy_id, vacancy)
    if not updated_vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    return updated_vacancy

@app.delete("/vacancies/{vacancy_id}")
async def delete_vacancy_endpoint(vacancy_id: int, db: Session = Depends(get_db)):
    """Удалить вакансию"""
    success = delete_vacancy(db, vacancy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    return {"message": "Вакансия успешно удалена"}

@app.get("/vacancies/companies")
async def get_companies_list(db: Session = Depends(get_db)):
    """Получить список всех компаний"""
    return {"companies": get_companies(db)}

@app.get("/vacancies/locations")
async def get_locations_list(db: Session = Depends(get_db)):
    """Получить список всех локаций"""
    return {"locations": get_locations(db)}

if __name__ == "__main__":
    # Запуск сервера
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Автоматическая перезагрузка при изменении кода
        log_level="info"
    )
