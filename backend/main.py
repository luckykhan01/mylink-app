from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import get_db, engine
from models import Base, UserRole
from schemas import (
    VacancyCreate, VacancyUpdate, VacancyResponse, VacancyListResponse,
    UserCreate, UserUpdate, UserResponse, UserListResponse, UserLogin,
    JobApplicationCreate, JobApplicationUpdate, JobApplicationResponse
)
from crud import (
    get_vacancy, get_vacancies, create_vacancy, 
    update_vacancy, delete_vacancy, get_companies, get_locations,
    create_job_application, get_job_applications, update_job_application
)
from user_crud import (
    get_user, get_user_by_email, get_users, create_user,
    update_user, delete_user, authenticate_user
)
from auth import create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

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
async def create_vacancy_endpoint(
    vacancy: VacancyCreate, 
    employer_id: int = Query(description="ID работодателя"),
    db: Session = Depends(get_db)
):
    """Создать новую вакансию"""
    return create_vacancy(db, vacancy, employer_id)

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

# ===== ЭНДПОИНТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ =====

@app.post("/auth/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    try:
        return create_user(db, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Вход пользователя"""
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/users", response_model=UserListResponse)
async def get_users_list(
    page: int = Query(1, ge=1, description="Номер страницы"),
    per_page: int = Query(10, ge=1, le=100, description="Количество пользователей на странице"),
    role: Optional[UserRole] = Query(None, description="Фильтр по роли"),
    is_active: Optional[bool] = Query(None, description="Фильтр по активности"),
    db: Session = Depends(get_db)
):
    """Получить список пользователей с фильтрацией"""
    skip = (page - 1) * per_page
    users, total = get_users(
        db=db,
        skip=skip,
        limit=per_page,
        role=role,
        is_active=is_active
    )
    
    total_pages = (total + per_page - 1) // per_page
    
    return UserListResponse(
        users=users,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Получить пользователя по ID"""
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: int, 
    user: UserUpdate, 
    db: Session = Depends(get_db)
):
    """Обновить пользователя"""
    updated_user = update_user(db, user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return updated_user

@app.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    """Удалить пользователя"""
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"message": "Пользователь успешно удален"}

# ===== ЭНДПОИНТЫ ДЛЯ ЗАЯВОК НА РАБОТУ =====

@app.post("/applications", response_model=JobApplicationResponse)
async def create_job_application_endpoint(
    application: JobApplicationCreate,
    job_seeker_id: int = Query(description="ID соискателя"),
    db: Session = Depends(get_db)
):
    """Создать заявку на работу"""
    application_data = application.dict()
    return create_job_application(db, application_data, job_seeker_id)

@app.get("/applications")
async def get_job_applications_list(
    page: int = Query(1, ge=1, description="Номер страницы"),
    per_page: int = Query(10, ge=1, le=100, description="Количество заявок на странице"),
    job_seeker_id: Optional[int] = Query(None, description="Фильтр по соискателю"),
    vacancy_id: Optional[int] = Query(None, description="Фильтр по вакансии"),
    status: Optional[str] = Query(None, description="Фильтр по статусу"),
    db: Session = Depends(get_db)
):
    """Получить список заявок на работу"""
    skip = (page - 1) * per_page
    applications, total = get_job_applications(
        db=db,
        skip=skip,
        limit=per_page,
        job_seeker_id=job_seeker_id,
        vacancy_id=vacancy_id,
        status=status
    )
    
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "applications": applications,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@app.put("/applications/{application_id}", response_model=JobApplicationResponse)
async def update_job_application_endpoint(
    application_id: int,
    application: JobApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Обновить заявку на работу"""
    application_data = application.dict(exclude_unset=True)
    updated_application = update_job_application(db, application_id, application_data)
    if not updated_application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return updated_application

if __name__ == "__main__":
    # Запуск сервера
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Автоматическая перезагрузка при изменении кода
        log_level="info"
    )
