"""
Простой тест AI-ассистента
Запуск: python test_simple.py
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_health():
    """Проверка здоровья сервиса"""
    print("\n=== Проверка здоровья сервиса ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.status_code == 200

def test_chat_start():
    """Тест начала диалога"""
    print("\n=== Тест начала диалога ===")
    
    vacancy_text = """
    Senior Python Developer
    
    Требования:
    - Опыт работы с Python 5+ лет
    - Знание Django, FastAPI
    - Опыт работы с PostgreSQL
    - Git, Docker
    - Английский язык - B2+
    
    Локация: Алматы (офис)
    Зарплата: 500,000 - 700,000 тг
    """
    
    cv_text = """
    Иван Петров
    Python разработчик
    
    Опыт работы: 3 года
    Навыки: Python, Django, PostgreSQL, Git
    Английский: B1
    Локация: Астана
    """
    
    payload = {
        "vacancy_text": vacancy_text,
        "cv_text": cv_text
    }
    
    response = requests.post(f"{BASE_URL}/chat/start", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nSession ID: {data['session_id']}")
        print(f"Relevance: {data['relevance_percent']}%")
        print(f"Stage: {data['dialog_stage']}")
        print(f"Completed: {data['is_completed']}")
        print(f"\nBot reply:\n{data['bot_reply']}")
        print(f"\nSummary for employer: {data['summary_for_employer']}")
        print(f"Reasons: {data['reasons']}")
        return data
    else:
        print(f"Error: {response.text}")
        return None

def test_chat_turn(session_id):
    """Тест продолжения диалога"""
    print("\n=== Тест продолжения диалога ===")
    
    payload = {
        "session_id": session_id,
        "message_from_candidate": "Да, я готов переехать в Алматы и готов подтянуть английский до B2"
    }
    
    response = requests.post(f"{BASE_URL}/chat/turn", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nRelevance: {data['relevance_percent']}%")
        print(f"Stage: {data['dialog_stage']}")
        print(f"Completed: {data['is_completed']}")
        print(f"\nBot reply:\n{data['bot_reply']}")
        print(f"\nSummary for employer: {data['summary_for_employer']}")
        print(f"Reasons: {data['reasons']}")
        return data
    else:
        print(f"Error: {response.text}")
        return None

def test_get_session(session_id):
    """Тест получения информации о сессии"""
    print("\n=== Тест получения сессии ===")
    
    response = requests.get(f"{BASE_URL}/sessions/{session_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Session info: {json.dumps(data, indent=2, ensure_ascii=False)}")
        return data
    else:
        print(f"Error: {response.text}")
        return None

def main():
    """Основная функция"""
    print("🤖 SmartBot AI Assistant - Simple Test")
    print("=" * 50)
    
    # 1. Проверка здоровья
    if not test_health():
        print("\n❌ Service is not healthy. Please start the service first:")
        print("   python main.py")
        return
    
    print("\n✅ Service is healthy!")
    
    # 2. Начало диалога
    session_data = test_chat_start()
    if not session_data:
        print("\n❌ Failed to start chat")
        return
    
    print("\n✅ Chat started successfully!")
    session_id = session_data['session_id']
    
    # 3. Продолжение диалога (если не завершен)
    if not session_data['is_completed']:
        turn_data = test_chat_turn(session_id)
        if turn_data:
            print("\n✅ Chat turn completed!")
    
    # 4. Получение информации о сессии
    test_get_session(session_id)
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to AI Assistant service.")
        print("   Please make sure the service is running:")
        print("   python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")

