#!/usr/bin/env python3
"""
Простой скрипт для тестирования AI Assistant API без фронтенда
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_parse_cv():
    """Тестирует парсинг резюме"""
    print("=== Тестирование парсинга резюме ===")
    data = {
        "text": "Алматы, Backend 2 года, FastAPI, англ B2, 600000 KZT, фуллтайм",
        "kind": "cv"
    }
    
    response = requests.post(f"{BASE_URL}/parse", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✅ Успешно!")
        print(f"Город: {result['candidate']['city']}")
        print(f"Опыт: {result['candidate']['experience_years']} лет")
        print(f"Позиция: {result['candidate']['position']}")
        print(f"Навыки: {result['candidate']['skills']}")
        print(f"Зарплата: {result['candidate']['salary_expectation']}")
        return result['candidate']
    else:
        print(f"❌ Ошибка: {response.status_code}")
        print(response.text)
        return None

def test_parse_vacancy():
    """Тестирует парсинг вакансии"""
    print("\n=== Тестирование парсинга вакансии ===")
    data = {
        "text": "Ищем Backend в Алматы, 3+ года, Python/FastAPI, фуллтайм, 500-700 тыс.",
        "kind": "vacancy"
    }
    
    response = requests.post(f"{BASE_URL}/parse", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✅ Успешно!")
        print(f"Город: {result['vacancy']['city']}")
        print(f"Опыт: {result['vacancy']['min_experience_years']} лет")
        print(f"Позиция: {result['vacancy']['required_position']}")
        print(f"Навыки: {result['vacancy']['must_have_skills']}")
        print(f"Зарплата: {result['vacancy']['salary_min']}-{result['vacancy']['salary_max']}")
        return result['vacancy']
    else:
        print(f"❌ Ошибка: {response.status_code}")
        print(response.text)
        return None

def test_analyze():
    """Тестирует анализ соответствия"""
    print("\n=== Тестирование анализа соответствия ===")
    data = {
        "cv_text": "Алматы, Backend 2 года, FastAPI, англ B2, 600000 KZT, фуллтайм",
        "vacancy_text": "Ищем Backend в Алматы, 3+ года, Python/FastAPI, фуллтайм, 500-700 тыс."
    }
    
    response = requests.post(f"{BASE_URL}/analyze", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✅ Успешно!")
        print(f"Релевантность: {result['relevance_percent']}%")
        print(f"Причины несоответствий: {result['reasons']}")
        print(f"Уточняющие вопросы: {result['followup_questions'][:2]}")  # Показываем только первые 2
        print(f"Session ID: {result['session_id']}")
        return result['session_id']
    else:
        print(f"❌ Ошибка: {response.status_code}")
        print(response.text)
        return None

def test_chat(session_id):
    """Тестирует чат с кандидатом"""
    if not session_id:
        print("\n❌ Нет session_id для тестирования чата")
        return
        
    print("\n=== Тестирование чата ===")
    data = {
        "session_id": session_id,
        "message_from_candidate": "У меня есть опыт работы с Python, но не указал его в резюме. Также изучаю новые технологии."
    }
    
    response = requests.post(f"{BASE_URL}/chat/turn", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✅ Успешно!")
        print(f"Ответы бота: {result['bot_replies']}")
        print(f"Обновленная релевантность: {result['relevance_percent']}%")
    else:
        print(f"❌ Ошибка: {response.status_code}")
        print(response.text)

def test_session_info(session_id):
    """Тестирует получение информации о сессии"""
    if not session_id:
        print("\n❌ Нет session_id для тестирования сессии")
        return
        
    print("\n=== Тестирование информации о сессии ===")
    response = requests.get(f"{BASE_URL}/sessions/{session_id}")
    if response.status_code == 200:
        result = response.json()
        print("✅ Успешно!")
        print(f"Создана: {result['created_at']}")
        print(f"Количество сообщений в чате: {len(result['chat'])}")
        print(f"Последний анализ: релевантность {result['last_analysis']['relevance']}%")
    else:
        print(f"❌ Ошибка: {response.status_code}")
        print(response.text)

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование AI Assistant API")
    print("=" * 50)
    
    # Проверяем, что сервер запущен
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code != 200:
            print("❌ Сервер не запущен! Запустите: uvicorn main:app --reload")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Не удается подключиться к серверу! Запустите: uvicorn main:app --reload")
        return
    
    print("✅ Сервер запущен")
    
    # Тестируем все endpoints
    cv = test_parse_cv()
    vacancy = test_parse_vacancy()
    session_id = test_analyze()
    test_chat(session_id)
    test_session_info(session_id)
    
    print("\n" + "=" * 50)
    print("🎉 Тестирование завершено!")

if __name__ == "__main__":
    main()
