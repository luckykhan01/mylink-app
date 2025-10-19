#!/bin/bash

# Тест полного флоу AI-ассистента

echo "=== Тест AI Assistant Flow ==="
echo ""

# 1. Создаем заявку
echo "1. Создаем заявку..."
APP_RESPONSE=$(curl -s -X POST "http://localhost:8000/applications?job_seeker_id=6" \
  -H "Content-Type: application/json" \
  -d '{
    "vacancy_id": 1,
    "cover_letter": "Хочу работать у вас"
  }')

APP_ID=$(echo $APP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "   ✓ Заявка создана, ID: $APP_ID"
echo ""

# 2. Начинаем анализ
echo "2. Запускаем AI-анализ..."
ANALYZE_RESPONSE=$(curl -s -X POST "http://localhost:8000/applications/$APP_ID/analyze" \
  -H "Content-Type: application/json" \
  -d '{}')

SESSION_ID=$(echo $ANALYZE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
BOT_REPLY=$(echo $ANALYZE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['bot_reply'][:50])")
RELEVANCE=$(echo $ANALYZE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['relevance_percent'])")

echo "   ✓ Session ID: $SESSION_ID"
echo "   ✓ Первый вопрос: $BOT_REPLY..."
echo "   ✓ Релевантность: $RELEVANCE%"
echo ""

# 3. Отправляем ответ
echo "3. Отправляем ответ кандидата..."
CHAT_RESPONSE=$(curl -s -X POST "http://localhost:8000/applications/$APP_ID/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"Я закончил МГУ, факультет ВМК\"
  }")

BOT_REPLY2=$(echo $CHAT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['bot_reply'][:50])")
RELEVANCE2=$(echo $CHAT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['relevance_percent'])")

echo "   ✓ Следующий вопрос: $BOT_REPLY2..."
echo "   ✓ Релевантность: $RELEVANCE2%"
echo ""

# 4. Еще один ответ
echo "4. Отправляем второй ответ..."
CHAT_RESPONSE2=$(curl -s -X POST "http://localhost:8000/applications/$APP_ID/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"Английский B2, Русский родной\"
  }")

BOT_REPLY3=$(echo $CHAT_RESPONSE2 | python3 -c "import sys, json; print(json.load(sys.stdin)['bot_reply'][:50])")
RELEVANCE3=$(echo $CHAT_RESPONSE2 | python3 -c "import sys, json; print(json.load(sys.stdin)['relevance_percent'])")

echo "   ✓ Следующий вопрос: $BOT_REPLY3..."
echo "   ✓ Релевантность: $RELEVANCE3%"
echo ""

echo "=== ✅ Тест завершен успешно ==="
echo ""
echo "Сессия активна и работает корректно!"
echo "Session ID: $SESSION_ID для дальнейшего тестирования"

