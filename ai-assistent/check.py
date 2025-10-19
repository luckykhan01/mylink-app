from dotenv import load_dotenv
load_dotenv() 

from openai import OpenAI
client = OpenAI()  # ключ берётся из переменной окружения OPENAI_API_KEY

resp = client.responses.create(
    model="gpt-4.1-mini",
    input="Скажи одним предложением: это тестовый запрос."
)
print(resp.output_text)
