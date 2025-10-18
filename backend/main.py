from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Создаем экземпляр FastAPI приложения
app = FastAPI(
    title="MyLink API",
    description="API сервер для приложения MyLink",
    version="1.0.0"
)

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

if __name__ == "__main__":
    # Запуск сервера
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Автоматическая перезагрузка при изменении кода
        log_level="info"
    )
