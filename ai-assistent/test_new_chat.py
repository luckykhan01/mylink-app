#!/usr/bin/env python3
"""
Тестовый скрипт для проверки нового постепенного чата с ассистентом
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_chat_without_resume():
    """Тест 1: Чат без резюме - ассистент должен собирать данные постепенно"""
    print("\n" + "="*80)
    print("ТЕСТ 1: Чат без резюме")
    print("="*80)
    
    vacancy_text = """
    Senior Python Developer
    Требования:
    - Опыт работы от 5 лет
    - Python, FastAPI, PostgreSQL
    - Английский язык - B2+
    - Локация: Москва
    - Зарплата: 300000-400000 руб
    """
    
    # Начинаем чат БЕЗ резюме
    print("\n📤 Запрос: POST /chat/start (без резюме)")
    response = requests.post(
        f"{BASE_URL}/chat/start",
        json={
            "vacancy_text": vacancy_text,
            "cv_text": None  # Резюме нет!
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Ошибка: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    session_id = result["session_id"]
    
    print(f"\n✅ Сессия создана: {session_id}")
    print(f"📊 Этап диалога: {result['dialog_stage']}")
    print(f"📈 Релевантность: {result['relevance_percent']}%")
    print(f"\n🤖 Ассистент: {result['bot_reply']}")
    
    # Симулируем диалог
    candidate_answers = [
        "Меня зовут Иван Петров",
        "Я Python разработчик",
        "У меня 3 года опыта",
        "Я живу в Санкт-Петербурге",
        "Я закончил ИТМО по специальности программная инженерия",
        "Python, Django, REST API, PostgreSQL",
        "Английский - B1, русский - родной",
        "Я ожидаю зарплату около 350000 рублей",
        "Меня интересует полная занятость, готов рассматривать удаленную работу"
    ]
    
    for i, answer in enumerate(candidate_answers):
        print(f"\n--- Вопрос {i+1} ---")
        print(f"👤 Кандидат: {answer}")
        
        response = requests.post(
            f"{BASE_URL}/chat/turn",
            json={
                "session_id": session_id,
                "message_from_candidate": answer
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Ошибка: {response.status_code}")
            break
        
        result = response.json()
        print(f"📊 Этап: {result['dialog_stage']}")
        print(f"📈 Релевантность: {result['relevance_percent']}%")
        print(f"🤖 Ассистент: {result['bot_reply']}")
        
        if result['is_completed']:
            print("\n✅ Диалог завершен!")
            break
        
        # Продолжаем до тех пор, пока не закончится диалог или вопросы
        if i >= 15:  # Ограничение для безопасности
            print("\n⚠️ Достигнут лимит итераций")
            break

def test_chat_with_resume():
    """Тест 2: Чат с резюме - ассистент должен сразу задавать вопросы о несоответствиях"""
    print("\n" + "="*80)
    print("ТЕСТ 2: Чат с резюме")
    print("="*80)
    
    vacancy_text = """
    Senior Python Developer
    Требования:
    - Опыт работы от 5 лет
    - Python, FastAPI, PostgreSQL
    - Английский язык - B2+
    - Локация: Москва
    - Зарплата: 300000-400000 руб
    """
    
    cv_text = """
    Иван Петров
    Python разработчик
    Опыт: 3 года
    Город: Санкт-Петербург
    
    Навыки: Python, Django, REST API, PostgreSQL
    Образование: ИТМО, программная инженерия
    Языки: русский (родной), английский (B1)
    Зарплата: 350000 руб
    Формат работы: полная занятость, удаленно
    """
    
    print("\n📤 Запрос: POST /chat/start (с резюме)")
    response = requests.post(
        f"{BASE_URL}/chat/start",
        json={
            "vacancy_text": vacancy_text,
            "cv_text": cv_text  # Резюме есть!
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Ошибка: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    session_id = result["session_id"]
    
    print(f"\n✅ Сессия создана: {session_id}")
    print(f"📊 Этап диалога: {result['dialog_stage']}")
    print(f"📈 Релевантность: {result['relevance_percent']}%")
    print(f"📝 Причины несоответствий: {result['reasons']}")
    print(f"\n🤖 Ассистент: {result['bot_reply']}")
    
    # Симулируем несколько ответов
    candidate_answers = [
        "Да, я готов к переезду в Москву или рассматриваю удаленную работу",
        "Хотя у меня 3 года опыта, я работал над крупными проектами и имею опыт руководства командой",
        "Я активно изучаю английский и готов сдать экзамен для подтверждения уровня",
        "Да, я готов обсудить условия",
        "Мои карьерные цели - стать тимлидом в течение 2 лет",
        "Да, готов рассмотреть релокацию за границу"
    ]
    
    for i, answer in enumerate(candidate_answers):
        print(f"\n--- Вопрос {i+1} ---")
        print(f"👤 Кандидат: {answer}")
        
        response = requests.post(
            f"{BASE_URL}/chat/turn",
            json={
                "session_id": session_id,
                "message_from_candidate": answer
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Ошибка: {response.status_code}")
            break
        
        result = response.json()
        print(f"📊 Этап: {result['dialog_stage']}")
        print(f"📈 Релевантность: {result['relevance_percent']}%")
        print(f"🤖 Ассистент: {result['bot_reply']}")
        
        if result['is_completed']:
            print("\n✅ Диалог завершен!")
            print(f"\n📋 Итоговая сводка для работодателя:")
            print(result['summary_for_employer'])
            break

if __name__ == "__main__":
    print("\n🚀 Тестирование нового постепенного чата с ассистентом")
    print("Убедитесь, что AI-ассистент запущен на http://localhost:8001")
    
    try:
        # Проверяем доступность
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ AI-ассистент доступен")
        else:
            print("⚠️ AI-ассистент не отвечает должным образом")
    except Exception as e:
        print(f"❌ Не удалось подключиться к AI-ассистенту: {e}")
        print("Запустите: cd ai-assistent && python main.py")
        exit(1)
    
    # Запускаем тесты
    test_chat_without_resume()
    test_chat_with_resume()
    
    print("\n" + "="*80)
    print("✅ Все тесты завершены!")
    print("="*80)

