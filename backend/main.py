from fastapi import FastAPI, Depends, HTTPException, Query, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import uvicorn
from pathlib import Path
from datetime import datetime

from database import get_db, engine
from file_utils import extract_text_from_file
from models import Base, UserRole
from schemas import (
    VacancyCreate, VacancyUpdate, VacancyResponse, VacancyListResponse,
    UserCreate, UserUpdate, UserResponse, UserListResponse, UserLogin,
    JobApplicationCreate, JobApplicationUpdate, JobApplicationResponse,
    AIAnalysisRequest, AIAnalysisResponse, ChatMessageRequest, ChatMessageResponse
)
from ai_client import ai_client
from crud import (
    get_vacancy, get_vacancies, create_vacancy, 
    update_vacancy, delete_vacancy, get_companies, get_locations,
    create_job_application, get_job_applications, get_job_application, update_job_application
)
from user_crud import (
    get_user, get_users, create_user,
    update_user, delete_user, authenticate_user
)
from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
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

@app.post("/applications/{application_id}/upload-resume")
async def upload_resume(
    application_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Загрузить резюме для заявки"""
    # Проверяем существование заявки
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    # Проверяем тип файла
    allowed_types = ["application/pdf", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Неподдерживаемый тип файла. Разрешены: PDF, DOC, DOCX, TXT")
    
    # Проверяем размер файла (макс 10MB)
    file_content = await file.read()
    print(f"📁 Received file: {file.filename}, size: {len(file_content)} bytes, type: {file.content_type}")
    print(f"📁 First 20 bytes: {file_content[:20]}")
    
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл слишком большой. Максимальный размер: 10MB")
    
    # Создаем директорию для резюме если её нет
    upload_dir = Path("uploads/resumes")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Генерируем безопасное имя файла
    safe_filename = f"resume_{application_id}_{file.filename}"
    file_path = upload_dir / safe_filename
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Извлекаем текст из файла
    extracted_text = extract_text_from_file(file_path)
    
    if not extracted_text:
        # Если не удалось извлечь текст, используем заглушку
        extracted_text = f"Резюме загружено: {file.filename}. Текст не удалось извлечь автоматически."
    
    # Обновляем заявку с информацией о резюме
    update_data = {
        "resume_filename": file.filename,
        "resume_path": str(file_path),
        "resume_content": extracted_text
    }
    
    update_job_application(db, application_id, update_data)
    
    return {
        "message": "Резюме успешно загружено и обработано",
        "filename": file.filename,
        "application_id": application_id,
        "text_extracted": bool(extracted_text)
    }

# ===== ЭНДПОИНТЫ ДЛЯ AI-АНАЛИЗА =====

@app.post("/applications/{application_id}/analyze", response_model=AIAnalysisResponse)
async def analyze_application_with_ai(
    application_id: int,
    request: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Анализ заявки с помощью AI-ассистента"""
    # Получаем заявку
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    # Получаем вакансию
    vacancy = get_vacancy(db, application.vacancy_id)
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    
    # Подготавливаем тексты для анализа
    cv_text = request.cv_text or application.resume_content or application.cover_letter or ""
    vacancy_text = request.vacancy_text or f"{vacancy.title} - {vacancy.company}. {vacancy.description}"
    
    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Недостаточно информации о кандидате для анализа")
    
    try:
        # Вызываем AI-ассистента через новый API /chat/start
        analysis_result = await ai_client.start_chat(
            vacancy_text=vacancy_text,
            cv_text=cv_text,
            session_id=f"app_{application_id}"
        )
        
        return AIAnalysisResponse(**analysis_result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при анализе: {str(e)}")

@app.post("/applications/{application_id}/chat", response_model=ChatMessageResponse)
async def send_chat_message(
    application_id: int,
    request: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """Отправка сообщения в чат с кандидатом"""
    # Получаем заявку
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    try:
        # Отправляем сообщение в AI-ассистента
        chat_result = await ai_client.chat_turn(
            session_id=request.session_id,
            message=request.message
        )
        
        return ChatMessageResponse(**chat_result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при отправке сообщения: {str(e)}")

@app.get("/applications/{application_id}/session/{session_id}")
async def get_ai_session(
    application_id: int,
    session_id: str,
    db: Session = Depends(get_db)
):
    """Получение информации о сессии AI-анализа"""
    # Проверяем существование заявки
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    try:
        # Получаем информацию о сессии от AI-ассистента
        session_info = await ai_client.get_session(session_id)
        return session_info
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении сессии: {str(e)}")

# ===== ЭНДПОИНТЫ ДЛЯ СООБЩЕНИЙ =====

@app.post("/messages")
async def create_message(
    request: dict,
    db: Session = Depends(get_db)
):
    """Создать сообщение в чате"""
    application_id = request.get("application_id")
    sender_type = request.get("sender_type")
    content = request.get("content")
    
    if not application_id or not sender_type or not content:
        raise HTTPException(status_code=400, detail="Missing required fields: application_id, sender_type, content")
    
    # Проверяем существование заявки
    application = get_job_application(db, int(application_id))
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    # Создаем сообщение (пока просто возвращаем успех)
    # В будущем можно добавить сохранение в базу данных
    return {
        "id": f"msg_{int(datetime.utcnow().timestamp() * 1000)}",
        "application_id": int(application_id),
        "sender_type": sender_type,
        "content": content,
        "created_at": datetime.utcnow().isoformat()
    }

@app.get("/messages")
async def get_messages(
    application_id: int = Query(description="ID заявки"),
    db: Session = Depends(get_db)
):
    """Получить сообщения чата"""
    # Проверяем существование заявки
    application = get_job_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    # Возвращаем пустой список (в будущем можно добавить получение из БД)
    return {"messages": []}

if __name__ == "__main__":
    # Запуск сервера
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Автоматическая перезагрузка при изменении кода
        log_level="info"
    )
