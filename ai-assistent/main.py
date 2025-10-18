from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Создаем экземпляр FastAPI приложения для AI ассистента
app = FastAPI(
    title="MyLink AI Assistant",
    description="AI сервис для приложения MyLink",
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

# Базовый маршрут
@app.get("/")
async def root():
    return {"message": "AI Assistant сервис работает!", "status": "running"}

# Маршрут для проверки здоровья
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "AI Assistant работает корректно"}

# Маршрут для обработки AI запросов
@app.post("/chat")
async def chat_with_ai(message: dict):
    # Здесь будет интеграция с AI моделью
    return {
        "message": f"AI получил сообщение: {message.get('text', '')}",
        "response": "Это базовый ответ от AI ассистента. Интеграция с AI моделью будет добавлена позже.",
        "status": "processed"
    }

# Маршрут для получения информации о AI сервисе
@app.get("/info")
async def ai_info():
    return {
        "name": "MyLink AI Assistant",
        "version": "1.0.0",
        "description": "AI сервис для обработки запросов",
        "capabilities": [
            "Обработка текстовых запросов",
            "Генерация ответов",
            "Анализ контента"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
