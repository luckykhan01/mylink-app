import httpx
import os
from typing import Dict, Any, Optional
from fastapi import HTTPException

class AIAssistantClient:
    """Клиент для взаимодействия с AI-ассистентом"""
    
    def __init__(self):
        self.base_url = os.getenv("AI_ASSISTANT_URL", "http://ai-assistent:8001")
        self.timeout = 30.0
    
    async def parse_cv(self, cv_text: str) -> Dict[str, Any]:
        """Парсинг резюме кандидата"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/parse",
                    json={"text": cv_text, "kind": "cv"}
                )
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI Assistant недоступен: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ошибка AI Assistant: {e.response.text}")
    
    async def parse_vacancy(self, vacancy_text: str) -> Dict[str, Any]:
        """Парсинг описания вакансии"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/parse",
                    json={"text": vacancy_text, "kind": "vacancy"}
                )
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI Assistant недоступен: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ошибка AI Assistant: {e.response.text}")
    
    async def analyze_application(self, cv_text: str, vacancy_text: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Анализ соответствия кандидата и вакансии"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/analyze",
                    json={
                        "cv_text": cv_text,
                        "vacancy_text": vacancy_text,
                        "session_id": session_id
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI Assistant недоступен: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ошибка AI Assistant: {e.response.text}")
    
    async def chat_turn(self, session_id: str, message: str) -> Dict[str, Any]:
        """Отправка сообщения в чат с кандидатом"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/turn",
                    json={
                        "session_id": session_id,
                        "message_from_candidate": message
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI Assistant недоступен: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ошибка AI Assistant: {e.response.text}")
    
    async def get_session(self, session_id: str) -> Dict[str, Any]:
        """Получение информации о сессии"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/sessions/{session_id}")
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"AI Assistant недоступен: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ошибка AI Assistant: {e.response.text}")

# Глобальный экземпляр клиента
ai_client = AIAssistantClient()
